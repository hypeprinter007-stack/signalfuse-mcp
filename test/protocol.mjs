#!/usr/bin/env node
/**
 * Layer 2 — MCP protocol CI. Drives the REAL server over stdio.
 * Run: node --test test/protocol.mjs
 *
 * Network-free: initialize + tools/list are local; the error-contract calls use
 * pre-fetch validation paths (unknown tool, invalid strategy_id) that throw
 * before any fetch, so no live SignalFuse call is made.
 *
 * Covers:
 *   - initialize  → serverInfo.name + version == package.json (runtime-drift guard;
 *                   this repo shipped runtime 1.0.0 vs package 1.1.2 before)
 *   - tools/list  → exact 11-tool inventory contract + object inputSchema each
 *   - tools/call unknown tool      → clean isError, not a throw
 *   - tools/call invalid strategy  → clean isError (pre-fetch validation holds)
 *
 * NOT here (needs the network path mocked — layer 3): 402 handling, upstream
 * 4xx/5xx, timeout, and credit_token redaction (see test/redaction.mjs).
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const EXPECTED_TOOLS = new Set([
  "get_signal",
  "get_regime",
  "get_sentiment",
  "get_signal_batch",
  "get_arena_leaderboard",
  "get_arena_signal",
  "search_brave",
  "search_tavily",
  "get_pricing",
  "execute_code",
  "check_balance",
]);

let client;

before(async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../index.js", import.meta.url).pathname],
    env: { PATH: process.env.PATH, SIGNALFUSE_API_URL: "http://127.0.0.1:9" },
    stderr: "ignore",
  });
  client = new Client({ name: "protocol-ci", version: "0.0.0" }, { capabilities: {} });
  await client.connect(transport);
});

after(async () => {
  await client?.close();
});

test("initialize: serverInfo name + version match the package", () => {
  const info = client.getServerVersion();
  assert.equal(info?.name, "signalfuse", "serverInfo.name");
  assert.equal(
    info?.version,
    pkg.version,
    `runtime serverInfo.version (${info?.version}) must equal package.json (${pkg.version}) — version drift`
  );
});

test("tools/list: exact 11-tool inventory contract", async () => {
  const { tools } = await client.listTools();
  const names = new Set(tools.map((t) => t.name));

  assert.equal(tools.length, EXPECTED_TOOLS.size, `expected ${EXPECTED_TOOLS.size} tools, got ${tools.length}`);
  const missing = [...EXPECTED_TOOLS].filter((n) => !names.has(n));
  const extra = [...names].filter((n) => !EXPECTED_TOOLS.has(n));
  assert.deepEqual(missing, [], `missing tools: ${missing.join(", ")}`);
  assert.deepEqual(extra, [], `unexpected tools: ${extra.join(", ")}`);

  for (const t of tools) {
    assert.ok(t.description?.length > 0, `${t.name}: has description`);
    assert.equal(t.inputSchema?.type, "object", `${t.name}: inputSchema.type === "object"`);
  }
});

test("tools/call unknown tool → clean isError, not a throw", async () => {
  const res = await client.callTool({ name: "does_not_exist", arguments: {} });
  assert.equal(res.isError, true);
  assert.match(res.content?.[0]?.text ?? "", /Unknown tool/i);
});

test("tools/call invalid strategy_id → clean isError (pre-fetch validation)", async () => {
  const res = await client.callTool({
    name: "get_arena_signal",
    arguments: { strategy_id: "'; DROP TABLE --", symbol: "BTC" },
  });
  assert.equal(res.isError, true, "invalid strategy must be rejected before any fetch");
  assert.match(res.content?.[0]?.text ?? "", /Invalid strategy_id/i);
});

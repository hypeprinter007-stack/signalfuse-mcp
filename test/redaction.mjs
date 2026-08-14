#!/usr/bin/env node
/**
 * Credential-redaction test (shared pattern with anchor-x402-mcp).
 *
 * NOTE ON THREAT MODEL: unlike anchor-x402-mcp, this server holds NO ambient
 * secret — there is no wallet/API key in its environment. The only credential
 * it touches is the caller-supplied `credit_token`, which it forwards as an
 * X-Credit-Token header. So the contract this pins is narrower but still real:
 * a bearer token the caller passes must never be reflected back into an error
 * message, a tool result, or stderr (which would turn a debug log or an error
 * bubbled up to the model into a credential disclosure).
 *
 * Network-free / no live calls: SIGNALFUSE_API_URL points at an unroutable host,
 * so the call fails at the socket and we inspect the error path.
 *
 * Run: node --test test/redaction.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SENTINEL = "credtok_LEAKME_deadbeef0123456789";

test("caller credit_token is not reflected into tool result or stderr on error", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../index.js", import.meta.url).pathname],
    env: { PATH: process.env.PATH, SIGNALFUSE_API_URL: "http://127.0.0.1:9" },
    stderr: "pipe",
  });
  let stderr = "";
  transport.stderr?.on("data", (c) => (stderr += c.toString()));
  const client = new Client({ name: "redaction-ci", version: "0.0.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    // A paid call carrying a bearer token; the unroutable host forces the error path.
    const res = await client.callTool({
      name: "get_signal",
      arguments: { symbol: "BTC", credit_token: SENTINEL },
    });
    assert.equal(res.isError, true, "network failure must surface as isError");
    assert.ok(!JSON.stringify(res).includes(SENTINEL), "credit_token leaked into tool result");
    assert.ok(!stderr.includes(SENTINEL), "credit_token leaked into stderr");
  } finally {
    await client.close();
  }
});

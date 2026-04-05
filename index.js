#!/usr/bin/env node
/**
 * signalfuse-mcp — MCP server for SignalFuse trading intelligence API
 * Install: npm install -g signalfuse-mcp
 * Add to Claude Desktop config and Claude Code will auto-discover it.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = "https://api.signalfuse.co";

const server = new Server(
  { name: "signalfuse", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_signal",
      description:
        "Get composite trading signal for a crypto asset. Returns sentiment, " +
        "macro regime (risk_on/risk_off), funding rate bias, OI delta, " +
        "signal strength (0-100), confidence, and direction (long/short/neutral). " +
        "Powered by SignalFuse.",
      inputSchema: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Asset ticker, e.g. BTC, ETH, SOL, DOGE, PEPE",
          },
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
        required: ["symbol"],
      },
    },
    {
      name: "get_regime",
      description:
        "Get current macro risk regime — risk_on, risk_off, or neutral. " +
        "Useful for position sizing and directional bias.",
      inputSchema: {
        type: "object",
        properties: {
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
      },
    },
    {
      name: "get_sentiment",
      description: "Get raw social sentiment breakdown for a crypto asset.",
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Asset ticker" },
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
        required: ["symbol"],
      },
    },
    {
      name: "get_signal_batch",
      description:
        "Get fused signals for multiple assets at once. " +
        "Pass comma-separated symbols or omit for all supported assets.",
      inputSchema: {
        type: "object",
        properties: {
          symbols: {
            type: "string",
            description: "Comma-separated tickers, e.g. BTC,ETH,SOL. Omit for all.",
          },
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const headers = {};
  if (args?.credit_token) headers["X-Credit-Token"] = args.credit_token;

  try {
    let url = BASE_URL;
    // Validate symbol: alphanumeric only, max 10 chars
    const sanitize = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);

    if (name === "get_signal") url += `/v1/signal/${sanitize(args.symbol)}`;
    else if (name === "get_regime") url += "/v1/regime";
    else if (name === "get_sentiment") url += `/v1/sentiment/${sanitize(args.symbol)}`;
    else if (name === "get_signal_batch") {
      url += "/v1/signal/batch";
      if (args?.symbols) {
        const safe = args.symbols.split(",").map(s => sanitize(s)).filter(Boolean).join(",");
        const params = new URLSearchParams({ symbols: safe });
        url += `?${params.toString()}`;
      }
    }
    else throw new Error(`Unknown tool: ${name}`);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      // Surface 402 payment required clearly
      if (res.status === 402) {
        const body = await res.json().catch(() => ({}));
        return {
          content: [{
            type: "text",
            text: `Payment required. Get 25 free credits:\n` +
              `curl -X POST ${BASE_URL}/v1/credits/trial -H "Content-Type: application/json" ` +
              `-d '{"wallet":"YOUR_ETH_ADDRESS"}'\n\n` +
              `Then pass the credit_token in subsequent calls.`,
          }],
          isError: true,
        };
      }
      throw new Error(`SignalFuse API error: ${res.status}`);
    }
    const data = await res.json();

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("SignalFuse MCP server running");

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
    {
      name: "get_arena_leaderboard",
      description:
        "Get the Strategy Arena leaderboard. Returns an array of strategies " +
        "with wins, losses, total_pnl_bp, win_rate, and total_income_usd. Free endpoint.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_arena_signal",
      description:
        "Get a signal from a specific Strategy Arena strategy for a given asset. " +
        "Returns direction, score, and confidence. Paid endpoint.",
      inputSchema: {
        type: "object",
        properties: {
          strategy_id: {
            type: "string",
            description:
              "Strategy identifier. One of: rsi_7_extremes, ema_5_breakout, " +
              "bb_squeeze, rsi_reversion_swing, vwap_reversion",
          },
          symbol: {
            type: "string",
            description: "Asset ticker, e.g. BTC, ETH, SOL",
          },
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
        required: ["strategy_id", "symbol"],
      },
    },
    {
      name: "search_brave",
      description:
        "Search the web using Brave Search via SignalFuse gateway. " +
        "Paid endpoint (x402). Returns Brave search results.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query string",
          },
          count: {
            type: "number",
            description: "Number of results to return (default 10)",
          },
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "search_tavily",
      description:
        "Search the web using Tavily via SignalFuse gateway. " +
        "Paid endpoint (x402). Returns Tavily search results.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query string",
          },
          search_depth: {
            type: "string",
            description: 'Search depth: "basic" or "advanced"',
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return",
          },
          credit_token: {
            type: "string",
            description: "Optional credit token for bulk-prepaid access",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_pricing",
      description:
        "Get pricing info for all SignalFuse API endpoints. Free endpoint.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "execute_code",
      description:
        "Execute code in a sandboxed E2B environment. " +
        "Supports Python (default) and JavaScript. Max 60s timeout. Paid endpoint.",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Code to execute",
          },
          language: {
            type: "string",
            description: "Programming language (python or javascript)",
            enum: ["python", "javascript"],
          },
          timeout: {
            type: "number",
            description: "Execution timeout in seconds (max 60)",
          },
          credit_token: {
            type: "string",
            description: "Credit token for authentication (optional if using x402)",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "check_balance",
      description:
        "Check remaining credits for a prepaid credit token. " +
        "Returns wallet, credits_remaining, and pack info.",
      inputSchema: {
        type: "object",
        properties: {
          credit_token: {
            type: "string",
            description: "Credit token to check balance for",
          },
        },
        required: ["credit_token"],
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

    let fetchOptions = { headers };

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
    else if (name === "get_arena_leaderboard") url += "/v1/arena/leaderboard";
    else if (name === "get_arena_signal") {
      const VALID_STRATEGIES = ["rsi_7_extremes", "ema_5_breakout", "bb_squeeze", "rsi_reversion_swing", "vwap_reversion"];
      const stratId = (args.strategy_id || "").replace(/[^a-z0-9_]/gi, "").slice(0, 30);
      if (!VALID_STRATEGIES.includes(stratId))
        throw new Error(`Invalid strategy_id. Must be one of: ${VALID_STRATEGIES.join(", ")}`);
      url += `/v1/arena/${stratId}/${sanitize(args.symbol)}`;
    }
    else if (name === "search_brave") {
      const q = (args.query || "").slice(0, 500);
      const params = new URLSearchParams({ q });
      if (args.count) params.set("count", String(Math.min(Math.max(1, args.count), 50)));
      url += `/v1/gateway/search/brave?${params.toString()}`;
    }
    else if (name === "search_tavily") {
      url += "/v1/gateway/search/tavily";
      const body = { query: (args.query || "").slice(0, 500) };
      if (args.search_depth) body.search_depth = args.search_depth === "advanced" ? "advanced" : "basic";
      if (args.max_results) body.max_results = Math.min(Math.max(1, args.max_results), 50);
      fetchOptions.method = "POST";
      fetchOptions.headers = { ...headers, "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(body);
    }
    else if (name === "execute_code") {
      url += "/v1/gateway/execute/e2b";
      const body = { code: (args.code || "").slice(0, 10000) };
      if (args.language) body.language = args.language === "javascript" ? "javascript" : "python";
      if (args.timeout) body.timeout = Math.min(Math.max(1, args.timeout), 60);
      fetchOptions.method = "POST";
      fetchOptions.headers = { ...headers, "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(body);
    }
    else if (name === "get_pricing") url += "/v1/pricing";
    else if (name === "check_balance") url += "/v1/credits/balance";
    else throw new Error(`Unknown tool: ${name}`);

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      // Surface 402 payment required clearly
      if (res.status === 402) {
        const body = await res.json().catch(() => ({}));
        return {
          content: [{
            type: "text",
            text: `Payment required. Get 5 free credits:\n` +
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

/**
 * elizaos-signalfuse — ElizaOS plugin for SignalFuse
 * Gives ElizaOS agents live trading signal awareness.
 */
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

const BASE_URL = "https://api.signalfuse.co";

export const getSignalAction: Action = {
  name: "GET_TRADING_SIGNAL",
  similes: ["CHECK_SIGNAL", "MARKET_SIGNAL", "TRADING_INTEL"],
  description:
    "Fetch fused trading signal for a crypto asset from SignalFuse. " +
    "Returns direction, signal strength, confidence, macro regime, and components.",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("signal") ||
      text.includes("sentiment") ||
      text.includes("regime") ||
      text.includes("trade") ||
      text.includes("buy") ||
      text.includes("sell")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ) => {
    const assets = ["BTC", "ETH", "SOL", "DOGE", "PEPE", "WIF", "BONK", "ARB", "OP", "AVAX"];
    const text = message.content.text?.toUpperCase() || "";
    const symbol = assets.find((a) => text.includes(a)) || "BTC";

    const headers: Record<string, string> = {};
    const token = runtime.getSetting?.("SIGNALFUSE_CREDIT_TOKEN");
    if (token) headers["X-Credit-Token"] = token;

    const res = await fetch(`${BASE_URL}/v1/signal/${symbol}`, { headers });
    const data = await res.json();

    return {
      text:
        `${symbol} Signal via SignalFuse: ` +
        `Strength ${data.signal_strength}/100 | ` +
        `${data.signal} | regime: ${data.regime} | ` +
        `confidence: ${data.confidence}. ` +
        `API: https://signalfuse.co`,
    };
  },

  examples: [
    [
      { user: "user", content: { text: "What's the signal for ETH?" } },
      {
        user: "agent",
        content: {
          text: "ETH Signal via SignalFuse: Strength 71/100 | long | regime: risk_on | confidence: 0.82.",
          action: "GET_TRADING_SIGNAL",
        },
      },
    ],
  ],
};

export const getSentimentAction: Action = {
  name: "GET_SENTIMENT",
  similes: ["CHECK_SENTIMENT", "SOCIAL_SENTIMENT", "MARKET_MOOD"],
  description:
    "Fetch social and market sentiment for a crypto asset from SignalFuse. " +
    "Returns sentiment score and label.",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("sentiment") ||
      text.includes("mood") ||
      text.includes("social") ||
      text.includes("feeling")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ) => {
    const assets = ["BTC", "ETH", "SOL", "DOGE", "PEPE", "WIF", "BONK", "ARB", "OP", "AVAX"];
    const text = message.content.text?.toUpperCase() || "";
    const symbol = assets.find((a) => text.includes(a)) || "BTC";

    const headers: Record<string, string> = {};
    const token = runtime.getSetting?.("SIGNALFUSE_CREDIT_TOKEN");
    if (token) headers["X-Credit-Token"] = token;

    const res = await fetch(`${BASE_URL}/v1/sentiment/${symbol}`, { headers });
    const data = await res.json();

    return {
      text:
        `${symbol} Sentiment via SignalFuse: ` +
        `score=${data.score} | label=${data.label}. ` +
        `API: https://signalfuse.co`,
    };
  },

  examples: [
    [
      { user: "user", content: { text: "What's the sentiment for SOL?" } },
      {
        user: "agent",
        content: {
          text: "SOL Sentiment via SignalFuse: score=0.65 | label=bullish.",
          action: "GET_SENTIMENT",
        },
      },
    ],
  ],
};

export const getRegimeAction: Action = {
  name: "GET_REGIME",
  similes: ["CHECK_REGIME", "MACRO_REGIME", "RISK_REGIME"],
  description:
    "Fetch current macro risk regime from SignalFuse. " +
    "Returns regime (risk_on/risk_off/neutral) and confidence.",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("regime") ||
      text.includes("macro") ||
      text.includes("risk on") ||
      text.includes("risk off")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ) => {
    const headers: Record<string, string> = {};
    const token = runtime.getSetting?.("SIGNALFUSE_CREDIT_TOKEN");
    if (token) headers["X-Credit-Token"] = token;

    const res = await fetch(`${BASE_URL}/v1/regime`, { headers });
    const data = await res.json();

    return {
      text:
        `Macro Regime via SignalFuse: ` +
        `${data.regime} (confidence: ${data.confidence || "N/A"}). ` +
        `API: https://signalfuse.co`,
    };
  },

  examples: [
    [
      { user: "user", content: { text: "What's the current macro regime?" } },
      {
        user: "agent",
        content: {
          text: "Macro Regime via SignalFuse: risk_on (confidence: 0.78).",
          action: "GET_REGIME",
        },
      },
    ],
  ],
};

export const getSignalBatchAction: Action = {
  name: "GET_SIGNAL_BATCH",
  similes: ["ALL_SIGNALS", "BATCH_SIGNALS", "MARKET_OVERVIEW"],
  description:
    "Fetch fused trading signals for all supported crypto assets in one call. " +
    "Returns direction and signal strength for every asset.",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("batch") ||
      text.includes("all signals") ||
      text.includes("overview") ||
      text.includes("all assets") ||
      text.includes("market overview")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ) => {
    const headers: Record<string, string> = {};
    const token = runtime.getSetting?.("SIGNALFUSE_CREDIT_TOKEN");
    if (token) headers["X-Credit-Token"] = token;

    const res = await fetch(`${BASE_URL}/v1/signal/batch`, { headers });
    const data = await res.json();

    const signals = Array.isArray(data) ? data : data.signals || [];
    const summary = signals
      .map((s: any) => `${s.symbol}: ${s.signal} (${s.signal_strength}/100)`)
      .join(", ");

    return {
      text:
        `Signal Batch via SignalFuse: ${summary}. ` +
        `API: https://signalfuse.co`,
    };
  },

  examples: [
    [
      { user: "user", content: { text: "Give me all signals" } },
      {
        user: "agent",
        content: {
          text: "Signal Batch via SignalFuse: BTC: long (82/100), ETH: long (71/100), SOL: neutral (45/100).",
          action: "GET_SIGNAL_BATCH",
        },
      },
    ],
  ],
};

export const getArenaLeaderboardAction: Action = {
  name: "GET_ARENA_LEADERBOARD",
  similes: ["ARENA_RANKINGS", "STRATEGY_LEADERBOARD", "TOP_STRATEGIES"],
  description:
    "Fetch the Strategy Arena leaderboard showing top-performing strategy agents. " +
    "Free endpoint, no credit token required.",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("arena") ||
      text.includes("leaderboard") ||
      text.includes("ranking") ||
      text.includes("top strat")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ) => {
    const headers: Record<string, string> = {};
    const token = runtime.getSetting?.("SIGNALFUSE_CREDIT_TOKEN");
    if (token) headers["X-Credit-Token"] = token;

    const res = await fetch(`${BASE_URL}/v1/arena/leaderboard`, { headers });
    const data = await res.json();

    const entries = Array.isArray(data) ? data : data.leaderboard || [];
    const summary = entries
      .map((e: any) => `${e.strategy_id}: score=${e.score}, pnl=${e.pnl}`)
      .join(", ");

    return {
      text:
        `Arena Leaderboard via SignalFuse: ${summary}. ` +
        `API: https://signalfuse.co`,
    };
  },

  examples: [
    [
      { user: "user", content: { text: "Show me the arena leaderboard" } },
      {
        user: "agent",
        content: {
          text: "Arena Leaderboard via SignalFuse: momentum_v2: score=1840, pnl=+12.3%, mean_revert: score=1720, pnl=+8.1%.",
          action: "GET_ARENA_LEADERBOARD",
        },
      },
    ],
  ],
};

export default [
  getSignalAction,
  getSentimentAction,
  getRegimeAction,
  getSignalBatchAction,
  getArenaLeaderboardAction,
];

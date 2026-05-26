---
name: signalfuse
version: 1.0.0
homepage: https://signalfuse.co
description: Fourteen x402-paid services for AI agents on Base mainnet — fused crypto trading signals, ModernFinBERT sentiment, macro regime, head-to-head strategy arena, and a gated web-search + sandboxed code execution suite. Pay-per-call USDC. No API keys, no accounts.
permalink: /plugins/base-mcp.md
---

# SignalFuse — Base AI Agent plugin

SignalFuse exposes nine pay-per-call HTTPS endpoints (plus five free ones) that any Base AI Agent can invoke through Base MCP's native `initiate_x402_request` / `complete_x402_request` flow. Every paid call settles in USDC on Base mainnet via the Coinbase x402 facilitator. There are no API keys, no signup, no per-user accounts — the 402 challenge + EIP-3009 authorization handled by Base MCP is the entire auth surface.

This document is the canonical capability map. Drop it into your assistant's context (custom plugin / skill) so the model knows what SignalFuse offers, when each capability is appropriate, and how to set safe `maxPayment` caps.

## Prerequisites

The user's assistant must already have:

1. **Base MCP installed and connected.** See https://docs.base.org/ai-agents/quickstart.
2. **A Base Account with USDC balance** on Base mainnet. The cheapest call (`/v1/regime`, `/v1/arena/{strategy_id}/{symbol}`) costs **$0.001 USDC**. Holding **$0.20 USDC** covers every paid endpoint at least once, including the $0.075 batch.
3. **No additional credentials.** SignalFuse has no API keys, no allowlist, no per-user accounts. The 402 challenge IS the auth. Optional fallback: claim 5 free credits at `POST /v1/credits/trial` if the user prefers prepaid usage over x402.

## Onboarding gate

Before the first paid call in a session:

1. Call `get_wallets` to confirm the user is on a Base account.
2. Surface the price of the chosen endpoint to the user verbatim from this catalog (or fetch the live price from `GET /v1/pricing`, which is free).
3. Recommend a `maxPayment` cap equal to the listed price — SignalFuse pricing is fixed; no need to add headroom.

If the user's USDC balance is below the chosen endpoint's price, halt with a clear message: *"This call costs $X USDC on Base. Your Base account is below that balance — top up, or claim 5 free credits at https://signalfuse.co."*

## What's included

| # | Endpoint | Method | Price | Category | One-liner |
|---|----------|--------|-------|----------|-----------|
| 1 | `/v1/signal/{symbol}` | GET | $0.010 | trading | Fused directional signal (direction, strength, confidence, regime, components) |
| 2 | `/v1/signal/batch` | POST | $0.075 | trading | Signals for multiple symbols in one call |
| 3 | `/v1/sentiment/{symbol}` | GET | $0.002 | trading | ModernFinBERT sentiment (score + label) |
| 4 | `/v1/regime` | GET | $0.001 | trading | Macro regime classification (risk_on / risk_off / neutral) |
| 5 | `/v1/arena/{strategy_id}/{symbol}` | GET | $0.001 | trading | Signal from a specific backtested arena strategy |
| 6 | `/v1/gateway/search/brave` | GET | $0.008 | gateway | Brave web search (no Brave API key needed) |
| 7 | `/v1/gateway/search/tavily` | POST | $0.012 | gateway | Tavily AI-powered web search (no Tavily API key needed) |
| 8 | `/v1/gateway/search/fused` | POST | $0.015 | gateway | Brave + Tavily fused and deduplicated |
| 9 | `/v1/gateway/execute/e2b` | POST | $0.005 | gateway | Sandboxed Python/JS execution via E2B (no E2B API key needed) |
| F1 | `/v1/arena/leaderboard` | GET | FREE | trading | Strategy Arena rankings (win rate, P&L, income) |
| F2 | `/v1/pricing` | GET | FREE | meta | Live pricing for every endpoint |
| F3 | `/v1/credits/trial` | POST | FREE | meta | Claim 5 free credits (no signup) |
| F4 | `/v1/credits/balance` | GET | FREE | meta | Check remaining credit balance |
| F5 | `/v1/gateway/info` | GET | FREE | gateway | List gateway sub-services with prices and availability |

Base URL: **`https://api.signalfuse.co`**
Supported assets: **BTC, ETH, SOL, DOGE, PEPE, WIF, BONK, ARB, OP, AVAX**.
Arena strategies: **ema_5_breakout, rsi_7_extremes, rsi_reversion_swing, vwap_reversion**.

## Payment flow

For every paid call, use Base MCP's standard two-step pattern:

```json
{
  "server": "base-mcp",
  "action": "initiate_x402_request",
  "args": {
    "url": "https://api.signalfuse.co/v1/<endpoint>",
    "method": "GET",
    "maxPayment": "<exact price from catalog>"
  }
}
```

User receives a Base Account approval modal showing the URL, amount, and network. After approval:

```json
{
  "server": "base-mcp",
  "action": "complete_x402_request",
  "args": { "requestId": "<from step 1>" }
}
```

The framework handles the 402 challenge, EIP-3009 transferWithAuthorization signature, facilitator settlement, and request replay automatically. The response is the paid endpoint's normal JSON body — no payment-handling code needed in the plugin.

**Important:** SignalFuse settles the x402 payment on-chain *before* the handler runs. If a gateway upstream (Brave, Tavily, E2B) 502s after settlement, the customer is still charged. Smoke-test gateway endpoints before bulk runs; use `/v1/gateway/info` (free) to check availability first.

## Service catalog

### 1. `/v1/signal/{symbol}` — Fused directional signal · $0.010

Fused directional signal combining ModernFinBERT social sentiment, macro regime, and market structure into one number per asset.

**Use when:** entry/exit timing for systematic crypto strategies; LLM-driven trading agents; portfolio rebalancers needing a regime-aware bias.

**Path param:** `symbol` ∈ `[BTC, ETH, SOL, DOGE, PEPE, WIF, BONK, ARB, OP, AVAX]`.

**Returns:** `{ symbol, signal: "long"|"short"|"neutral", signal_strength: 0-100, confidence: 0-1, regime, components: {social, macro, market}, data_age_seconds, stale }`.

**Example:**
```json
{
  "server": "base-mcp",
  "action": "initiate_x402_request",
  "args": {
    "url": "https://api.signalfuse.co/v1/signal/BTC",
    "method": "GET",
    "maxPayment": "0.010"
  }
}
```

---

### 2. `/v1/signal/batch` — Multi-asset signals · $0.075

All-assets-in-one-call. Cheapest way to refresh a portfolio view (10 assets at $0.0075 each instead of $0.010).

**Use when:** the agent maintains a watchlist or rebalances across multiple assets each tick. Avoid for single-asset checks — `/v1/signal/{symbol}` is 7.5x cheaper per asset for that case.

**Body:** `{ "symbols": ["BTC", "ETH", ...] }` (any subset of the supported assets).

**Returns:** `{ signals: [{symbol, signal, signal_strength, confidence, regime, components, data_age_seconds, stale}, ...] }`.

---

### 3. `/v1/sentiment/{symbol}` — ModernFinBERT sentiment · $0.002

Aggregated sentiment score (−1.0 to +1.0) and label (`bearish` / `neutral` / `bullish`) across Twitter, Reddit, and Telegram, scored by a fine-tuned FinBERT.

**Use when:** the agent wants the social-only component without the fused regime + market overlay. Useful for narrative-driven sizing.

**Path param:** `symbol` ∈ the supported asset set.

**Returns:** `{ symbol, score: -1.0..1.0, label, model: "ModernFinBERT", updated_at }`.

---

### 4. `/v1/regime` — Macro regime classification · $0.001

Single classification: `risk_on`, `risk_off`, or `neutral`, plus a confidence score. Driven by Fed policy, BTC dominance, and market structure indicators.

**Use when:** sizing positions macro-aware (e.g. cut size in `risk_off`, lean into trend in `risk_on`). Pair with `/v1/signal/{symbol}` for component-aware decisions.

**Returns:** `{ regime: "risk_on"|"risk_off"|"neutral", confidence: 0..1 }`.

---

### 5. `/v1/arena/{strategy_id}/{symbol}` — Backtested strategy signal · $0.001

Live signal from one specific arena strategy. Use the free `/v1/arena/leaderboard` to pick which strategy is currently top-of-board, then call this for its signal.

**Path params:**
- `strategy_id` ∈ `[ema_5_breakout, rsi_7_extremes, rsi_reversion_swing, vwap_reversion]`
- `symbol` ∈ `[BTC, ETH, SOL, DOGE]`

**Returns:** `{ strategy_id, symbol, signal: "long"|"short"|"neutral", confidence }`.

**Use when:** the agent wants a deterministic single-strategy view (auditable, backtested) rather than the fused signal. Good for explainability — the strategy's logic is fixed and documented.

---

### 6. `/v1/gateway/search/brave` — Brave web search · $0.008

Brave Search proxied. Returns standard `web.results[]` with `title`, `url`, `description`. **No Brave API key needed** — payment is the auth.

**Query params:** `q=<query>` (required), `count=<1..20>` (default 10).

**Use when:** the agent needs keyword-style web results without managing a Brave subscription. Cheaper than Tavily for breadth searches that don't need synthesis.

---

### 7. `/v1/gateway/search/tavily` — Tavily AI web search · $0.012

Tavily AI-powered search with optional answer synthesis. **No Tavily API key needed.**

**Body:**
```json
{
  "query": "<required>",
  "search_depth": "basic" | "advanced",
  "topic": "general" | "news" | "finance",
  "max_results": 5,
  "include_answer": false
}
```

**Use when:** the agent wants a synthesized answer (`include_answer: true`) on top of recency-ranked results, or topic-filtered search (news, finance) that Brave doesn't support natively.

---

### 8. `/v1/gateway/search/fused` — Brave + Tavily merged · $0.015

Both Brave and Tavily run in parallel, then results deduped and re-ranked.

**Use when:** the agent wants keyword breadth (Brave) and synthesized recency (Tavily) but only one call. $0.015 vs. $0.020 if you ran both separately.

---

### 9. `/v1/gateway/execute/e2b` — Sandboxed code execution · $0.005

Run Python or JavaScript in a fresh E2B sandbox. **No E2B API key needed.** 60-second hard cap.

**Body:**
```json
{
  "code": "<source>",
  "language": "python" | "javascript",
  "timeout": 30
}
```

**Returns:** `{ stdout: [...], stderr: [...], error: null | "..." }`.

**Use when:** the agent needs to actually *run* code mid-conversation — math, data manipulation, API probing, plotting — without giving the host a code-exec tool. The sandbox is isolated and disposable.

**Caveats:** payment settles before execution. If your code times out, the charge stands; split long-running work into smaller calls.

---

### Free endpoints (no x402 charge)

Do **not** use `initiate_x402_request` for these — they return 200 immediately on a normal GET/POST without payment.

- **`GET /v1/arena/leaderboard`** — current strategy rankings: `[{ strategy_id, win_rate, total_signals, avg_return, sharpe }, ...]`. Use to pick which strategy to query.
- **`GET /v1/pricing`** — live pricing for every paid endpoint. Call this before showing a price to the user — the catalog above is canonical but `/v1/pricing` is authoritative.
- **`POST /v1/credits/trial`** — claim 5 free credits with `{ "wallet": "0x..." }`. Returns `{ credit_token, credits, wallet }`. Pass the token as `X-Credit-Token` header on paid endpoints to bypass x402 entirely.
- **`GET /v1/credits/balance`** — check remaining balance for a credit token. Requires `X-Credit-Token` header.
- **`GET /v1/gateway/info`** — list of gateway sub-services with current availability. Use this to fail fast before a paid gateway call that would settle and then 502.

## Surface compatibility

| Surface | POST endpoints | GET endpoints | Notes |
|---------|----------------|---------------|-------|
| Claude Code / Codex / Cursor | ✅ Full | ✅ Full | Harness HTTP tool or `npx -y signalfuse-mcp` MCP server |
| Claude Desktop with MCP | ✅ Full | ✅ Full | `npx -y signalfuse-mcp` in `claude_desktop_config.json` |
| Claude.ai (web) | ❌ web_request rejects POST to non-allowlisted hosts | ✅ Native | Use GET endpoints directly; for POST endpoints (`batch`, `tavily`, `fused`, `e2b`) use the credit-token flow with a paste-link pattern |
| ChatGPT consumer apps | ❌ Same restriction | ✅ Via user-paste | Same as above; the OpenAPI spec also imports cleanly into Custom GPTs |
| LangChain (Python) | ✅ Full | ✅ Full | `pip install signalfuse` → `from langchain_signalfuse import SignalFuseTool` |
| ElizaOS / CrewAI | ✅ Full | ✅ Full | See `elizaos_plugin.ts` in the `signalfuse-mcp` package; `crewai-signalfuse` on PyPI |

The OpenAPI spec at `https://api.signalfuse.co/openapi.json` is the source of truth for shape; this plugin doc is the curated capability map for LLMs.

## Multi-rail availability (outside Base MCP)

Base MCP's `initiate_x402_request` settles on **Base mainnet USDC only**. SignalFuse currently accepts:

- **Base USDC** (this plugin) — `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Coinbase-bridged).
- **Prepaid credit tokens** (`sf_...`) — rail-agnostic; mint at `POST /v1/credits/trial` (5 free) or purchase larger packs at https://signalfuse.co. Pass as `X-Credit-Token` header on any endpoint to bypass x402 entirely.

Solana USDC and JPYC (Polygon) rails are planned but not live as of v1.0.0. Watch `/.well-known/x402` for additions.

## Troubleshooting

**"Payment required" loops without an approval modal.** The `maxPayment` cap is below the listed price. Match it exactly from the catalog above, or fetch live from `GET /v1/pricing`.

**Hostname not allowlisted on web_request.** You're on a consumer surface (Claude.ai, ChatGPT). Either (a) use only GET endpoints, (b) mint a credit token and use the simpler `X-Credit-Token` header flow, or (c) move the workflow to Claude Code / Cursor / Desktop where POST is allowed.

**Signal response shows `"stale": true`.** The underlying upstream data is older than the staleness threshold for that asset. Treat as advisory, not actionable. Common during market closes or upstream provider outages — the payment still settled, but the signal isn't fresh.

**Gateway 502 after payment settled.** The upstream Brave / Tavily / E2B failed *after* SignalFuse settled the x402 charge. The customer is charged. Retry, or fall back to another gateway (e.g. Brave instead of Tavily). Pre-flight with `GET /v1/gateway/info` to avoid this when possible.

**`execute/e2b` returns `error: "TimeoutError"`.** You exceeded the per-call timeout (default 30s, capped at 60s). Payment still settled. Split the work into smaller calls.

**`401 Missing or invalid X-Credit-Token`.** The credit token expired or was never minted. Mint a fresh one via `POST /v1/credits/trial` (free, no signup) or use x402 instead.

**MCP tool not appearing in Claude.** `npx -y signalfuse-mcp` requires Node 18+. Restart the host (Claude Desktop / Code) after editing the MCP config. Test directly with `npx signalfuse-mcp` from a terminal first.

**Refund policy.** Out of band for x402-settled charges. Contact `hello@signalfuse.co` with the `requestId` from `complete_x402_request` + timestamp.

## Resources

- **Homepage:** https://signalfuse.co
- **API base:** https://api.signalfuse.co
- **Interactive playground (25 free calls/day/IP, no wallet):** https://signalfuse.co/play
- **Docs:** https://signalfuse.co/docs
- **OpenAPI JSON:** https://api.signalfuse.co/openapi.json
- **x402 discovery:** https://api.signalfuse.co/.well-known/x402
- **llms.txt:** https://api.signalfuse.co/llms.txt
- **Yield page (where x402 revenue routes):** https://signalfuse.co/divigent
- **MCP server (npm):** https://www.npmjs.com/package/signalfuse-mcp
- **Python client (PyPI):** https://pypi.org/project/signalfuse/
- **GitHub (MCP):** https://github.com/hypeprinter007-stack/signalfuse-mcp
- **Reference seller (open source, Apache 2.0):** https://github.com/hypeprinter007-stack/signalfuse-divigent-router
- **Support:** `hello@signalfuse.co`

## Disclaimer

SignalFuse is a data fusion API, not financial advice. Signals are mathematical composites derived from sentiment, macro, and market structure data. They can be wrong. Trade at your own risk.

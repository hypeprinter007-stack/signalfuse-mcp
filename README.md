# SignalFuse MCP Server

MCP server and REST API for crypto trading signals, sentiment analysis, macro regime classification, strategy arena, web search, and sandboxed code execution. Designed for AI agents, LLMs, and autonomous trading systems.

- **Base URL:** `https://api.signalfuse.co`
- **OpenAPI spec:** `https://api.signalfuse.co/openapi.json`
- **x402 discovery:** `https://api.signalfuse.co/.well-known/x402`
- **llms.txt:** `https://api.signalfuse.co/llms.txt`
- **Payment:** x402 USDC on Base (no API keys needed) or prepaid credit tokens
- **Free trial:** 5 credits, no signup required

## What SignalFuse Does

- Generates directional trading signals (long/short/neutral) for BTC, ETH, SOL, DOGE, PEPE, WIF, BONK, ARB, OP, AVAX with entry price, take-profit, and stop-loss levels
- Runs ModernFinBERT sentiment analysis on crypto social and news data
- Classifies the macro regime as risk-on, risk-off, or neutral using multi-factor economic indicators
- Operates a Strategy Arena where 4 AI strategies (EMA Breakout, RSI Extremes, RSI Reversion, VWAP Reversion) compete head-to-head with live P&L tracking
- Proxies web search through Brave Search and Tavily with result deduplication and fusion
- Executes Python and JavaScript code in sandboxed E2B environments (60s timeout)

## Installation

### npm (MCP server)

```bash
npx signalfuse-mcp
```

Or install globally:

```bash
npm install -g signalfuse-mcp
```

### Python client (x402 payments built in)

```bash
pip install signalfuse
```

## Endpoint Reference

| Method | Path | Description | Price |
|--------|------|-------------|-------|
| GET | `/v1/signal/{symbol}` | Fused directional signal with entry/TP/SL | $0.010 |
| GET | `/v1/signal/batch` | Signals for all assets in one call | $0.075 |
| GET | `/v1/sentiment/{symbol}` | ModernFinBERT sentiment analysis | $0.002 |
| GET | `/v1/regime` | Macro regime classification (risk-on/off/neutral) | $0.001 |
| GET | `/v1/arena/leaderboard` | Strategy Arena rankings | FREE |
| GET | `/v1/arena/{strategy_id}/{symbol}` | Signal from a specific arena strategy | $0.001 |
| GET | `/v1/gateway/search/brave` | Brave web search | $0.008 |
| POST | `/v1/gateway/search/tavily` | Tavily AI-powered web search | $0.012 |
| POST | `/v1/gateway/search/fused` | Brave + Tavily fused and deduplicated | $0.015 |
| POST | `/v1/gateway/execute/e2b` | Sandboxed code execution (Python/JS) | $0.005 |
| GET | `/v1/pricing` | Pricing information | FREE |
| GET | `/v1/credits/balance` | Credit balance check | FREE |
| POST | `/v1/credits/trial` | Claim 5 free trial credits | FREE |

## Free Trial

Get 5 free credits with no signup. Send your Ethereum wallet address:

```bash
curl -X POST https://api.signalfuse.co/v1/credits/trial \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0xYOUR_ETH_ADDRESS"}'
```

Response:

```json
{
  "credit_token": "sf_abc123...",
  "credits": 5,
  "wallet": "0xYOUR_ETH_ADDRESS"
}
```

Pass the returned `credit_token` as the `X-Credit-Token` header on subsequent requests, or use it in MCP tool calls.

## Example Request/Response Pairs

### Get a Trading Signal

```bash
curl https://api.signalfuse.co/v1/signal/BTC \
  -H "X-Credit-Token: sf_abc123..."
```

```json
{
  "symbol": "BTC",
  "signal": "long",
  "signal_strength": 74,
  "confidence": 0.82,
  "regime": "risk_on",
  "components": {
    "social": {"score": 0.49, "label": "bullish"},
    "macro": {"score": 0.63, "label": "bullish"},
    "market": {"score": 0.42, "label": "long_bias"}
  },
  "updated_at": "2026-04-04T12:00:00Z"
}
```

### Get Sentiment Analysis

```bash
curl https://api.signalfuse.co/v1/sentiment/ETH \
  -H "X-Credit-Token: sf_abc123..."
```

```json
{
  "symbol": "ETH",
  "score": 0.65,
  "label": "bullish",
  "model": "ModernFinBERT",
  "updated_at": "2026-04-04T12:00:00Z"
}
```

### Get Macro Regime

```bash
curl https://api.signalfuse.co/v1/regime \
  -H "X-Credit-Token: sf_abc123..."
```

```json
{
  "regime": "risk_on",
  "confidence": 0.78
}
```

### Get Arena Leaderboard

```bash
curl https://api.signalfuse.co/v1/arena/leaderboard
```

```json
[
  {
    "strategy_id": "ema_5_breakout",
    "wins": 142,
    "losses": 98,
    "win_rate": 0.591,
    "total_pnl_bp": 340,
    "total_income_usd": 1720.50
  }
]
```

### Web Search (Brave)

```bash
curl "https://api.signalfuse.co/v1/gateway/search/brave?q=bitcoin+ETF+flows" \
  -H "X-Credit-Token: sf_abc123..."
```

### Web Search (Tavily)

```bash
curl -X POST https://api.signalfuse.co/v1/gateway/search/tavily \
  -H "Content-Type: application/json" \
  -H "X-Credit-Token: sf_abc123..." \
  -d '{"query": "bitcoin ETF flows", "search_depth": "advanced"}'
```

### Execute Code (E2B Sandbox)

```bash
curl -X POST https://api.signalfuse.co/v1/gateway/execute/e2b \
  -H "Content-Type: application/json" \
  -H "X-Credit-Token: sf_abc123..." \
  -d '{"code": "print(2 + 2)", "language": "python"}'
```

```json
{
  "stdout": "4\n",
  "stderr": "",
  "exit_code": 0
}
```

## Pricing

| Tier | Credits | Price | Per-Credit Cost |
|------|---------|-------|-----------------|
| Free Trial | 5 | $0 | $0 |
| x402 Pay-Per-Call | unlimited | market rate | see endpoint table |
| Starter Pack | 500 | available at signalfuse.co | bulk discount |
| Pro Pack | 5,000 | available at signalfuse.co | bulk discount |

x402 is an open protocol for HTTP micropayments. SignalFuse accepts USDC on Base. No API keys, no subscriptions -- each request includes a payment header and the server settles on-chain. See the [x402 spec](https://www.x402.org/) for details.

## MCP Tools (11 total)

When connected as an MCP server, SignalFuse exposes 11 tools:

| Tool Name | Description |
|-----------|-------------|
| `get_signal` | Fused directional signal for a crypto asset (direction, strength, confidence, regime, entry/TP/SL) |
| `get_signal_batch` | Signals for all supported assets in one call |
| `get_sentiment` | ModernFinBERT sentiment analysis (score, label) |
| `get_regime` | Macro regime classification (risk_on, risk_off, neutral) |
| `get_arena_leaderboard` | Strategy Arena rankings with win rate, P&L, income (free) |
| `get_arena_signal` | Signal from a specific arena strategy for a given asset |
| `search_brave` | Web search via Brave Search |
| `search_tavily` | AI-powered web search via Tavily |
| `execute_code` | Sandboxed Python/JavaScript execution via E2B |
| `get_pricing` | Pricing information (free) |
| `check_balance` | Credit balance check (free) |

### Strategy Arena Strategies

| Strategy ID | Description |
|-------------|-------------|
| `ema_5_breakout` | Trend-following on exponential moving average crossovers |
| `rsi_7_extremes` | Momentum entries at RSI overbought/oversold levels |
| `rsi_reversion_swing` | Mean-reversion fades against RSI extremes |
| `vwap_reversion` | Mean-reversion entries around volume-weighted average price |

## Agent Framework Integrations

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "signalfuse": {
      "command": "npx",
      "args": ["-y", "signalfuse-mcp"]
    }
  }
}
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "signalfuse": {
      "command": "npx",
      "args": ["-y", "signalfuse-mcp"]
    }
  }
}
```

### LangChain (Python)

```python
from langchain_signalfuse import SignalFuseTool, SentimentTool, MacroRegimeTool

tools = [
    SignalFuseTool(credit_token="sf_abc123..."),
    SentimentTool(credit_token="sf_abc123..."),
    MacroRegimeTool(credit_token="sf_abc123..."),
]
agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)
```

See `langchain_signalfuse.py` in this repository for the full tool set (7 tools).

### ElizaOS

```typescript
import signalfuseActions from "./elizaos_plugin";
// Register actions: getSignalAction, getSentimentAction, getRegimeAction, getSignalBatchAction, getArenaLeaderboardAction
```

See `elizaos_plugin.ts` in this repository for the full plugin.

### Direct HTTP (any language)

```python
import requests

response = requests.get(
    "https://api.signalfuse.co/v1/signal/BTC",
    headers={"X-Credit-Token": "sf_abc123..."}
)
signal = response.json()
print(signal["signal"], signal["signal_strength"])
```

```javascript
const res = await fetch("https://api.signalfuse.co/v1/signal/BTC", {
  headers: { "X-Credit-Token": "sf_abc123..." }
});
const signal = await res.json();
console.log(signal.signal, signal.signal_strength);
```

## Supported Assets

BTC, ETH, SOL, DOGE, PEPE, WIF, BONK, ARB, OP, AVAX -- with more added regularly. Use `get_signal_batch` with no arguments to retrieve the current full list.

## Machine-Readable Discovery

- **OpenAPI spec:** https://api.signalfuse.co/openapi.json
- **x402 payment discovery:** https://api.signalfuse.co/.well-known/x402
- **llms.txt:** https://api.signalfuse.co/llms.txt
- **MCP server identifier:** `io.github.hypeprinter007-stack/signalfuse`
- **npm:** [npmjs.com/package/signalfuse-mcp](https://www.npmjs.com/package/signalfuse-mcp)
- **PyPI:** [pypi.org/project/signalfuse](https://pypi.org/project/signalfuse/)
- **Smithery:** compatible via `smithery.yaml` in this repository

## Links

- API: [api.signalfuse.co](https://api.signalfuse.co)
- x402 Discovery: [api.signalfuse.co/.well-known/x402](https://api.signalfuse.co/.well-known/x402)
- OpenAPI: [api.signalfuse.co/openapi.json](https://api.signalfuse.co/openapi.json)
- llms.txt: [api.signalfuse.co/llms.txt](https://api.signalfuse.co/llms.txt)
- Website: [signalfuse.co](https://signalfuse.co)
- Yield page: [signalfuse.co/divigent](https://signalfuse.co/divigent) — live view of where x402 revenue is routed
- npm: [npmjs.com/package/signalfuse-mcp](https://www.npmjs.com/package/signalfuse-mcp)
- PyPI: [pypi.org/project/signalfuse](https://pypi.org/project/signalfuse/)

## Related

- [signalfuse-divigent-router](https://github.com/hypeprinter007-stack/signalfuse-divigent-router) — open-source TypeScript sidecar (Apache 2.0) that routes x402 receipts into Divigent yield on Base. Reference seller-side integration.

## Disclaimer

SignalFuse is a data fusion API, not financial advice. Signals are mathematical composites derived from sentiment, macro, and market structure data. They can be wrong. Trade at your own risk.

## License

MIT

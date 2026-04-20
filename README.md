# signalfuse-mcp

MCP server for [SignalFuse](https://signalfuse.co) — trading intelligence for AI agents.

Adds **11 tools** to any MCP-compatible agent: directional signals, sentiment, macro regime, strategy arena, web search, sandboxed code execution, and account management.

## Tools

| # | Tool | Endpoint | Description | Price |
|---|------|----------|-------------|-------|
| 1 | `get_signal` | `GET /v1/signal/{symbol}` | Fused directional signal | $0.010 |
| 2 | `get_signal_batch` | `GET /v1/signal/batch` | All assets in one call | $0.075 |
| 3 | `get_sentiment` | `GET /v1/sentiment/{symbol}` | Social sentiment | $0.002 |
| 4 | `get_regime` | `GET /v1/regime` | Macro regime (risk-on / risk-off) | $0.001 |
| 5 | `get_arena_leaderboard` | `GET /v1/arena/leaderboard` | Live strategy rankings | FREE |
| 6 | `get_arena_signal` | `GET /v1/arena/{strategy_id}/{symbol}` | Strategy-specific signal | $0.001 |
| 7 | `search_brave` | `GET /v1/gateway/search/brave` | Web search via Brave | $0.008 |
| 8 | `search_tavily` | `POST /v1/gateway/search/tavily` | AI-powered search via Tavily | $0.012 |
| 9 | `execute_code` | `POST /v1/gateway/execute/e2b` | Sandboxed code execution via E2B | $0.005 |
| 10 | `get_pricing` | `GET /v1/pricing` | Pricing info | FREE |
| 11 | `check_balance` | `GET /v1/credits/balance` | Credit balance check | FREE |

### Strategy Arena

Four live strategies compete head-to-head on the arena leaderboard:

- **EMA Breakout** — trend-following on exponential moving average crossovers
- **RSI Extremes** — momentum entries at RSI overbought/oversold levels
- **RSI Reversion** — mean-reversion fades against RSI extremes
- **VWAP Reversion** — mean-reversion entries around volume-weighted average price

Use `get_arena_leaderboard` to see rankings, then `get_arena_signal` to pull a signal from any strategy.

## Quick Start

```bash
npx signalfuse-mcp@1.1.0
```

Or install globally:

```bash
npm install -g signalfuse-mcp
```

Python client (x402 payments built in):

```bash
pip install signalfuse
```

## Claude Desktop Setup

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "signalfuse": {
      "command": "signalfuse-mcp"
    }
  }
}
```

Restart Claude Desktop. Ask: *"What's the signal for BTC?"* and it calls SignalFuse automatically.

## Claude Code Setup

Add to your project's `.mcp.json`:

```json
{
  "signalfuse": {
    "command": "signalfuse-mcp"
  }
}
```

## Authentication

**Free trial** — 5 calls, no signup:

```bash
curl -X POST https://api.signalfuse.co/v1/credits/trial \
  -H "Content-Type: application/json" \
  -d '{"wallet":"YOUR_ETH_ADDRESS"}'
```

Pass the returned `credit_token` in tool calls.

**Bulk credits** — starter (500 calls) and pro (5,000 calls) packs available at [signalfuse.co](https://signalfuse.co).

## Links

- Website: [signalfuse.co](https://signalfuse.co)
- npm: [npmjs.com/package/signalfuse-mcp](https://www.npmjs.com/package/signalfuse-mcp)
- PyPI: [pypi.org/project/signalfuse](https://pypi.org/project/signalfuse/)

## Disclaimer

SignalFuse provides a data fusion API, not financial advice. Signals are mathematical composites that can be wrong. Trade at your own risk.

## License

MIT

# signalfuse-mcp

MCP server for [SignalFuse](https://signalfuse.co) — trading intelligence API.

Adds four tools to any MCP-compatible AI agent:
- `get_signal` — fused directional signal: sentiment + macro + market structure
- `get_regime` — current risk-on / risk-off macro regime
- `get_sentiment` — raw social sentiment breakdown
- `get_signal_batch` — all assets in one call

## Install

```bash
npm install -g signalfuse-mcp
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

Restart Claude Desktop. Ask Claude: *"What's the signal for BTC?"* — it will call SignalFuse automatically.

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

**Free trial:** 25 free calls, no signup:
```bash
curl -X POST https://api.signalfuse.co/v1/credits/trial \
  -H "Content-Type: application/json" \
  -d '{"wallet":"YOUR_ETH_ADDRESS"}'
```

Then pass the returned `credit_token` in tool calls.

**Bulk credits:** Buy starter (500 calls) or pro (5000 calls) packs.

> Note: This MCP server uses credit tokens for authentication. For x402 per-call payment (automatic USDC on Base), use the [SignalFuse Python client](https://github.com/hypeprinter007-stack/hyperliquid-starter-bot) which has full x402 SDK integration.

Full docs at [https://signalfuse.co](https://signalfuse.co)

## Disclaimer

SignalFuse provides a data fusion API, not financial advice. Signals are mathematical composites that can be wrong. Trade at your own risk.

## License

MIT

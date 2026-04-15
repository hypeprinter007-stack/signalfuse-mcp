"""
langchain_signalfuse.py — LangChain tool wrapper for SignalFuse
Drop into any LangChain agent to give it live trading intelligence.
"""
from langchain.tools import BaseTool
from typing import Optional, Type
from pydantic import BaseModel, Field
import requests


class SignalInput(BaseModel):
    symbol: str = Field(description="Crypto asset ticker, e.g. BTC, ETH, SOL")


class SignalFuseTool(BaseTool):
    name = "signalfuse_signal"
    description = (
        "Get fused directional trading signal for a crypto asset. "
        "Returns signal direction (long/short/neutral), signal_strength (0-100), "
        "confidence, macro regime, and component breakdowns. "
        "Use when asked about market conditions, trading decisions, or signal strength."
    )
    args_schema: Type[BaseModel] = SignalInput
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, symbol: str) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(
            f"{self.base_url}/v1/signal/{symbol.upper()}",
            headers=headers,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        return (
            f"{symbol.upper()} Signal: strength={data['signal_strength']}/100 | "
            f"direction={data['signal']} | "
            f"regime={data['regime']} | "
            f"confidence={data['confidence']}"
        )

    async def _arun(self, symbol: str) -> str:
        return self._run(symbol)


class SentimentTool(BaseTool):
    name = "signalfuse_sentiment"
    description = (
        "Get social and market sentiment for a crypto asset. "
        "Use when asked about sentiment, community mood, or social signals."
    )
    args_schema: Type[BaseModel] = SignalInput
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, symbol: str) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(
            f"{self.base_url}/v1/sentiment/{symbol.upper()}",
            headers=headers,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        return (
            f"{symbol.upper()} Sentiment: "
            f"score={data.get('score', 'N/A')} | "
            f"label={data.get('label', 'N/A')}"
        )

    async def _arun(self, symbol: str) -> str:
        return self._run(symbol)


class MacroRegimeTool(BaseTool):
    name = "signalfuse_regime"
    description = (
        "Get current macro risk regime (risk_on/risk_off/neutral). "
        "Use for portfolio-level directional bias and position sizing decisions."
    )
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, *args, **kwargs) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(f"{self.base_url}/v1/regime", headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        return f"Macro regime: {data['regime']} (confidence: {data.get('confidence', 'N/A')})"

    async def _arun(self, *args, **kwargs) -> str:
        return self._run()


class SignalBatchTool(BaseTool):
    name = "signalfuse_signal_batch"
    description = (
        "Get fused trading signals for all supported crypto assets in one call. "
        "Use when asked about overall market overview or signals across multiple assets."
    )
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, *args, **kwargs) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(f"{self.base_url}/v1/signal/batch", headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        lines = []
        for asset in data if isinstance(data, list) else data.get("signals", []):
            lines.append(
                f"{asset.get('symbol', '?')}: {asset.get('signal', '?')} "
                f"(strength={asset.get('signal_strength', '?')})"
            )
        return "Signal Batch:\n" + "\n".join(lines)

    async def _arun(self, *args, **kwargs) -> str:
        return self._run()


class ArenaLeaderboardTool(BaseTool):
    name = "signalfuse_arena_leaderboard"
    description = (
        "Get the Strategy Arena leaderboard showing top-performing strategy agents. "
        "Free endpoint, no credit token required. "
        "Use when asked about strategy rankings or arena performance."
    )
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, *args, **kwargs) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(f"{self.base_url}/v1/arena/leaderboard", headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        lines = []
        for entry in data if isinstance(data, list) else data.get("leaderboard", []):
            lines.append(
                f"{entry.get('strategy_id', '?')}: "
                f"score={entry.get('score', '?')} | "
                f"pnl={entry.get('pnl', '?')}"
            )
        return "Arena Leaderboard:\n" + "\n".join(lines)

    async def _arun(self, *args, **kwargs) -> str:
        return self._run()


class ArenaSignalInput(BaseModel):
    strategy_id: str = Field(description="Strategy agent ID from the arena")
    symbol: str = Field(description="Crypto asset ticker, e.g. BTC, ETH, SOL")


class ArenaSignalTool(BaseTool):
    name = "signalfuse_arena_signal"
    description = (
        "Get a specific strategy agent's signal for a crypto asset from the Strategy Arena. "
        "Use when asked about a particular strategy's view on an asset."
    )
    args_schema: Type[BaseModel] = ArenaSignalInput
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, strategy_id: str, symbol: str) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(
            f"{self.base_url}/v1/arena/{strategy_id}/{symbol.upper()}",
            headers=headers,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        return (
            f"Arena Signal ({strategy_id} -> {symbol.upper()}): "
            f"signal={data.get('signal', 'N/A')} | "
            f"strength={data.get('signal_strength', 'N/A')} | "
            f"confidence={data.get('confidence', 'N/A')}"
        )

    async def _arun(self, strategy_id: str, symbol: str) -> str:
        return self._run(strategy_id, symbol)


class PricingTool(BaseTool):
    name = "signalfuse_pricing"
    description = (
        "Get SignalFuse API pricing information and available plans. "
        "Free endpoint, no credit token required. "
        "Use when asked about API costs, pricing, or credit usage."
    )
    base_url: str = "https://api.signalfuse.co"
    credit_token: str = ""

    def _run(self, *args, **kwargs) -> str:
        headers = {}
        if self.credit_token:
            headers["X-Credit-Token"] = self.credit_token
        r = requests.get(f"{self.base_url}/v1/pricing", headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        return f"SignalFuse Pricing: {data}"

    async def _arun(self, *args, **kwargs) -> str:
        return self._run()


# Usage:
# from langchain_signalfuse import SignalFuseTool, MacroRegimeTool, SentimentTool, SignalBatchTool, ArenaLeaderboardTool, ArenaSignalTool, PricingTool
# tools = [SignalFuseTool(credit_token="..."), MacroRegimeTool(credit_token="..."), SentimentTool(credit_token="..."), SignalBatchTool(credit_token="..."), ArenaLeaderboardTool(), ArenaSignalTool(credit_token="..."), PricingTool()]
# agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)

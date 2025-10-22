import httpx, logging
from typing import Sequence
from src.config import settings

log = logging.getLogger(__name__)

async def bulk_summary(mints: Sequence[str]) -> dict:
    if not settings.RUGCHECK_API_KEY:
        log.warning("RugCheck API key not set; treating all as high risk.")
        return {m: {"risk_level": "high", "flags": ["no_api_key"]} for m in mints}
    headers = {"Authorization": f"Bearer {settings.RUGCHECK_API_KEY}"}
    async with httpx.AsyncClient(timeout=10) as s:
        r = await s.post(
            f"{settings.RUGCHECK_API_BASE}/v1/bulk/tokens/summary",
            headers=headers,
            json={"mints": list(mints)},
        )
        r.raise_for_status()
        data = r.json()
        return data

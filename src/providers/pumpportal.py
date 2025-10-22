import os, logging, httpx
from dataclasses import dataclass
from typing import List
from src.config import settings

log = logging.getLogger(__name__)

@dataclass
class Candidate:
    mint: str
    symbol: str | None = None
    name: str | None = None
    created_ts: float | None = None
    graduated: bool = False

async def fetch_candidates() -> List[Candidate]:
    """Minimal PumpPortal HTTP polling. Returns a small recent-list."""
    base = settings.PUMPPORTAL_BASE
    if not base:
        log.info("PUMPPORTAL_BASE not set; skipping PumpPortal provider.")
        return []

    url = f"{base.rstrip('/')}/tokens/recent"
    try:
        async with httpx.AsyncClient(timeout=10) as s:
            r = await s.get(url)
            if r.status_code != 200:
                log.warning("PumpPortal %s -> %s", url, r.status_code)
                return []
            data = r.json()
            cands: List[Candidate] = []
            for item in data[:10]:  # limit per cycle
                mint = item.get("mint") or item.get("address")
                if not mint:
                    continue
                cands.append(Candidate(
                    mint=mint,
                    symbol=item.get("symbol"),
                    name=item.get("name"),
                    created_ts=item.get("created_at") or item.get("ts"),
                    graduated=bool(item.get("graduated") or False),
                ))
            return cands
    except Exception as e:
        log.exception("PumpPortal polling failed: %s", e)
        return []

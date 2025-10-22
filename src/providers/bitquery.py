"""Optional Bitquery provider interface placeholder.
If you have Bitquery streaming/WebSocket, wire it here and return Candidate objects.
"""
import logging
from dataclasses import dataclass
from typing import List

log = logging.getLogger(__name__)

@dataclass
class Candidate:
    mint: str
    symbol: str | None = None
    name: str | None = None
    created_ts: float | None = None
    graduated: bool = False

async def fetch_candidates() -> List[Candidate]:
    log.info("Bitquery provider not configured; falling back to PumpPortal or stub.")
    return []

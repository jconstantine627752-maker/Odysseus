from __future__ import annotations
from dataclasses import dataclass

@dataclass
class TokenInfo:
    mint_revoked: bool
    freeze_revoked: bool
    top5_pct: float
    liquidity_sol: float
    graduated: bool
    pool_ok: bool

def hard_filters_pass(info: TokenInfo, rc_summary: dict, *, max_top5: float, min_liq: float) -> bool:
    if not (info.mint_revoked and info.freeze_revoked):
        return False
    if info.top5_pct > max_top5:
        return False
    if info.liquidity_sol < min_liq:
        return False
    risk = rc_summary.get("risk_level", "high")
    if risk not in ("low", "medium"):
        return False
    flags = set(map(str.lower, rc_summary.get("flags", [])))
    bad = {"honeypot", "blacklist", "trading_disabled"}
    if flags & bad:
        return False
    return True

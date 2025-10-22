import logging
from src.config import settings
from src.providers import rugcheck
from src.risk import TokenInfo, hard_filters_pass
from src.executor import simulate_buy_sell_usd, execute_trade
from src.strategy.basic import decide
from src.providers.bitquery import fetch_candidates as fetch_from_bq
from src.providers.pumpportal import fetch_candidates as fetch_from_pp

log = logging.getLogger(__name__)

async def process_candidates(candidates: list, *, paper: bool = True):
    if not candidates:
        log.info("No candidates.")
        return

    mints = [c.mint for c in candidates]
    rc_bulk = await rugcheck.bulk_summary(mints)

    for c in candidates:
        rc = rc_bulk.get(c.mint, {"risk_level": "high"})
        # TODO: replace with real chain/indexer checks
        info = TokenInfo(
            mint_revoked=True,
            freeze_revoked=True,
            top5_pct=32.1,
            liquidity_sol=8.4,
            graduated=True,
            pool_ok=True,
        )
        if not hard_filters_pass(info, rc, max_top5=settings.MAX_TOP5_PCT, min_liq=settings.MIN_LIQ_SOL):
            log.info("SKIP %s — failed hard filters: %s", c.mint, rc)
            continue

        sell_sim_ok = await simulate_buy_sell_usd(c.mint, settings.TEST_BUY_USD)
        decision = decide(settings.TEST_BUY_USD, settings.MAX_POSITION_USD, info.graduated, sell_sim_ok)

        if not decision.should_test_buy:
            log.info("SKIP %s — decision denied", c.mint)
            continue

        if paper:
            log.info("PAPER BUY %s — target $%.2f", c.mint, decision.target_usd)
        else:
            tx = await execute_trade(c.mint, decision.target_usd)
            log.info("LIVE BUY %s — tx: %s", c.mint, tx)

async def collect_candidates():
    # Try PumpPortal first, then Bitquery, else stub
    cands = await fetch_from_pp()
    if not cands:
        cands = await fetch_from_bq()
    if not cands:
        from src.providers.pumpportal import Candidate
        cands = [Candidate(mint="SoMeToKenMinTAddR1111111111111111111111111")]
    return cands

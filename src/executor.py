import logging, base64
from solders.transaction import VersionedTransaction
from src.config import settings
from src.providers.jupiter import simulate_buy_sell
from src.utils.solana import load_keypair, rpc_send_raw_tx

log = logging.getLogger(__name__)

LAMPORTS_PER_SOL = 1_000_000_000

async def simulate_buy_sell_usd(token_mint: str, usd_amount: float) -> bool:
    # naive: treat USD as SOL for simulation sizing (you can convert via a price oracle if desired)
    lamports = int(max(1, usd_amount) * 0.01 * LAMPORTS_PER_SOL)  # ~0.01 SOL per $1 (rough heuristic)
    lamports = max(lamports, int(0.001 * LAMPORTS_PER_SOL))       # min 0.001 SOL
    return await simulate_buy_sell(token_mint, lamports, settings.SLIPPAGE_BPS)

async def _jup_swap_build(user_pubkey: str, quote_resp: dict) -> str:
    """Call Jupiter /v6/swap to get a base64 tx for SOL->TOKEN. Returns base64 string."""
    import httpx
    url = f"{settings.JUPITER_BASE}/v6/swap"
    body = {
        "userPublicKey": user_pubkey,
        "quoteResponse": quote_resp,
        "wrapAndUnwrapSol": True,
        "dynamicSlippage": True,
        # Optional: prioritization fee (lamports)
        "prioritizationFeeLamports": 0,
    }
    async with httpx.AsyncClient(timeout=20) as s:
        r = await s.post(url, json=body)
        r.raise_for_status()
        data = r.json()
        if "swapTransaction" not in data:
            raise RuntimeError(f"Jupiter swap error: {data}")
        return data["swapTransaction"]

async def execute_trade(token_mint: str, usd_amount: float) -> dict:
    """Build, sign, and send a SOL->TOKEN swap via Jupiter v6.
    Returns a dict with signature/status. Raises on failure.
    """
    if not settings.WALLET_PRIVATE_KEY:
        raise RuntimeError("WALLET_PRIVATE_KEY missing for live execution")

    lamports_in = int(max(1, usd_amount) * 0.01 * LAMPORTS_PER_SOL)
    lamports_in = max(lamports_in, int(0.001 * LAMPORTS_PER_SOL))

    from src.providers.jupiter import SOL_MINT, quote
    q = await quote(SOL_MINT, token_mint, lamports_in, settings.SLIPPAGE_BPS)
    if not q or int(q.get("outAmount", 0)) <= 0:
        raise RuntimeError("Quote failed or zero outAmount")

    swap_b64 = await _jup_swap_build(settings.WALLET_PUBLIC_KEY, q)

    kp = load_keypair(settings.WALLET_PRIVATE_KEY)
    tx_bytes = base64.b64decode(swap_b64)
    vtx = VersionedTransaction.from_bytes(tx_bytes)
    vtx.sign([kp])
    raw_b64 = base64.b64encode(bytes(vtx)).decode()

    res = await rpc_send_raw_tx(raw_b64)
    sig = res.get("result") or res
    log.info("Sent swap tx: %s", sig)
    return {"signature": sig, "status": "SENT"}

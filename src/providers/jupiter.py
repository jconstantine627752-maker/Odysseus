import httpx
from src.config import settings

SOL_MINT = "So11111111111111111111111111111111111111112"

async def quote(input_mint: str, output_mint: str, amount: int, slippage_bps: int) -> dict | None:
    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": amount,
        "slippageBps": slippage_bps,
    }
    async with httpx.AsyncClient(timeout=10) as s:
        r = await s.get(f"{settings.JUPITER_BASE}/v6/quote", params=params)
        return r.json() if r.status_code == 200 else None

async def simulate_buy_sell(token_mint: str, lamports_in: int, slippage_bps: int) -> bool:
    # BUY: SOL -> TOKEN
    q_buy = await quote(SOL_MINT, token_mint, lamports_in, slippage_bps)
    if not q_buy or int(q_buy.get("outAmount", 0)) <= 0:
        return False
    # SELL: TOKEN -> SOL (use buy outAmount as input for the sell path)
    token_amount = int(q_buy["outAmount"]) if "outAmount" in q_buy else 0
    if token_amount <= 0:
        return False
    q_sell = await quote(token_mint, SOL_MINT, token_amount, slippage_bps)
    if not q_sell or int(q_sell.get("outAmount", 0)) <= 0:
        return False
    return True

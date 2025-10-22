import base58, base64, json
from typing import Any, Dict
from solders.keypair import Keypair
from src.config import settings
import httpx

def load_keypair(pk_str: str) -> Keypair:
    """Accept base58 string or JSON array (as string) exported by Solana CLI."""
    try:
        # base58 private key (64/32 bytes)
        secret = base58.b58decode(pk_str)
        return Keypair.from_seed(secret[:32])
    except Exception:
        # try JSON array
        arr = json.loads(pk_str)
        return Keypair.from_bytes(bytes(arr))

async def rpc_send_raw_tx(b64_tx: str) -> Dict[str, Any]:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendTransaction",
        "params": [
            b64_tx,
            {"skipPreflight": False, "preflightCommitment": "confirmed"},
        ],
    }
    async with httpx.AsyncClient(timeout=20) as s:
        r = await s.post(settings.SOLANA_RPC_URL, json=payload)
        r.raise_for_status()
        return r.json()

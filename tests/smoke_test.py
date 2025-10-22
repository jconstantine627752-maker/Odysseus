import asyncio
from src.providers.pumpportal import fetch_candidates

async def test_fetch_candidates():
    cands = await fetch_candidates()
    # this may be empty if PUMPPORTAL_BASE is not set; still ensures function runs
    assert isinstance(cands, list)

if __name__ == "__main__":
    asyncio.run(test_fetch_candidates())

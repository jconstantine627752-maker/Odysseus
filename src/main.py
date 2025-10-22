import asyncio, argparse, logging, os
from dotenv import load_dotenv
from src.config import settings
from src.engine import process_candidates, collect_candidates

load_dotenv()

LOG_LEVEL = getattr(logging, os.getenv("LOG_LEVEL", settings.LOG_LEVEL), logging.INFO)
logging.basicConfig(level=LOG_LEVEL, format="[%(levelname)s] %(name)s: %(message)s")

async def run(paper: bool):
    cands = await collect_candidates()
    await process_candidates(cands, paper=paper)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--paper", action="store_true", help="Run in paper mode (no signing)")
    ap.add_argument("--live", action="store_true", help="Send real transactions (requires key)")
    args = ap.parse_args()
    paper = True if args.paper or not args.live else False
    asyncio.run(run(paper=paper))

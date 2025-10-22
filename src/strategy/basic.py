from dataclasses import dataclass

@dataclass
class Decision:
    should_test_buy: bool
    target_usd: float

def decide(test_buy_usd: float, max_position_usd: float, graduated: bool, sell_sim_ok: bool) -> Decision:
    if not graduated:
        # only test-buy pre-graduation
        return Decision(should_test_buy=True, target_usd=test_buy_usd)
    # graduated: scale only if sell sim passed
    if sell_sim_ok:
        return Decision(should_test_buy=True, target_usd=max_position_usd)
    return Decision(should_test_buy=False, target_usd=0.0)

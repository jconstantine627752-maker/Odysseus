from pydantic import BaseSettings

class Settings(BaseSettings):
    # Providers
    SOLANA_RPC_URL: str
    JUPITER_BASE: str = "https://quote-api.jup.ag"
    RUGCHECK_API_BASE: str = "https://api.rugcheck.xyz"
    RUGCHECK_API_KEY: str | None = None
    BITQUERY_BASE: str | None = None
    BITQUERY_API_KEY: str | None = None

    # Optional PumpPortal base HTTP endpoint
    PUMPPORTAL_BASE: str | None = None

    # Wallet
    WALLET_PUBLIC_KEY: str
    WALLET_PRIVATE_KEY: str | None = None  # required for --live

    # Risk thresholds
    MIN_LIQ_SOL: float = 5.0
    MAX_TOP5_PCT: float = 45.0
    TEST_BUY_USD: float = 3.0
    MAX_POSITION_USD: float = 10.0
    SLIPPAGE_BPS: int = 50

    # Strategy
    TP_PCT: float = 40.0
    SL_PCT: float = 15.0
    MAX_DRAWDOWN_PCT: float = 10.0
    MAX_CONSECUTIVE_LOSERS: int = 3

    # Misc
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()

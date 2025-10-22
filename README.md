🧭 Odysseus Suite

Unified AI & On-Chain Trading Platform
Combining Odysseus Agents, Odysseus Solana Bot, and Odysseus BNB Module

🌌 Overview

Odysseus is a modular monorepo that unifies conversational AI agents with deterministic, rule-based trading systems.
It’s designed for transparency, safety, and full local control — deployable anywhere via Docker.

Includes:

Odysseus Agents – OpenAI-compatible chat API & UI layer

Odysseus Solana Bot – automated trading for Pump.fun tokens using RugCheck & Jupiter

Odysseus BNB Module – HTTP microservice for live swaps on BNB Chain

Unified Docker workflow for local and cloud environments (Render, Fly.io, etc.)

🧠 1. Odysseus Agents

A lightweight chat system exposing an OpenAI-compatible API to orchestrate reasoning, trade decisions, or custom commands.

Features

API: Plug in your own API

Pluggable backends (OpenAI, local LLMs, hosted models)

Can call internal trade microservices (Solana / BNB)

Optional frontend UI at http://ur choice

Quick Start

cp .env.example .env
docker compose up --build
# Web UI:
# API:  

🪙 2. Odysseus Solana Bot

A deterministic, safety-gated trading framework for Pump.fun tokens.
LLM sentiment is optional — all executions follow strict, rule-based checks.

🧩 Pipeline

Discover new tokens from PumpPortal or Bitquery

Apply RugCheck + liquidity + top-holder gates

Simulate buy→sell via Jupiter

Execute live trade only if all gates pass

⚙️ Setup
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env


Run simulation mode (no TX):

python -m src.main --paper


Run live (requires WALLET_PRIVATE_KEY):

python -m src.main --live


Dockerized

docker compose up --build solana


Configuration

SOLANA_RPC_URL=...
RUGCHECK_API_KEY=...
TEST_BUY_USD=10
MAX_POSITION_USD=100
MIN_LIQ_SOL=5
MAX_TOP5_PCT=40


Safety Gates

✅ Authorities revoked

✅ RugCheck ≤ medium risk

✅ Liquidity and top-holder thresholds

✅ Simulated buy→sell test

✅ Local key signing

🐍 3. Odysseus BNB Module

A standalone Node.js microservice that performs quotes and swaps on BNB Chain using PancakeSwap/UniswapV2 routers.
It’s chain-agnostic and callable from any backend or chatbot.

🚀 Quick Start
cd odysseus-bnb
cp .env.example .env
npm install
npm run build
npm start


Or via Docker:

docker build -t odysseus-bnb .
docker run --rm -it --env-file .env -p 8787:8787 odysseus-bnb

🔌 API Endpoints

Health

GET /health


Quote

GET /quote?base=<erc20>&quote=<erc20>&amount=<human>


Swap Tokens

POST /swap/tokens
{
  "base": "0x...",
  "quote": "0x...",
  "amount": "1.0",
  "slippageBps": 50
}


Swap BNB

POST /swap/eth
{
  "quote": "0x...",
  "amountInEth": "0.05",
  "slippageBps": 50
}


Sample .env

BSC_RPC_URL=https://bsc-dataseed.binance.org
PRIVATE_KEY=0xYOUR_BURNER_KEY
ROUTER_ADDRESS=0x10ED43C718714eb63d5aA57B78B54704E256024E
WBNB_ADDRESS=0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
PORT=8787
SLIPPAGE_BPS_DEFAULT=50

🔗 4. Integrating Odysseus with Your Chatbot

Your chatbot or backend can invoke Odysseus services directly over HTTP.

Example (Python):

import requests

resp = requests.get(
    "http://localhost:8787/quote",
    params={
        "base": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "quote": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        "amount": "1"
    }
)
print(resp.json())


Solana Paper Mode:

python -m src.main --paper

🧱 Architecture
odysseus/
├── agents/                # Chat + orchestration
├── solana-bot/            # Pump.fun trading bot
├── odysseus-bnb/          # BNB microservice
└── docker-compose.yml     # Unified deployment

Service	Port	Description
agent	8080	Chat/LLM API
solana	5174	Solana Trader
bnb	8787	BNB Trader
🛡️ Security Checklist

Use burner wallets for all chains

Verify router and wrapped-token addresses

Keep .env private (never commit keys)

Monitor TXs for gas and slippage

Implement global circuit breakers

📄 License

MIT License © 2025 Odysseus Collective

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

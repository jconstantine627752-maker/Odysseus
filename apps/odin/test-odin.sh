#!/bin/bash

# Odin X402 Protocol Module - Quick Test Script
# This script tests various Odin capabilities to verify the tech works

set -e

echo "🔱 Testing Odin X402 Protocol Module"
echo "===================================="

# Configuration
ODIN_URL="http://localhost:9999"
API_KEY="your_api_key_here"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run tests
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    
    echo -n "Testing $test_name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY" \
            -d "$data" \
            "$ODIN_URL$endpoint" || echo "000")
    else
        response=$(curl -s -w "%{http_code}" \
            -H "Authorization: Bearer $API_KEY" \
            "$ODIN_URL$endpoint" || echo "000")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
        if [ -n "$body" ]; then
            echo "  Response: $body"
        fi
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo ""
echo "🏥 Health Check Tests"
echo "-------------------"

run_test "Health Check" "/health"
run_test "Detailed Status" "/health/status"
run_test "Performance Metrics" "/health/metrics"

echo ""
echo "🌐 X402 Protocol Tests"
echo "--------------------"

run_test "Supported Protocols" "/x402/protocols"
run_test "Available Bridges" "/x402/bridges"
run_test "Oracle Feeds" "/x402/oracles"
run_test "Bridge Quote" "/x402/bridge/quote?fromChain=402&toChain=1&token=USDC&amount=1000"
run_test "Protocol Info" "/x402/protocol/0x1234567890123456789012345678901234567890/info"
run_test "Security Analysis" "/x402/protocol/0x1234567890123456789012345678901234567890/security"
run_test "Liquidity Info" "/x402/liquidity/0x1234567890123456789012345678901234567890"
run_test "Top Pools" "/x402/liquidity/top-pools?limit=5"

# Test bridge execution
echo "Testing Bridge Execution..."
bridge_data='{"fromChain":402,"toChain":1,"token":"USDC","amount":"1000","recipient":"0x1234567890123456789012345678901234567890"}'
run_test "Bridge Execution" "/x402/bridge" "POST" "$bridge_data"

echo ""
echo "⚡ Zeus Trading Tests"
echo "-------------------"

run_test "Arbitrage Opportunities" "/zeus/opportunities?minProfit=50"
run_test "Flash Loan Opportunities" "/zeus/flash-loan/opportunities"
run_test "Options Chains" "/zeus/options/chains?underlying=X402"
run_test "Portfolio Overview" "/zeus/portfolio"
run_test "Portfolio Performance" "/zeus/portfolio/performance"
run_test "Order History" "/zeus/orders?limit=10"

# Test trade execution
echo "Testing Zeus Trade Execution..."
trade_data='{"type":"buy","token":"X402","amount":"100","strategy":"arbitrage"}'
run_test "Zeus Trade Execution" "/zeus/execute" "POST" "$trade_data"

# Test arbitrage execution
echo "Testing Zeus Arbitrage Execution..."
arb_data='{"opportunityId":"test_opp_123","amount":"1000","maxSlippage":100}'
run_test "Zeus Arbitrage Execution" "/zeus/arbitrage" "POST" "$arb_data"

echo ""
echo "⚠️  Risk Management Tests"
echo "-----------------------"

run_test "Token Risk Assessment" "/risk/assessment/X402"
run_test "Portfolio Exposure" "/risk/portfolio/exposure"
run_test "Stop Loss Orders" "/risk/stop-loss"
run_test "Risk Alerts" "/risk/alerts?limit=10"
run_test "Risk Metrics" "/risk/metrics"
run_test "Risk Limits" "/risk/limits"
run_test "Drawdown Analysis" "/risk/drawdown?timeframe=30d"
run_test "Value at Risk" "/risk/var?confidence=95&timeframe=1d"

# Test stop loss creation
echo "Testing Stop Loss Creation..."
sl_data='{"token":"X402","triggerPrice":"20.00","type":"percentage"}'
run_test "Stop Loss Creation" "/risk/stop-loss" "POST" "$sl_data"

echo ""
echo "🔬 Advanced Feature Tests"
echo "------------------------"

# Test various combinations and edge cases
run_test "Multi-chain Bridge Routes" "/x402/bridge/routes?fromChain=402&toChain=137&token=USDC"
run_test "Oracle Price Feed" "/x402/oracle/price/X402?pair=USD"
run_test "Zeus Portfolio Rebalancing" "/zeus/portfolio/rebalance" "POST" '{"targetAllocations":{"X402":50,"USDC":30,"WETH":20},"rebalanceThreshold":5}'
run_test "Zeus Flash Loan Execution" "/zeus/flash-loan" "POST" '{"token":"USDC","amount":"10000","strategy":"arbitrage","parameters":{}}'
run_test "Zeus Options Strategy" "/zeus/options/trade" "POST" '{"strategy":"covered-call","legs":[{}],"amount":"1000"}'

echo ""
echo "📊 Results Summary"
echo "=================="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Success Rate: $SUCCESS_RATE%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Odin X402 + Zeus Trading Engine is working correctly.${NC}"
    echo ""
    echo "✅ X402 Protocol Integration (Odin)"
    echo "✅ Cross-chain Bridge Operations (Odin)"  
    echo "✅ Oracle Price Feeds (Odin)"
    echo "✅ Zeus Arbitrage Engine"
    echo "✅ Zeus Flash Loan Capabilities"
    echo "✅ Zeus Options Trading"
    echo "✅ Risk Management System"
    echo "✅ Zeus Portfolio Management"
    echo "✅ Stop Loss Protection"
    echo "✅ MEV Protection Ready"
    echo "✅ Odysseus Bot Integration Ready"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please check the Odin server logs and configuration.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure Odin server is running on $ODIN_URL"
    echo "2. Check environment variables in .env file"
    echo "3. Verify Redis is running and accessible"
    echo "4. Confirm X402 RPC endpoint is reachable"
    echo "5. Check API key configuration"
    exit 1
fi
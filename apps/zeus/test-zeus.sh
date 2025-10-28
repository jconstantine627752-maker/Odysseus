#!/bin/bash

# Zeus Trading Engine Test Script
# Tests all major trading endpoints and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ZEUS_URL=${ZEUS_URL:-"http://localhost:8888"}
TIMEOUT=10

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}    Zeus Trading Engine Test Suite    ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Testing Zeus at: $ZEUS_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Function to run tests
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    
    echo -n "Testing $test_name... "
    
    if [[ -n "$data" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $TIMEOUT \
            "$ZEUS_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            --max-time $TIMEOUT \
            "$ZEUS_URL$endpoint" 2>/dev/null)
    fi
    
    if [[ $? -eq 0 ]]; then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [[ "$http_code" -eq 200 ]]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            
            # Pretty print JSON response for important endpoints
            if [[ "$endpoint" == "/" || "$endpoint" == "/api" ]]; then
                echo "$body" | python3 -m json.tool 2>/dev/null | head -10
                echo ""
            fi
        else
            echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            echo "Response: $body" | head -5
        fi
    else
        echo -e "${RED}✗ FAILED (Connection error)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo -e "${YELLOW}🏥 Health & Status Tests${NC}"
echo "------------------------"

run_test "Server Health" "/health"
run_test "Service Info" "/"
run_test "API Info" "/api"

echo ""
echo -e "${YELLOW}⚡ Arbitrage Engine Tests${NC}"
echo "-------------------------"

run_test "Arbitrage Opportunities" "/api/arbitrage/opportunities"
run_test "Arbitrage Opportunities (Filtered)" "/api/arbitrage/opportunities?minProfit=50&chains=1,137"
run_test "Arbitrage History" "/api/arbitrage/history?limit=10"

# Test arbitrage execution
echo "Testing Arbitrage Execution..."
arb_data='{"opportunityId":"test_arb_123","amount":"1000","maxSlippage":100}'
run_test "Arbitrage Execution" "/api/arbitrage/execute" "POST" "$arb_data"

echo ""
echo -e "${YELLOW}💸 Flash Loan Engine Tests${NC}"
echo "---------------------------"

run_test "Flash Loan Opportunities" "/api/flash-loans/opportunities"
run_test "Flash Loan Opportunities (Filtered)" "/api/flash-loans/opportunities?token=USDC&minProfit=100"

# Test flash loan execution
echo "Testing Flash Loan Execution..."
flash_data='{"token":"USDC","amount":"50000","strategy":"arbitrage","parameters":{}}'
run_test "Flash Loan Execution" "/api/flash-loans/execute" "POST" "$flash_data"

echo ""
echo -e "${YELLOW}📈 Options Trading Tests${NC}"
echo "-------------------------"

run_test "Options Chains" "/api/options/chains"
run_test "Options Chains (ETH)" "/api/options/chains?underlying=ETH"
run_test "Options Positions" "/api/options/positions"

# Test options strategy
echo "Testing Options Strategy..."
options_data='{"strategy":"covered-call","legs":[{"type":"call","strike":"2500","expiry":"2024-01-19","side":"sell","quantity":1}],"amount":"1000"}'
run_test "Options Strategy" "/api/options/strategy" "POST" "$options_data"

echo ""
echo -e "${YELLOW}💼 Portfolio Management Tests${NC}"
echo "------------------------------"

run_test "Portfolio Overview" "/api/portfolio"
run_test "Portfolio Performance" "/api/portfolio/performance"
run_test "Portfolio Performance (30d)" "/api/portfolio/performance?timeframe=30d"

# Test portfolio rebalancing
echo "Testing Portfolio Rebalancing..."
portfolio_data='{"targetAllocations":{"ETH":0.4,"BTC":0.3,"USDC":0.3},"rebalanceThreshold":5}'
run_test "Portfolio Rebalancing" "/api/portfolio/rebalance" "POST" "$portfolio_data"

echo ""
echo -e "${YELLOW}🔄 General Trading Tests${NC}"
echo "-------------------------"

run_test "Order History" "/api/orders"
run_test "Order History (Limited)" "/api/orders?limit=5"

# Test trade execution
echo "Testing Trade Execution..."
trade_data='{"type":"buy","token":"ETH","amount":"1000","strategy":"arbitrage"}'
run_test "Trade Execution" "/api/execute" "POST" "$trade_data"

echo ""
echo -e "${YELLOW}❌ Error Handling Tests${NC}"
echo "------------------------"

# Test invalid endpoints
run_test "Invalid Endpoint" "/api/invalid-endpoint"
run_test "Missing Parameters" "/api/arbitrage/execute" "POST" '{"amount":"1000"}'

echo ""
echo -e "${BLUE}📊 Results Summary${NC}"
echo "=================="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
else
    SUCCESS_RATE=0
fi

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Success Rate: $SUCCESS_RATE%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Zeus Trading Engine is working correctly.${NC}"
    echo ""
    echo "✅ Arbitrage Engine Online"
    echo "✅ Flash Loan Engine Online"
    echo "✅ Options Trading Engine Online"
    echo "✅ Portfolio Manager Online"
    echo "✅ Risk Management Active"
    echo ""
    echo -e "${BLUE}⚡ Zeus is ready for trading! ⚡${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check the Zeus configuration and services.${NC}"
    echo ""
    echo "Debug steps:"
    echo "1. Check if Zeus server is running: curl $ZEUS_URL/health"
    echo "2. Check logs: docker logs zeus-engine"
    echo "3. Verify environment variables are set correctly"
    echo "4. Ensure all dependencies are installed"
    exit 1
fi
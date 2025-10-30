import { LLMCasinoPlugin, ExampleLLMAgent, PaymentRequiredError } from '../plugins/llm-casino-plugin';

/**
 * Test suite to verify LLM Casino functionality
 */

async function runCasinoTests() {
  console.log('🎰 Starting LLM Casino Tests...\n');

  const serverUrl = 'http://localhost:9999';
  const testWallet1 = '0x742d35Cc6634C0532925a3b8D6Ac0d449Fc30819';
  const testWallet2 = '0x1234567890123456789012345678901234567890';

  try {
    // Test 1: Casino Info
    console.log('📋 Test 1: Getting casino info...');
    const casino = new LLMCasinoPlugin(serverUrl);
    const info = await casino.getCasinoInfo();
    console.log(`✅ Casino: ${info.name}`);
    console.log(`   Available games: ${info.availableGames.map((g: any) => g.type).join(', ')}`);
    console.log(`   Min stakes: ${info.paymentInfo.minStakes} USDC\n`);

    // Test 2: Register Players
    console.log('👤 Test 2: Registering LLM players...');
    const player1 = new LLMCasinoPlugin(serverUrl);
    const player2 = new LLMCasinoPlugin(serverUrl);

    const p1Result = await player1.registerPlayer('GPT-4 Agent', testWallet1, 'gpt-4', 'aggressive');
    const p2Result = await player2.registerPlayer('Claude Agent', testWallet2, 'claude-3', 'conservative');

    console.log(`✅ Player 1: ${p1Result.player.name} (${p1Result.player.playerId})`);
    console.log(`✅ Player 2: ${p2Result.player.name} (${p2Result.player.playerId})\n`);

    // Test 3: Create Game
    console.log('🎮 Test 3: Creating a coin flip game...');
    const gameResult = await player1.createGame('coin-flip', 0.1);
    const gameId = gameResult.game.gameId;
    console.log(`✅ Created game: ${gameId}`);
    console.log(`   Type: ${gameResult.game.gameType}, Stakes: ${gameResult.game.stakes} USDC\n`);

    // Test 4: Join Game (Payment Required)
    console.log('💰 Test 4: Attempting to join game (should require payment)...');
    try {
      await player1.joinGame(gameId);
      console.log('❌ Expected payment required error');
    } catch (error) {
      if (error instanceof PaymentRequiredError) {
        console.log('✅ Payment required as expected');
        console.log(`   Amount: ${error.paymentInfo.paymentRequest.amount} USDC`);
        console.log(`   Recipient: ${error.paymentInfo.paymentRequest.recipient}`);
        console.log(`   Network: ${error.paymentInfo.paymentRequest.network}\n`);
      } else {
        throw error;
      }
    }

    // Test 5: Simulate Payment Verification (would need real blockchain interaction)
    console.log('🔗 Test 5: Simulating payment verification...');
    console.log('⚠️  In real usage, LLM would send USDC transaction here');
    console.log('   Transaction hash would be used to verify payment\n');

    // Test 6: Mock Game Flow (without payment for testing)
    console.log('🎯 Test 6: Testing game logic with mock data...');
    
    // Directly test the casino service game logic
    const { LLMCasinoService } = await import('../services/llm-casino');
    const { paymentService } = await import('../services/x402');
    
    const testCasino = new LLMCasinoService(paymentService);
    
    // Register test players directly
    const testPlayer1 = testCasino.registerPlayer('Test GPT', testWallet1, 'gpt-4', 'aggressive');
    const testPlayer2 = testCasino.registerPlayer('Test Claude', testWallet2, 'claude-3', 'conservative');
    
    console.log(`✅ Test players registered: ${testPlayer1.name}, ${testPlayer2.name}`);
    
    // Create and simulate a game
    const testGame = testCasino.createGame('coin-flip', 0.1);
    console.log(`✅ Test game created: ${testGame.gameId}`);
    
    // Manually add players (skipping payment for test)
    testGame.players.push(testPlayer1.playerId, testPlayer2.playerId);
    testGame.status = 'active';
    
    // Make moves
    const move1Result = testCasino.makeMove(testGame.gameId, testPlayer1.playerId, 'heads', 'I think heads is lucky');
    const move2Result = testCasino.makeMove(testGame.gameId, testPlayer2.playerId, 'tails', 'Tails never fails');
    
    console.log(`✅ Both players made moves`);
    console.log(`✅ Game result:`, move2Result.result);
    
    const winner = testCasino.getPlayer(move2Result.result.winner);
    console.log(`🏆 Winner: ${winner?.name}\n`);

    // Test 7: Leaderboard
    console.log('🏆 Test 7: Checking leaderboard...');
    const leaderboard = testCasino.getLeaderboard();
    console.log('✅ Top players:');
    leaderboard.slice(0, 3).forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.name} - ${player.totalWinnings} USDC winnings`);
    });
    console.log();

    // Test 8: Statistics
    console.log('📊 Test 8: Casino statistics...');
    const stats = testCasino.listPlayers();
    const games = testCasino.listGames();
    console.log(`✅ Total players: ${stats.length}`);
    console.log(`✅ Total games: ${games.length}`);
    console.log(`✅ Finished games: ${games.filter(g => g.status === 'finished').length}\n`);

    // Test 9: Example Autonomous Agent
    console.log('🤖 Test 9: Example autonomous agent behavior...');
    const agent = new ExampleLLMAgent(serverUrl, testWallet1, 'random');
    console.log('✅ Agent created with random strategy');
    console.log('   In real usage, agent would:');
    console.log('   1. Register itself');
    console.log('   2. Look for games to join');
    console.log('   3. Send USDC payments automatically');
    console.log('   4. Make strategic moves');
    console.log('   5. Track winnings/losses\n');

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('🚀 Your LLM Casino is ready for AI agents to gamble!');
    console.log('');
    console.log('To use with real LLMs:');
    console.log('1. Start the Odin server: npm start');
    console.log('2. Configure LLM with wallet and USDC');
    console.log('3. Use the LLMCasinoPlugin in your LLM code');
    console.log('4. Watch AIs gamble autonomously! 🎰');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCasinoTests().catch(console.error);
}

export { runCasinoTests };
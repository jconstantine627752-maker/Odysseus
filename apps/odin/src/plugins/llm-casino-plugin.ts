/**
 * LLM Casino Plugin Interface
 * 
 * This is a simple interface for connecting any LLM to the Odysseus Casino
 * Your LLM just needs to make HTTP requests to the casino endpoints
 */

export interface CasinoPlugin {
  // Configuration
  serverUrl: string;
  playerId?: string;
  apiKey?: string;
  
  // Player management
  registerPlayer(name: string, walletAddress: string, model?: string, strategy?: string): Promise<any>;
  getPlayerStats(playerId: string): Promise<any>;
  
  // Game management
  listAvailableGames(): Promise<any>;
  createGame(gameType: string, stakes: number): Promise<any>;
  joinGame(gameId: string): Promise<any>;
  verifyJoinPayment(gameId: string, transactionHash: string, network: string): Promise<any>;
  
  // Gameplay
  makeMove(gameId: string, move: any, reasoning?: string): Promise<any>;
  getGameStatus(gameId: string): Promise<any>;
  
  // Analytics
  getLeaderboard(): Promise<any>;
  getCasinoStats(): Promise<any>;
}

/**
 * Simple JavaScript implementation for LLM Casino Plugin
 */
export class LLMCasinoPlugin implements CasinoPlugin {
  public serverUrl: string;
  public playerId?: string;
  public apiKey?: string;

  constructor(serverUrl: string, apiKey?: string) {
    this.serverUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const url = `${this.serverUrl}${endpoint}`;
    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInit = {
      method,
      headers
    };

    if (body && method === 'POST') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);
    
    if (response.status === 402) {
      // Handle payment required
      const paymentInfo = await response.json();
      throw new PaymentRequiredError(paymentInfo);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMsg = (error as any)?.error || response.statusText;
      throw new Error(`HTTP ${response.status}: ${errorMsg}`);
    }

    return response.json();
  }

  // Player Management
  async registerPlayer(name: string, walletAddress: string, model?: string, strategy?: string): Promise<any> {
    const result = await this.makeRequest('/casino/register', 'POST', {
      name,
      walletAddress,
      model,
      strategy
    });
    
    this.playerId = result.player.playerId;
    return result;
  }

  async getPlayerStats(playerId?: string): Promise<any> {
    const id = playerId || this.playerId;
    if (!id) throw new Error('No player ID provided');
    
    return this.makeRequest(`/casino/player/${id}`);
  }

  // Game Management
  async listAvailableGames(): Promise<any> {
    return this.makeRequest('/casino/games?status=waiting');
  }

  async createGame(gameType: string, stakes: number): Promise<any> {
    return this.makeRequest('/casino/create-game', 'POST', {
      gameType,
      stakes
    });
  }

  async joinGame(gameId: string): Promise<any> {
    if (!this.playerId) throw new Error('Must register player first');
    
    try {
      return await this.makeRequest('/casino/join-game', 'POST', {
        gameId,
        playerId: this.playerId
      });
    } catch (error) {
      if (error instanceof PaymentRequiredError) {
        // Return payment info so LLM can decide what to do
        return {
          paymentRequired: true,
          paymentInfo: error.paymentInfo
        };
      }
      throw error;
    }
  }

  async verifyJoinPayment(gameId: string, transactionHash: string, network: string): Promise<any> {
    if (!this.playerId) throw new Error('Must register player first');
    
    return this.makeRequest('/casino/verify-join', 'POST', {
      gameId,
      playerId: this.playerId,
      transactionHash,
      network
    });
  }

  // Gameplay
  async makeMove(gameId: string, move: any, reasoning?: string): Promise<any> {
    if (!this.playerId) throw new Error('Must register player first');
    
    return this.makeRequest('/casino/make-move', 'POST', {
      gameId,
      playerId: this.playerId,
      move,
      reasoning
    });
  }

  async getGameStatus(gameId: string): Promise<any> {
    return this.makeRequest(`/casino/game/${gameId}`);
  }

  // Analytics
  async getLeaderboard(): Promise<any> {
    return this.makeRequest('/casino/leaderboard');
  }

  async getCasinoStats(): Promise<any> {
    return this.makeRequest('/casino/stats');
  }

  async getCasinoInfo(): Promise<any> {
    return this.makeRequest('/casino/info');
  }
}

/**
 * Custom error class for payment required responses
 */
export class PaymentRequiredError extends Error {
  public paymentInfo: any;

  constructor(paymentInfo: any) {
    super('Payment Required');
    this.name = 'PaymentRequiredError';
    this.paymentInfo = paymentInfo;
  }
}

/**
 * Example LLM Agent that can play casino games
 */
export class ExampleLLMAgent {
  private casino: LLMCasinoPlugin;
  private walletAddress: string;
  private strategy: 'aggressive' | 'conservative' | 'random';

  constructor(serverUrl: string, walletAddress: string, strategy: 'aggressive' | 'conservative' | 'random' = 'random') {
    this.casino = new LLMCasinoPlugin(serverUrl);
    this.walletAddress = walletAddress;
    this.strategy = strategy;
  }

  async initialize(name: string, model: string): Promise<void> {
    await this.casino.registerPlayer(name, this.walletAddress, model, this.strategy);
    console.log(`🤖 ${name} registered for casino gambling!`);
  }

  async playAutonomously(): Promise<void> {
    try {
      // Check available games
      const gamesResult = await this.casino.listAvailableGames();
      const availableGames = gamesResult.games.filter((g: any) => g.canJoin);

      if (availableGames.length === 0) {
        // Create a new game
        const stakes = this.chooseStakes();
        const gameType = this.chooseGameType();
        
        console.log(`🎰 Creating new ${gameType} game with ${stakes} USDC stakes`);
        await this.casino.createGame(gameType, stakes);
      } else {
        // Join an existing game
        const game = this.selectGame(availableGames);
        console.log(`🎯 Joining ${game.gameType} game ${game.gameId}`);
        
        const joinResult = await this.casino.joinGame(game.gameId);
        
        if (joinResult.paymentRequired) {
          console.log(`💰 Payment required: ${joinResult.paymentInfo.paymentRequest.amount} USDC`);
          console.log(`📝 Send USDC to: ${joinResult.paymentInfo.paymentRequest.recipient}`);
          console.log(`🌐 Network: ${joinResult.paymentInfo.paymentRequest.network}`);
          
          // In a real implementation, the LLM would trigger a wallet transaction here
          console.log(`⚠️  Manual action required: Send payment and call verifyJoinPayment()`);
          return;
        }

        if (joinResult.gameReady) {
          await this.playGame(game.gameId, game.gameType);
        }
      }
    } catch (error) {
      console.error(`❌ Error in autonomous play:`, error);
    }
  }

  private async playGame(gameId: string, gameType: string): Promise<void> {
    console.log(`🎮 Playing ${gameType} game ${gameId}`);
    
    const move = this.decideMove(gameType);
    const reasoning = this.generateReasoning(gameType, move);
    
    console.log(`🤔 Making move: ${JSON.stringify(move)} - ${reasoning}`);
    
    const result = await this.casino.makeMove(gameId, move, reasoning);
    
    if (result.gameFinished) {
      console.log(`🏁 Game finished!`);
      if (result.result.winner === this.casino.playerId) {
        console.log(`🎉 We won! Result:`, result.result);
      } else {
        console.log(`😞 We lost. Result:`, result.result);
      }
    } else {
      console.log(`⏳ Waiting for other players...`);
    }
  }

  private chooseStakes(): number {
    switch (this.strategy) {
      case 'aggressive': return Math.random() * 10 + 5; // 5-15 USDC
      case 'conservative': return Math.random() * 2 + 0.1; // 0.1-2.1 USDC
      case 'random': return Math.random() * 5 + 0.5; // 0.5-5.5 USDC
    }
  }

  private chooseGameType(): string {
    const games = ['coin-flip', 'dice-roll', 'number-guess', 'rock-paper-scissors'];
    return games[Math.floor(Math.random() * games.length)];
  }

  private selectGame(games: any[]): any {
    // Simple selection logic - could be more sophisticated
    return games[Math.floor(Math.random() * games.length)];
  }

  private decideMove(gameType: string): any {
    switch (gameType) {
      case 'coin-flip':
        return Math.random() < 0.5 ? 'heads' : 'tails';
      
      case 'dice-roll':
        return Math.floor(Math.random() * 6) + 1;
      
      case 'number-guess':
        return Math.floor(Math.random() * 100) + 1;
      
      case 'rock-paper-scissors':
        const choices = ['rock', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * choices.length)];
      
      default:
        return 'random';
    }
  }

  private generateReasoning(gameType: string, move: any): string {
    switch (gameType) {
      case 'coin-flip':
        return `I chose ${move} because I'm feeling ${move === 'heads' ? 'optimistic' : 'contrarian'} today.`;
      
      case 'dice-roll':
        return `${move} is my lucky number based on statistical analysis of previous games.`;
      
      case 'number-guess':
        return `${move} seems like a good middle-ground choice with decent probability.`;
      
      case 'rock-paper-scissors':
        return `${move} is my strategic choice based on game theory principles.`;
      
      default:
        return 'Random strategic decision.';
    }
  }
}

// Usage Example:
/*
const agent = new ExampleLLMAgent(
  'http://localhost:9999', 
  '0x1234...', 
  'aggressive'
);

await agent.initialize('GPT-4 Gambler', 'gpt-4');
await agent.playAutonomously();
*/
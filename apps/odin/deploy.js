#!/usr/bin/env node

/**
 * Odin X402 Protocol Module - Deployment Script
 * Quick deployment and verification script for the Odysseus platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
    log(`\n📋 ${description}...`, 'blue');
    try {
        const result = execSync(command, { stdio: 'inherit', cwd: process.cwd() });
        log(`✅ ${description} completed successfully`, 'green');
        return true;
    } catch (error) {
        log(`❌ ${description} failed: ${error.message}`, 'red');
        return false;
    }
}

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        log(`✅ ${description} exists`, 'green');
        return true;
    } else {
        log(`❌ ${description} missing: ${filePath}`, 'red');
        return false;
    }
}

async function main() {
    log('🔱 Odin X402 Protocol Module - Deployment Script', 'cyan');
    log('=' .repeat(50), 'cyan');
    
    const odinPath = path.join(__dirname);
    process.chdir(odinPath);
    
    log(`\nDeploying from: ${odinPath}`, 'yellow');
    
    // Step 1: Verify project structure
    log('\n🏗️  Verifying Project Structure', 'magenta');
    const requiredFiles = [
        ['package.json', 'Package configuration'],
        ['src/server.ts', 'Main server file'],
        ['src/config/config.ts', 'Configuration manager'],
        ['src/providers/x402.ts', 'X402 provider'],
        ['src/services/arbitrage.ts', 'Arbitrage engine'],
        ['src/routes/health.ts', 'Health endpoints'],
        ['Dockerfile', 'Docker configuration'],
        ['.env.example', 'Environment template']
    ];
    
    let allFilesExist = true;
    for (const [file, description] of requiredFiles) {
        if (!checkFile(file, description)) {
            allFilesExist = false;
        }
    }
    
    if (!allFilesExist) {
        log('\n❌ Missing required files. Please ensure all files are created.', 'red');
        process.exit(1);
    }
    
    // Step 2: Install dependencies
    if (!execCommand('npm install', 'Installing dependencies')) {
        process.exit(1);
    }
    
    // Step 3: Build TypeScript
    if (!execCommand('npm run build', 'Building TypeScript')) {
        log('\n⚠️  Build failed, but continuing with development mode...', 'yellow');
    }
    
    // Step 4: Create .env if not exists
    if (!fs.existsSync('.env')) {
        log('\n📝 Creating .env file from template...', 'blue');
        try {
            fs.copyFileSync('.env.example', '.env');
            log('✅ .env file created. Please edit it with your API keys and settings.', 'green');
            log('⚠️  Important: Update the following in .env:', 'yellow');
            log('   - X402_RPC_ENDPOINT', 'yellow');
            log('   - Your API keys for external services', 'yellow');
            log('   - Redis connection string if different', 'yellow');
        } catch (error) {
            log(`❌ Failed to create .env: ${error.message}`, 'red');
        }
    }
    
    // Step 5: Test configuration
    log('\n🧪 Running quick health check...', 'magenta');
    
    // Create a simple test script
    const testScript = `
        const { OdinConfig } = require('./dist/config/config.js');
        try {
            const config = new OdinConfig();
            console.log('✅ Configuration loaded successfully');
            console.log(\`Port: \${config.server.port}\`);
            console.log(\`Chain ID: \${config.x402.chainId}\`);
            console.log(\`Environment: \${config.server.environment}\`);
            process.exit(0);
        } catch (error) {
            console.error('❌ Configuration error:', error.message);
            process.exit(1);
        }
    `;
    
    fs.writeFileSync('test-config.js', testScript);
    
    try {
        execSync('node test-config.js', { stdio: 'inherit' });
        fs.unlinkSync('test-config.js');
    } catch (error) {
        log('⚠️  Configuration test failed, but continuing...', 'yellow');
        if (fs.existsSync('test-config.js')) {
            fs.unlinkSync('test-config.js');
        }
    }
    
    // Step 6: Show deployment options
    log('\n🚀 Deployment Complete! Choose how to run Odin:', 'green');
    log('=' .repeat(40), 'green');
    
    log('\n1️⃣  Development Mode:', 'cyan');
    log('   npm run dev', 'white');
    
    log('\n2️⃣  Production Mode:', 'cyan');
    log('   npm start', 'white');
    
    log('\n3️⃣  Docker (Individual):', 'cyan');
    log('   docker build -t odin-x402 .', 'white');
    log('   docker run -p 9999:9999 --env-file .env odin-x402', 'white');
    
    log('\n4️⃣  Docker Compose (Full Platform):', 'cyan');
    log('   cd ../../', 'white');
    log('   docker-compose up --build', 'white');
    
    log('\n🔧 Testing Commands:', 'magenta');
    log('   npm test                  # Run test suite', 'white');
    log('   ./test-odin.sh           # Comprehensive API testing', 'white');
    log('   curl http://localhost:9999/health  # Quick health check', 'white');
    
    log('\n📚 API Documentation:', 'magenta');
    log('   http://localhost:9999/          # Service info', 'white');
    log('   http://localhost:9999/health    # Health status', 'white');
    log('   http://localhost:9999/x402/protocols  # X402 protocols', 'white');
    
    log('\n⚠️  Important Next Steps:', 'yellow');
    log('   1. Edit .env file with your API keys', 'white');
    log('   2. Ensure Redis is running (docker-compose starts it)', 'white');
    log('   3. Test with paper trading mode first (ENABLE_PAPER_TRADING=true)', 'white');
    log('   4. Monitor logs for any configuration issues', 'white');
    
    log('\n✨ Odin X402 Protocol Module is ready for trading! 🔱', 'green');
}

if (require.main === module) {
    main().catch(console.error);
}
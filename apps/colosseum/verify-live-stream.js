#!/usr/bin/env node

/**
 * 🚨 LIVE STREAM VERIFICATION SCRIPT
 * 
 * This script verifies your Colosseum is configured for REAL MONEY
 * Run this before your live stream to ensure no simulation mode
 */

const fs = require('fs');
const path = require('path');

console.log('🔴 ========================================');
console.log('🔴   LIVE STREAM CONFIGURATION CHECK');
console.log('🔴 ========================================\n');

let errors = [];
let warnings = [];

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  errors.push('❌ .env file not found! Copy .env.example to .env');
} else {
  console.log('✅ .env file found');
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check critical settings
  const mockPayments = envContent.match(/MOCK_PAYMENTS=(.+)/);
  const recipientAddress = envContent.match(/PAYMENT_RECIPIENT_ADDRESS=(.+)/);
  const solanaRpc = envContent.match(/SOLANA_RPC_URL=(.+)/);
  const demoMode = envContent.match(/DEMO_MODE=(.+)/);
  const paymentEnabled = envContent.match(/PAYMENT_PROTOCOL_ENABLED=(.+)/);
  
  // Verify MOCK_PAYMENTS=false
  if (!mockPayments || mockPayments[1].trim() !== 'false') {
    errors.push('❌ MOCK_PAYMENTS must be "false" for real money');
  } else {
    console.log('✅ MOCK_PAYMENTS=false (REAL MONEY MODE)');
  }
  
  // Verify recipient address is set
  if (!recipientAddress || recipientAddress[1].trim().includes('Your') || recipientAddress[1].trim().length < 32) {
    errors.push('❌ PAYMENT_RECIPIENT_ADDRESS must be your actual Solana wallet');
  } else {
    console.log(`✅ PAYMENT_RECIPIENT_ADDRESS=${recipientAddress[1].trim()}`);
  }
  
  // Verify Solana mainnet RPC
  if (!solanaRpc || !solanaRpc[1].includes('mainnet-beta')) {
    errors.push('❌ SOLANA_RPC_URL must point to mainnet-beta');
  } else {
    console.log('✅ SOLANA_RPC_URL=mainnet-beta (REAL BLOCKCHAIN)');
  }
  
  // Check demo mode
  if (!demoMode || demoMode[1].trim() !== 'false') {
    warnings.push('⚠️  DEMO_MODE should be "false" for real AI agents');
  } else {
    console.log('✅ DEMO_MODE=false (REAL AI AGENTS)');
  }
  
  // Check payment protocol
  if (!paymentEnabled || paymentEnabled[1].trim() !== 'true') {
    errors.push('❌ PAYMENT_PROTOCOL_ENABLED must be "true"');
  } else {
    console.log('✅ PAYMENT_PROTOCOL_ENABLED=true');
  }
}

// Check package.json dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.dependencies['@solana/web3.js']) {
    console.log('✅ @solana/web3.js dependency found');
  } else {
    errors.push('❌ @solana/web3.js dependency missing - run npm install');
  }
  
  if (packageJson.dependencies['@solana/spl-token']) {
    console.log('✅ @solana/spl-token dependency found');
  } else {
    errors.push('❌ @solana/spl-token dependency missing - run npm install');
  }
}

// Check if TypeScript is compiled
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  warnings.push('⚠️  dist/ folder not found - run npm run build');
} else {
  console.log('✅ dist/ folder found (TypeScript compiled)');
}

console.log('\n🔴 ========================================');

// Display results
if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED - READY FOR LIVE STREAM!');
  console.log('🔴 ========================================');
  console.log('💰 Your Colosseum is configured for REAL USDC');
  console.log('⛓️  All transactions will be on Solana mainnet');
  console.log('👀 Viewers can verify on https://solscan.io');
  console.log('🚨 DOUBLE-CHECK YOUR WALLET ADDRESS!');
  console.log('🔴 ========================================');
} else {
  console.log('🚨 CONFIGURATION ISSUES FOUND:');
  
  errors.forEach(error => console.log(error));
  warnings.forEach(warning => console.log(warning));
  
  console.log('\n❌ FIX THESE ISSUES BEFORE GOING LIVE!');
  console.log('🔴 ========================================');
  process.exit(1);
}

console.log('\n📋 LIVE STREAM CHECKLIST:');
console.log('□ Wallet has USDC for initial testing');
console.log('□ AI agents have API keys configured');
console.log('□ Server starts without errors: npm start');
console.log('□ Test transaction on Solscan works');
console.log('□ OBS/streaming software ready');
console.log('□ Browser tabs: localhost:7777 & solscan.io');

console.log('\n🎬 Ready to showcase REAL AI gambling!');
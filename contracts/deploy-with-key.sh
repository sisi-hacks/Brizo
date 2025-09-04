#!/bin/bash

# Brizo Smart Contracts Deployment Script using Stacks CLI
# Deploys contracts to Stacks Testnet with your private key

set -e

echo "🚀 Deploying Brizo Smart Contracts to Stacks Testnet..."

# Check if Stacks CLI is installed
if ! command -v stx &> /dev/null; then
    echo "❌ Stacks CLI not found. Please install it first:"
    echo "   npm install -g @stacks/cli"
    exit 1
fi

# Check if private key is set
if [ -z "$PAYMENT_KEY" ]; then
    echo "❌ PAYMENT_KEY environment variable not set!"
    echo ""
    echo "Please set your private key first:"
    echo "   export PAYMENT_KEY=\"your_private_key_here\""
    echo ""
    echo "⚠️  IMPORTANT: Never commit or share your private key!"
    echo "   Your private key should start with a number and be 64 characters long"
    exit 1
fi

# Check if we're in the contracts directory
if [ ! -f "brizo-payments.clar" ]; then
    echo "❌ Please run this script from the contracts directory"
    exit 1
fi

echo "✅ Using private key: (hidden)"
echo ""

# Deploy contracts one by one
echo "📦 Deploying brizo-trait.clar..."
stx deploy_contract brizo-trait.clar brizo-trait 50000 0 "$PAYMENT_KEY" --network testnet

echo "📦 Deploying brizo-payments.clar..."
stx deploy_contract brizo-payments.clar brizo-payments 50000 0 "$PAYMENT_KEY" --network testnet

echo "📦 Deploying brizo-sbtc-integration.clar..."
stx deploy_contract brizo-sbtc-integration.clar brizo-sbtc-integration 50000 0 "$PAYMENT_KEY" --network testnet

echo "📦 Deploying deploy.clar..."
stx deploy_contract deploy.clar deploy 50000 0 "$PAYMENT_KEY" --network testnet

echo ""
echo "✅ All contracts deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Update frontend/lib/contracts.ts with deployed addresses"
echo "   2. Test contract functions on testnet"
echo "   3. Deploy to mainnet when ready"
echo ""
echo "🔗 View on Explorer: https://explorer.hiro.so/"

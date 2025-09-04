#!/bin/bash

# Brizo Smart Contracts Deployment Script
# Deploys contracts to Stacks Testnet

set -e

echo "🚀 Deploying Brizo Smart Contracts to Stacks Testnet..."

# Check if Clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "❌ Clarinet CLI not found. Please install it first:"
    echo "   curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash"
    exit 1
fi

# Check if we're in the contracts directory
if [ ! -f "Clarinet.toml" ]; then
    echo "❌ Please run this script from the contracts directory"
    exit 1
fi

# Build contracts
echo "📦 Building contracts..."
clarinet build

# Check build success
if [ $? -ne 0 ]; then
    echo "❌ Contract build failed"
    exit 1
fi

echo "✅ Contracts built successfully"

# Deploy to testnet
echo "🌐 Deploying to testnet..."
clarinet deploy --network testnet

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "   Network: Stacks Testnet"
    echo "   Contracts:"
    echo "     - brizo-payments.clar"
    echo "     - brizo-trait.clar"
    echo "     - deploy.clar"
    echo ""
    echo "🔗 View on Explorer: https://explorer.hiro.so/address/ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update frontend/lib/contracts.ts with deployed addresses"
    echo "   2. Test contract functions on testnet"
    echo "   3. Deploy to mainnet when ready"
else
    echo "❌ Deployment failed"
    exit 1
fi

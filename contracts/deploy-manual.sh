#!/bin/bash

# Manual Deployment Script for Brizo Smart Contracts
# Uses Stacks CLI directly instead of Clarinet

set -e

echo "🚀 Manual Deployment of Brizo Smart Contracts to Stacks Testnet..."

# Check if Stacks CLI is installed
if ! command -v stacks &> /dev/null; then
    echo "❌ Stacks CLI not found. Installing..."
    npm install -g @stacks/cli
fi

# Check if we're in the contracts directory
if [ ! -f "Clarinet.toml" ]; then
    echo "❌ Please run this script from the contracts directory"
    exit 1
fi

# Contract files to deploy
CONTRACTS=(
    "brizo-sbtc-integration.clar"
    "brizo-payments.clar"
    "brizo-trait.clar"
    "deploy.clar"
)

# Deployer address (update this with your actual address)
DEPLOYER_ADDRESS="ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB"

echo "📋 Deploying contracts with deployer: $DEPLOYER_ADDRESS"
echo ""

for contract in "${CONTRACTS[@]}"; do
    if [ -f "$contract" ]; then
        echo "📦 Deploying $contract..."
        
        # Extract contract name (remove .clar extension)
        contract_name=$(basename "$contract" .clar)
        
        # Deploy using Stacks CLI
        # Note: You'll need to set your private key as an environment variable
        # export PAYMENT_KEY="your_private_key_here"
        
        if [ -z "$PAYMENT_KEY" ]; then
            echo "❌ PAYMENT_KEY environment variable not set"
            echo "   Please set it with: export PAYMENT_KEY='your_private_key'"
            exit 1
        fi
        
        # Deploy contract
        stx deploy_contract "$contract" "$contract_name" 50000 0 "$PAYMENT_KEY"
        
        if [ $? -eq 0 ]; then
            echo "✅ $contract deployed successfully!"
        else
            echo "❌ Failed to deploy $contract"
            exit 1
        fi
        
        echo ""
    else
        echo "⚠️  Contract file $contract not found, skipping..."
    fi
done

echo "🎉 All contracts deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Network: Stacks Testnet"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo "   Contracts deployed: ${#CONTRACTS[@]}"
echo ""
echo "🔗 View on Explorer: https://explorer.hiro.so/address/$DEPLOYER_ADDRESS"
echo ""
echo "📝 Next steps:"
echo "   1. Update frontend/lib/contracts.ts with deployed addresses"
echo "   2. Test contract functions on testnet"
echo "   3. Integrate with frontend payment flow"

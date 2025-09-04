#!/bin/bash

# Step-by-Step Deployment Script for Brizo Smart Contracts
# This script guides you through deploying each contract manually

set -e

echo "🚀 Brizo Smart Contracts - Step-by-Step Deployment"
echo "=================================================="
echo ""

# Check if we're in the contracts directory
if [ ! -f "Clarinet.toml" ]; then
    echo "❌ Please run this script from the contracts directory"
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "1. Stacks CLI installed ✅"
echo "2. Testnet STX balance (get from https://faucet.hiro.so/)"
echo "3. Private key exported as PAYMENT_KEY environment variable"
echo ""

# Check if PAYMENT_KEY is set
if [ -z "$PAYMENT_KEY" ]; then
    echo "❌ PAYMENT_KEY environment variable not set"
    echo ""
    echo "🔑 To set your private key, run:"
    echo "   export PAYMENT_KEY='your_private_key_here'"
    echo ""
    echo "⚠️  IMPORTANT: Never commit or share your private key!"
    echo "   Replace 'your_private_key_here' with your actual private key"
    echo ""
    echo "After setting PAYMENT_KEY, run this script again."
    exit 1
fi

echo "✅ PAYMENT_KEY is set"
echo ""

# Contract deployment order
CONTRACTS=(
    "brizo-sbtc-integration"
    "brizo-payments" 
    "brizo-trait"
    "deploy"
)

echo "📦 Ready to deploy ${#CONTRACTS[@]} contracts"
echo ""

for i in "${!CONTRACTS[@]}"; do
    contract="${CONTRACTS[$i]}"
    contract_file="${contract}.clar"
    
    echo "🔄 Step $((i+1)): Deploying $contract"
    echo "   File: $contract_file"
    echo ""
    
    if [ ! -f "$contract_file" ]; then
        echo "❌ Contract file $contract_file not found, skipping..."
        echo ""
        continue
    fi
    
    echo "📝 Deploy command:"
    echo "   stx deploy_contract $contract_file $contract 50000 0 \"\$PAYMENT_KEY\""
    echo ""
    
    echo "⏳ Ready to deploy? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying $contract..."
        
        # Deploy the contract
        stx deploy_contract "$contract_file" "$contract" 50000 0 "$PAYMENT_KEY"
        
        if [ $? -eq 0 ]; then
            echo "✅ $contract deployed successfully!"
        else
            echo "❌ Failed to deploy $contract"
            echo "   Check the error message above and try again"
            exit 1
        fi
        
        echo ""
        echo "📋 Deployment Summary for $contract:"
        echo "   - Contract Name: $contract"
        echo "   - File: $contract_file"
        echo "   - Fee: 50000 microSTX"
        echo "   - Nonce: 0"
        echo ""
        
        if [ $i -lt $((${#CONTRACTS[@]}-1)) ]; then
            echo "⏸️  Pausing before next deployment..."
            echo "   Press Enter to continue to the next contract"
            read -r
        fi
        
    else
        echo "⏸️  Skipping $contract deployment"
        echo ""
    fi
done

echo "🎉 Deployment process completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Update frontend/lib/contracts.ts with deployed addresses"
echo "2. Test contract functions on testnet"
echo "3. Integrate with frontend payment flow"
echo ""
echo "🔗 View your contracts on: https://explorer.hiro.so/"
echo ""
echo "📚 For testing help, see: contracts/DEPLOYMENT-GUIDE.md"

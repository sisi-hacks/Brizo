# Brizo Smart Contracts - Deployment Guide

## 🚀 **Deploy to Stacks Testnet**

### **Prerequisites**

1. **Stacks CLI Installed** ✅
   ```bash
   npm install -g @stacks/cli
   ```

2. **Testnet STX Balance** 
   - You need STX tokens on testnet for deployment fees
   - Get testnet STX from: https://faucet.hiro.so/

3. **Private Key Ready**
   - Export your private key: `export PAYMENT_KEY="your_private_key"`
   - **⚠️ Never commit or share your private key!**

### **Deployment Commands**

#### **1. Deploy brizo-sbtc-integration**
```bash
cd contracts
stx deploy_contract brizo-sbtc-integration.clar brizo-sbtc-integration 50000 0 "$PAYMENT_KEY"
```

#### **2. Deploy brizo-payments**
```bash
stx deploy_contract brizo-payments.clar brizo-payments 50000 0 "$PAYMENT_KEY"
```

#### **3. Deploy brizo-trait**
```bash
stx deploy_contract brizo-trait.clar brizo-trait 50000 0 "$PAYMENT_KEY"
```

#### **4. Deploy deploy**
```bash
stx deploy_contract deploy.clar deploy 50000 0 "$PAYMENT_KEY"
```

### **Expected Output**

Each deployment should return:
```json
{
  "txid": "0x...",
  "transaction": "https://explorer.hiro.so/txid/0x..."
}
```

### **Update Frontend Integration**

After deployment, update `frontend/lib/contracts.ts` with your deployed addresses:

```typescript
const CONTRACT_ADDRESSES = {
  testnet: {
    brizoPayments: 'YOUR_ADDRESS.brizo-payments',
    brizoTrait: 'YOUR_ADDRESS.brizo-trait',
    deploy: 'YOUR_ADDRESS.deploy'
  }
}
```

### **Test Deployment**

1. **Check Contract on Explorer**
   - Visit: https://explorer.hiro.so/
   - Search for your contract address

2. **Test Basic Functions**
   - Use the Stacks CLI to call contract functions
   - Example: `stx call_contract_func YOUR_ADDRESS.brizo-sbtc-integration get-platform-stats`

### **Troubleshooting**

- **Insufficient STX**: Get more from https://faucet.hiro.so/
- **Invalid Contract**: Check Clarity syntax with `clarity check contract.clar`
- **Network Issues**: Ensure you're on testnet, not mainnet

### **Next Steps After Deployment**

1. ✅ **Update frontend contract addresses**
2. ✅ **Test merchant registration**
3. ✅ **Test payment creation**
4. ✅ **Test sBTC integration**
5. ✅ **Deploy to mainnet when ready**

## 🔗 **Useful Links**

- [Stacks Explorer](https://explorer.hiro.so/)
- [Testnet Faucet](https://faucet.hiro.so/)
- [Clarity Documentation](https://docs.stacks.co/write-smart-contracts/)
- [sBTC Integration](https://docs.hiro.so/en/tools/clarinet/sbtc-integration)

# Brizo Smart Contract Foundation

This directory contains the smart contract foundation for the Brizo payment system, built on the Stacks blockchain using Clarity smart contracts.

## Overview

The Brizo smart contract system provides a decentralized foundation for sBTC payment processing, offering:

- **Payment Tracking**: Immutable payment records on the blockchain
- **Merchant Management**: Decentralized merchant registration and management
- **sBTC Integration**: Native support for sBTC transactions
- **Future Expansion**: Extensible architecture for additional features

## Architecture

### Smart Contracts

1. **`brizo-payments.clar`** - Main payment processing contract
2. **`brizo-trait.clar`** - Contract interface definition

### Integration Services

1. **`SmartContractService`** - Direct contract interaction
2. **`ContractIntegrationService`** - Hybrid database/contract approach

## Contract Features

### Payment Management
- Create payments with merchant, amount, currency, and description
- Process payments with sBTC transaction verification
- Track payment status and history
- Immutable payment records

### Merchant Management
- Register new merchants
- Update merchant status
- Track merchant balances
- Wallet address management

### Contract Administration
- Contract statistics and monitoring
- Emergency pause/resume functionality
- Owner-only administrative functions

## Deployment

### Prerequisites
- Stacks CLI installed
- Testnet STX for deployment fees
- Private key for contract deployment

### Deploy to Testnet
```bash
# Set environment variables
export STACKS_NETWORK=testnet
export STACKS_PRIVATE_KEY=your_private_key_here

# Deploy contract
node scripts/deploy-contract.js testnet
```

### Deploy to Mainnet
```bash
# Set environment variables
export STACKS_NETWORK=mainnet
export STACKS_PRIVATE_KEY=your_private_key_here

# Deploy contract
node scripts/deploy-contract.js mainnet
```

## Integration

### Environment Variables
```bash
# Contract Configuration
CONTRACT_ENABLED=true
CONTRACT_ADDRESS=ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB
CONTRACT_PRIVATE_KEY=your_contract_private_key

# Network Configuration
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
```

### Hybrid Approach
The system supports a hybrid approach where payments are stored in both:
1. **Database** - For fast queries and traditional operations
2. **Smart Contract** - For immutability and decentralization

This allows for gradual migration and provides redundancy.

## API Endpoints

### Contract-Specific Endpoints
- `GET /contract/stats` - Get contract statistics
- `POST /contract/register-merchant` - Register merchant in contract
- `GET /contract/payment/:id` - Get payment from contract
- `GET /contract/merchant/:id/balance` - Get merchant balance from contract

## Development

### Testing
```bash
# Test contract functions
node scripts/test-contract.js

# Deploy to local testnet
stacks-node start --config=config.toml
```

### Contract Interaction
```javascript
const SmartContractService = require('./lib/smartContract');
const contractService = new SmartContractService();

// Create payment
const result = await contractService.createPayment(
  'merchant123',
  1000, // amount in micro-units
  'sBTC',
  'Test payment',
  privateKey
);
```

## Security Considerations

### Access Control
- Contract owner has administrative privileges
- Merchant registration requires owner approval
- Payment processing is open to all users

### Data Validation
- All inputs are validated before processing
- Amount must be greater than zero
- Merchant must exist before payment creation

### Error Handling
- Comprehensive error codes and messages
- Graceful failure handling
- Transaction rollback on errors

## Future Expansion

### Planned Features
1. **Multi-Currency Support** - Support for additional tokens
2. **Payment Splitting** - Split payments between multiple recipients
3. **Subscription Payments** - Recurring payment support
4. **Escrow Services** - Hold payments until conditions are met
5. **Analytics** - On-chain payment analytics and reporting

### Extension Points
- New payment types can be added
- Additional merchant fields can be supported
- Custom validation logic can be implemented
- Integration with other DeFi protocols

## Monitoring

### Contract Events
The contract emits events for:
- Payment creation
- Payment processing
- Merchant registration
- Contract state changes

### Health Checks
- Contract status monitoring
- Transaction success rates
- Gas usage optimization
- Network connectivity

## Support

For questions or issues with the smart contract system:
1. Check the contract logs
2. Verify network connectivity
3. Ensure proper private key configuration
4. Review transaction status on Stacks Explorer

## License

This smart contract foundation is part of the Brizo payment system and follows the same licensing terms.

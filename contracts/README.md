# Brizo Smart Contracts

This directory contains the smart contracts that power the Brizo payment gateway on Stacks.

## 🏗️ Architecture

### Core Contracts

1. **`brizo-payments.clar`** - Main payment contract
   - Payment creation and management
   - Merchant registration
   - Platform fee collection
   - Payment status tracking

2. **`brizo-trait.clar`** - Interface definitions
   - Standard payment trait
   - Extension traits for advanced features
   - Utility traits for common operations

3. **`deploy.clar`** - Deployment initialization
   - System initialization
   - Access control

### Key Features

- **Escrow Payments**: Secure payment processing with on-chain verification
- **Merchant Management**: On-chain merchant profiles and statistics
- **Platform Fees**: Automated 0.25% fee collection
- **Event System**: Comprehensive event logging for transparency
- **Access Control**: Secure function access based on user roles

## 🚀 Deployment

### Prerequisites

1. **Install Clarinet CLI**:
   ```bash
   curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash
   ```

2. **Install Stacks CLI** (optional, for mainnet):
   ```bash
   npm install -g @stacks/cli
   ```

### Local Development

1. **Start local devnet**:
   ```bash
   clarinet devnet start
   ```

2. **Build contracts**:
   ```bash
   clarinet build
   ```

3. **Test contracts**:
   ```bash
   clarinet test
   ```

### Testnet Deployment

1. **Deploy to testnet**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Or manually**:
   ```bash
   clarinet deploy --network testnet
   ```

### Mainnet Deployment

1. **Update addresses** in `Clarinet.toml`
2. **Deploy**:
   ```bash
   clarinet deploy --network mainnet
   ```

## 📋 Contract Functions

### Payment Management

- `create-payment` - Create new payment
- `complete-payment` - Mark payment as completed
- `cancel-payment` - Cancel pending payment
- `get-payment` - Retrieve payment details

### Merchant Management

- `register-merchant` - Register new merchant
- `get-merchant` - Get merchant details
- `get-merchant-payments` - List merchant payments

### Platform Operations

- `get-platform-stats` - Platform statistics
- `initialize-system` - Initialize deployment

## 🔧 Integration

### Frontend Integration

The contracts are integrated via `frontend/lib/contracts.ts`:

```typescript
import { createPayment, registerMerchant } from '@/lib/contracts'

// Create payment
const tx = await createPayment({
  network: 'testnet',
  sender: userAddress
}, {
  paymentId: 'unique-id',
  merchantId: 'merchant-123',
  amount: 0.001,
  description: 'Product purchase'
})
```

### API Integration

Contracts can be called directly from the backend:

```typescript
// Check payment status
const payment = await getPayment(config, paymentId)
```

## 🧪 Testing

### Unit Tests

```bash
clarinet test
```

### Integration Tests

```bash
# Test with local devnet
clarinet devnet start
clarinet test --network local
```

### Manual Testing

1. **Register merchant**:
   ```bash
   clarinet console
   (contract-call? .brizo-payments register-merchant "merchant-1" "Test Merchant" "Test Description" "ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB")
   ```

2. **Create payment**:
   ```bash
   (contract-call? .brizo-payments create-payment "payment-1" "merchant-1" 1000 "Test Payment" none)
   ```

## 🔒 Security Features

- **Access Control**: Only authorized users can call functions
- **Input Validation**: All inputs are validated before processing
- **Post Conditions**: Secure token transfers with post-conditions
- **Event Logging**: All actions are logged for transparency
- **Fee Protection**: Platform fees are automatically calculated and collected

## 📊 Data Structures

### Payment
```clarity
(tuple
  (id (string-ascii 64))
  (merchant-id (string-ascii 64))
  (amount uint)
  (description (string-ascii 256))
  (recipient principal)
  (payer principal)
  (status (enum payment-status))
  (created-at uint)
  (completed-at (optional uint))
  (memo (optional (string-ascii 256)))
)
```

### Merchant
```clarity
(tuple
  (id (string-ascii 64))
  (owner principal)
  (name (string-ascii 128))
  (description (string-ascii 256))
  (wallet-address principal)
  (is-active bool)
  (created-at uint)
  (total-volume uint)
  (total-transactions uint)
)
```

## 🌐 Networks

- **Local Devnet**: `http://localhost:20443`
- **Testnet**: `https://api.testnet.hiro.so`
- **Mainnet**: `https://api.hiro.so`

## 📝 Events

### Payment Events
- `payment-created` - Payment created
- `payment-completed` - Payment completed
- `merchant-registered` - Merchant registered

### Event Structure
```clarity
(define-event payment-created
  (payment-id (string-ascii 64))
  (merchant-id (string-ascii 64))
  (amount uint)
  (payer principal)
)
```

## 🔄 Upgrade Path

The contracts are designed for extensibility:

1. **Traits**: Implement new functionality via traits
2. **Extensions**: Add features without breaking existing contracts
3. **Migration**: Deploy new versions with data migration

## 🚨 Important Notes

- **Minimum Payment**: 0.00001 sBTC (1000 micro units)
- **Platform Fee**: 0.25% (25 basis points)
- **Gas Limits**: Ensure sufficient STX for transactions
- **Network**: Testnet for development, mainnet for production

## 📞 Support

For questions about the smart contracts:
- Check the [Stacks documentation](https://docs.stacks.co/)
- Review [Clarity language guide](https://docs.stacks.co/write-smart-contracts/)
- Test thoroughly on testnet before mainnet deployment

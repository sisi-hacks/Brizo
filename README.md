# Brizo — Bitcoin Payments, Effortlessly

A Bitcoin payment gateway built on Stacks using sBTC, enabling seamless payments and donations for creators and merchants.

It Features

- **sBTC Payment Processing**: Accept Bitcoin payments through Stacks
- **Merchant Dashboard**: Create payment links and track transactions
- **Embeddable Donation Widget**: Easy integration for creators and charities
- **Hiro Wallet Integration**: Seamless user experience with Stacks ecosystem
- **Real-time Payment Status**: Live updates on transaction progress

## 🏗️ Architecture

```
/brizo
├── /frontend          # Next.js + TailwindCSS
├── /backend           # Node.js + Express
└── README.md
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, React
- **Backend**: Node.js, Express.js, SQLite
- **Blockchain**: Stacks, sBTC, Hiro Wallet
- **Styling**: TailwindCSS, HeadlessUI

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Hiro Wallet extension installed

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

### 5‑Minute Stripe‑style Quickstart

1) Set envs
```
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_APP_NAME=Brizo
NEXT_PUBLIC_APP_ICON=/favicon.ico
```

2) Start backend and frontend (two terminals)
```
cd backend && npm run dev
cd frontend && npm run dev
```

3) Create a payment (REST)
```
curl -s -X POST "$NEXT_PUBLIC_API_URL/create-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "description": "T-shirt",
    "merchantId": "merchant_123",
    "donation": false
  }'
```

4) Open the returned `checkoutUrl` in your browser, Connect Wallet (Hiro/Xverse), and submit.

## 📱 Usage

### For Merchants

1. Visit `/merchant` page
2. Enter amount and description
3. Copy generated checkout link
4. Share with customers

### For Customers

1. Click checkout link
2. Connect Hiro Wallet
3. Approve sBTC payment
4. Receive confirmation

### For Developers

#### API Endpoints

**Create Payment**
```bash
curl -X POST http://localhost:3001/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "description": "T-shirt",
    "merchantId": "merchant123",
    "donation": false
  }'
```

**Check Payment Status**
```bash
curl http://localhost:3001/check-status/payment_123
```

#### React Components

**Payment Button**
```jsx
import { PayWithsBTC } from '@/components/PayWithsBTC';

<PayWithsBTC 
  amount={0.01} 
  description="T-shirt" 
  merchantId="merchant123" 
/>
```

**Donation Widget**
```jsx
import { DonateWithsBTC } from '@/components/DonateWithsBTC';

<DonateWithsBTC merchantId="merchant123" />
```

## 🔌 Embeddable Widget

Add this script to any website:

```html
<script>
  // Optional: set a global API URL once for all widgets
  window.BRIZO_API_URL = 'https://your-brizo-backend.com';
</script>
<script src="https://your-brizo-frontend.com/widget.js"></script>

<!-- Donation widget (creates a payment and redirects to checkout) -->
<div id="brizo-donation-widget"
     data-merchant-id="merchant123"
     data-api-url="https://your-brizo-backend.com"  
     data-preset-amounts='[0.001,0.005,0.01,0.05]'
     data-show-custom-amount="true"></div>

<!-- One-time payment widget with fixed amount -->
<div id="brizo-payment-widget"
     data-merchant-id="merchant123"
     data-description="T-shirt"
     data-amount="0.01"
     data-api-url="https://your-brizo-backend.com"></div>
```

The widget will POST to `{apiUrl}/create-payment` and then redirect to `checkoutUrl`.

### React Drop‑in
```tsx
import PayWithsBTC from '@/components/PayWithsBTC'

<PayWithsBTC amount={0.01} description="T-shirt" merchantId="merchant123" />
```

## 🧭 Demo Mode and Switching to Real sBTC

Brizo includes a Demo Mode using a SIP‑010 token as a stand‑in for sBTC while sBTC testnet finalizes. Demo Mode is visibly indicated in the UI.

### Enable Demo Mode
```
# frontend/.env.local
NEXT_PUBLIC_DEMO_MODE=true
```

### Switch to Real sBTC (when available)
1) Set Demo Mode off
```
NEXT_PUBLIC_DEMO_MODE=false
```
2) Configure sBTC contract in frontend
```
# frontend/.env.local
NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS=SPXXXX...    
NEXT_PUBLIC_SBTC_CONTRACT_NAME=sbtc-token
NEXT_PUBLIC_SBTC_TRANSFER_FN=transfer
NEXT_PUBLIC_STACKS_NETWORK=testnet
```
3) Verify wallet connects on Testnet (Hiro/Xverse) and has STX for fees
4) Create a small payment (0.001 sBTC) and complete checkout
5) Confirm tx on Stacks Explorer and that the checkout reflects status

Notes:
- The transfer is executed via `@stacks/connect` contract call using SIP‑010 `transfer`.
- Once the official sBTC contract address/name is published, only env changes are needed.

## 🧪 Testing

- Backend tests: `npm test` in backend directory
- Frontend tests: `npm test` in frontend directory
- E2E tests: `npm run test:e2e` in root directory

## 📚 Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [sBTC Guide](https://docs.stacks.co/guides-and-tutorials/sbtc/sbtc-builder-quickstart)
- [Hiro Platform](https://www.hiro.so/platform)
- [Clarity Language](https://docs.stacks.co/guides-and-tutorials/clarity-crash-course)

## 🔒 Security & Webhooks (MVP Skeleton)

- No private keys handled by Brizo; users sign in their wallet.
- Rate limiting and basic input validation on API.
- Webhook skeleton: `POST /webhook/payment-success` with signature header for merchant servers.
- Example payload: `{ paymentId, sbtcTxId, amount, merchantId }`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- GitHub Issues: [Report bugs](https://github.com/your-username/brizo/issues)
- Discord: [Join our community](https://discord.gg/brizo)
- Email: support@brizo.com

---

**Brizo** — Making Bitcoin payments as effortless as flowing water. 💧⚡

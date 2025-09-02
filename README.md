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
<script src="https://your-brizo-app.com/widget.js"></script>
<div id="brizo-donation-widget" data-merchant-id="merchant123"></div>
```

## 🧪 Testing

- Backend tests: `npm test` in backend directory
- Frontend tests: `npm test` in frontend directory
- E2E tests: `npm run test:e2e` in root directory

## 📚 Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [sBTC Guide](https://docs.stacks.co/guides-and-tutorials/sbtc/sbtc-builder-quickstart)
- [Hiro Platform](https://www.hiro.so/platform)
- [Clarity Language](https://docs.stacks.co/guides-and-tutorials/clarity-crash-course)

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

# Brizo — Bitcoin Payments, Effortlessly

A Bitcoin payment gateway built on Stacks using sBTC, enabling seamless payments and donations for creators and merchants.

It Features

- **sBTC Payment Processing**: Accept Bitcoin payments through Stacks
- **Merchant Dashboard**: Create payment links and track transactions
- **Embeddable Donation Widget**: Easy integration for creators and charities
- **Hiro Wallet Integration**: Seamless user experience with Stacks ecosystem
- **Real-time Payment Status**: Live updates on transaction progress

# Brizo accepts Bitcoin (via sBTC) without the headache

Brizo makes it easy to accept Bitcoin payments on Stacks. Think “Stripe, but for sBTC.”

Spin up a payment link, drop a tiny widget anywhere, and let people pay from wallets like Hiro/Xverse. No keys handled. No scary setup.

- Friendly flow: connect wallet → pay → done
- Copy‑paste widget: add one script and you’re live
- Built‑in API routes: create a payment and go
- Single Next.js app (frontend + API), testnet‑ready

Brizo sBTC contracts on Stacks testnet, providing Bitcoin backed payments with 1:1 BTC peg.

## What you get
- Payment links with a checkout page (`/checkout/[id]`)
- Embeddable widget (donations or one‑time payments)
- Wallet connect (Hiro/Xverse), Testnet
- Transaction feedback and a simple history
- Next.js App Router with API under `/api/*` (single domain)

## Quick start (local)
1) Prereqs
- Node 18+
- Leather or Xverse wallet (set to Testnet)

2) Run the app
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

3) Optional: Environment Configuration
```bash
# frontend/.env.local
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_APP_NAME=Brizo
NEXT_PUBLIC_APP_ICON=/favicon.ico
NEXT_PUBLIC_SBTC_RECIPIENT=ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB
```

## Deploy (fastest way)
Use Vercel and point the project to the `frontend` folder.

- New Project → Import your GitHub repo → Root Directory = frontend
- Framework: Next.js (auto)
- Install: npm install
- Build: npm run build
- Output: leave blank
- Deploy

That’s it. API routes are bundled (no separate backend).

## Use it
- Create a payment
  - Go to the app → create a payment → you’ll be redirected to `/checkout/[paymentId]`
- Embed the widget
```html
<script src="/widget.js"></script>
<div id="brizo-donation-widget" 
     data-merchant-id="merchant123"
     data-preset-amounts='[0.001,0.005,0.01,0.05]'
     data-show-custom-amount="true"></div>
```
The widget calls `/api/create-payment` then sends users to checkout.

- React drop‑in
```tsx
import PayWithsBTC from '@/components/PayWithsBTC'

<PayWithsBTC amount={0.01} description="T‑shirt" merchantId="merchant123" />
```

## Smart Contract Deployment

Brizo smart contracts are deployed on Stacks testnet:

### **Contract Addresses:**
- **Deployment Address**: `STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ`
- **brizo-payments**: `STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.brizo-payments`
- **brizo-trait**: `STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.brizo-trait`
- **brizo-sbtc-integration**: `STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.brizo-sbtc-integration`
- **deploy**: `STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.deploy`

### **Network**: Stacks Testnet
- **Explorer**: https://explorer.hiro.so/
- **Status**: Deployed and verified

## sBTC Integration
Brizo uses the official sBTC contracts on Stacks testnet:
- **Contract Address**: `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4`
- **Token Name**: `sbtc-token`
- **Standard**: SIP-010 fungible token
- **Network**: Stacks Testnet (ready for mainnet when available)

### Testnet: Fund & Deploy (one command)
```bash
# Use Clarinet’s deployer (auto-detected), auto-fund via faucet API, deploy:
npm run fund:deploy

# If you want to deploy with your own private key (temporary override):
CUSTOM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY npm run deploy:custom
```

The integration follows the [official sBTC documentation](https://docs.stacks.co/concepts/sbtc) and uses real Bitcoin-backed tokens.

## FAQ
- Do I need a separate backend? No. Next.js API routes handle it.
- Do I need envs to deploy? No. Optional ones above help the UX.
- Which wallets? Hiro/Xverse (testnet today).

## Roadmap (short)
- Webhooks for merchant servers (signed)
- Minimal merchant dashboard
- Mainnet deployment when sBTC mainnet is live

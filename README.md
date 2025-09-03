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

Note on sBTC: the official sBTC rollout is staged. Brizo ships with a clear Demo Mode using a SIP‑010 token so you can try the full flow today, then flip to real sBTC with envs later.

## What you get
- Payment links with a checkout page (`/checkout/[id]`)
- Embeddable widget (donations or one‑time payments)
- Wallet connect (Hiro/Xverse), Testnet
- Transaction feedback and a simple history
- Next.js App Router with API under `/api/*` (single domain)

## Quick start (local)
1) Prereqs
- Node 18+
- Hiro or Xverse wallet (set to Testnet)

2) Run the app
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

3) Optional: Demo Mode
```bash
# frontend/.env.local
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_APP_NAME=Brizo
NEXT_PUBLIC_APP_ICON=/favicon.ico
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

## Switch to real sBTC (when live)
Flip from Demo Mode to the official sBTC contract with envs:
```bash
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS=SPXXXX...
NEXT_PUBLIC_SBTC_CONTRACT_NAME=sbtc-token
NEXT_PUBLIC_SBTC_TRANSFER_FN=transfer
NEXT_PUBLIC_STACKS_NETWORK=testnet
```
No code changes needed.

## FAQ
- Do I need a separate backend? No. Next.js API routes handle it.
- Do I need envs to deploy? No. Optional ones above help the UX.
- Which wallets? Hiro/Xverse (testnet today).

## Roadmap (short)
- Webhooks for merchant servers (signed)
- Minimal merchant dashboard
- sBTC main testnet flip as soon as it’s available

## License
MIT. Build cool stuff. 💧
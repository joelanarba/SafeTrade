# SafeTrade Ghana 🔒

> **Secure escrow for Ghana's social commerce market** — When someone buys from an Instagram/WhatsApp vendor, instead of sending MoMo directly (and risking a scam), they pay into a SafeTrade escrow. Funds are held until the buyer confirms delivery, then released to the vendor.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore+Auth-orange?logo=firebase)
![BNB Chain](https://img.shields.io/badge/BNB-Smart%20Chain%20Testnet-yellow?logo=binance)
![Paystack](https://img.shields.io/badge/Paystack-GHS-blue)

---

## 📋 Core Features

- **Vendor Deal Creation** — Create deals, get shareable payment links for Instagram/WhatsApp DMs
- **Buyer Payment** — No account needed. Pay via Paystack (card or Mobile Money)
- **Blockchain Escrow** — Funds locked in an EscrowFactory smart contract on BNB Testnet
- **Delivery Confirmation** — Buyer confirms receipt → funds released to vendor's MoMo
- **Dispute Management** — 72-hour window for buyers to raise disputes, admin resolution dashboard
- **Trust Scores** — Public vendor profiles with trust scores, trade history, and "Verified" badges
- **Auto-Release** — Firebase scheduled function auto-releases escrow after 72 hours with no dispute

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Auth | Firebase Authentication (Email + Google) |
| Database | Cloud Firestore |
| Payments | Paystack (GHS — card + MoMo) |
| Blockchain | BNB Smart Chain Testnet, Solidity, ethers.js |
| Cloud Functions | Firebase Cloud Functions (auto-release, triggers) |
| Email | Resend API |

---

## 📁 Project Structure

```
SafeTrade/
├── contracts/
│   └── EscrowFactory.sol          # Solidity smart contract
├── scripts/
│   └── deploy.js                  # Hardhat deployment script
├── functions/
│   └── index.js                   # Firebase Cloud Functions
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── login/page.tsx         # Auth page
│   │   ├── dashboard/page.tsx     # Vendor dashboard (protected)
│   │   ├── pay/[dealId]/page.tsx  # Buyer payment (public)
│   │   ├── confirm/[token]/page.tsx # Delivery confirmation (public)
│   │   ├── vendor/[vendorId]/page.tsx # Public vendor profile
│   │   ├── admin/page.tsx         # Admin dispute dashboard
│   │   └── api/
│   │       ├── deals/route.ts
│   │       ├── paystack/webhook/route.ts
│   │       ├── confirm/route.ts
│   │       ├── dispute/route.ts
│   │       └── admin/resolve/route.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TrustScore.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   └── lib/
│       ├── firebase.ts            # Client Firebase config
│       ├── firebase-admin.ts      # Server Firebase Admin
│       ├── firestore.ts           # Firestore CRUD helpers
│       ├── escrow.ts              # ethers.js contract helpers
│       ├── paystack.ts            # Paystack API helpers
│       ├── email.ts               # Email templates
│       ├── types.ts               # TypeScript types
│       └── contract-abi.json      # Smart contract ABI
├── hardhat.config.js
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- Firebase project (Firestore + Auth enabled)
- Paystack account (test keys)
- MetaMask wallet (for BNB Testnet deployment)

### 1. Clone & Install

```bash
git clone <repo-url>
cd SafeTrade
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:
- Firebase config (from Firebase Console → Project Settings)
- Paystack keys (from Paystack Dashboard → Settings → API Keys)
- BNB Testnet wallet private key (export from MetaMask)
- Resend API key (from resend.com dashboard)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Smart Contract Deployment

### 1. Install Hardhat

```bash
npm install -D hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Get BNB Testnet Tokens

1. Go to [BNB Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Get test BNB

### 3. Deploy

```bash
# Set your private key
export ESCROW_WALLET_PRIVATE_KEY=your_private_key
export BNB_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Compile
npx hardhat compile

# Deploy to BNB Testnet
npx hardhat run scripts/deploy.js --network bnbTestnet
```

### 4. Update Environment

Copy the deployed contract address and add to `.env.local`:
```
ESCROW_CONTRACT_ADDRESS=0xYourDeployedAddress
```

---

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password + Google)
4. Enable **Cloud Firestore**
5. Get your config from Project Settings

### 2. Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /deals/{dealId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /vendors/{vendorId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == vendorId;
    }
  }
}
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## 💳 Paystack Configuration

1. Sign up at [paystack.com](https://paystack.com)
2. Get test keys from Dashboard → Settings → API Keys
3. Add webhook URL: `https://your-domain.com/api/paystack/webhook`
4. Enable GHS currency

---

## 🔄 User Flows

### Vendor → Create Deal → Share Link
```
Vendor logs in → Creates deal → Copies payment link → Sends to buyer via DM
```

### Buyer → Pay → Confirm
```
Opens link → Sees deal + trust score → Fills name + phone → Pays via Paystack
→ Funds locked in escrow → Gets confirmation email → Confirms when item received
→ Funds released to vendor's MoMo
```

### Dispute Flow
```
Buyer reports problem → Deal status: disputed → Admin reviews
→ Admin releases to vendor OR refunds buyer → Smart contract executes
```

---

## 📊 Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK JSON key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack publishable key |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `BNB_TESTNET_RPC_URL` | BNB Testnet RPC endpoint |
| `ESCROW_CONTRACT_ADDRESS` | Deployed smart contract address |
| `ESCROW_WALLET_PRIVATE_KEY` | Backend wallet private key |
| `NEXT_PUBLIC_APP_URL` | App URL (for email links) |
| `RESEND_API_KEY` | Resend email API key |

---

## 📄 License

MIT

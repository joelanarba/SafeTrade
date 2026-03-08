'use client';

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { ReactNode, useEffect, useState } from 'react';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0426532f2d6dfdbd59613b13f92ed950';

const bnbTestnet = {
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
  },
  blockExplorers: {
    default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
} as const;

const metadata = {
  name: 'SafeTrade Ghana',
  description: 'SafeTrade Ghana \u2014 The Trust Layer for Africa\u2019s Social Commerce Economy',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://safetrade-africa.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

let appKitInitialized = false;

if (typeof window !== 'undefined' && !appKitInitialized) {
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [bnbTestnet],
    projectId,
    metadata,
    features: {
      analytics: false,
    },
  });
  appKitInitialized = true;
}

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}

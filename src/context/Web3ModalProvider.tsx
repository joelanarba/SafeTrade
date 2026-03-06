'use client';

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { ReactNode, useEffect, useState } from 'react';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0426532f2d6dfdbd59613b13f92ed950';

const bnbTestnet = {
  chainId: 97,
  name: 'BNB Smart Chain Testnet',
  currency: 'tBNB',
  explorerUrl: 'https://testnet.bscscan.com',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
};

const metadata = {
  name: 'SafeTrade Ghana',
  description: 'SafeTrade Ghana — The Trust Layer for Africa’s Social Commerce Economy',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://safetrade-africa.vercel.app', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: false,
});

let web3ModalInitialized = false;

if (typeof window !== 'undefined' && !web3ModalInitialized) {
  createWeb3Modal({
    ethersConfig,
    chains: [bnbTestnet],
    projectId,
    enableAnalytics: false,
  });
  web3ModalInitialized = true;
}

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent SSR hydration mismatch
  }

  return <>{children}</>;
}

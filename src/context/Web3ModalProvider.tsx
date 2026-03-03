'use client';

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { ReactNode } from 'react';

// Get your projectId at https://cloud.walletconnect.com
// We'll use a public test project ID if env var isn't set, but you should set yours
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'e895c1c4afbf2bd64fb3ce4083a213e4';

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

createWeb3Modal({
  ethersConfig,
  chains: [bnbTestnet],
  projectId,
  enableAnalytics: false,
});

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

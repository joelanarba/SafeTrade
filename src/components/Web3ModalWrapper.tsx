'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import with ssr: false — Web3Modal's internal useSyncExternalStore
// crashes during SSR with "r is not iterable" because its store snapshots
// aren't available server-side.
const Web3ModalProviderInner = dynamic(
  () => import('@/context/Web3ModalProvider').then((mod) => mod.Web3ModalProvider),
  { ssr: false }
);

export default function Web3ModalWrapper({ children }: { children: ReactNode }) {
  return <Web3ModalProviderInner>{children}</Web3ModalProviderInner>;
}

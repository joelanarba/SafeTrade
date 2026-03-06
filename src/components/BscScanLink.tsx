'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { BnbLogo } from './BnbChainBadge';
import toast from 'react-hot-toast';

const BSCSCAN_BASE = 'https://testnet.bscscan.com';

interface BscScanLinkProps {
  txHash: string;
  label: string;
  className?: string;
  /** Style variant */
  variant?: 'bnb' | 'inline';
}

/**
 * A smart BscScan link that verifies the transaction exists on-chain
 * before redirecting the user — preventing "Transaction Hash not found" errors.
 */
export default function BscScanLink({ txHash, label, className, variant = 'bnb' }: BscScanLinkProps) {
  const [checking, setChecking] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (checking) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/web3/check-tx?hash=${encodeURIComponent(txHash)}`);
      const data = await res.json();

      if (data.exists) {
        window.open(`${BSCSCAN_BASE}/tx/${txHash}`, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(
          'This transaction could not be found on BNB Smart Chain. It may have been dropped by the testnet or is still pending.',
          { duration: 5000, icon: '⚠️' }
        );
      }
    } catch {
      // If the check fails, still open BscScan as a fallback
      window.open(`${BSCSCAN_BASE}/tx/${txHash}`, '_blank', 'noopener,noreferrer');
    } finally {
      setChecking(false);
    }
  }

  if (variant === 'inline') {
    return (
      <a
        href={`${BSCSCAN_BASE}/tx/${txHash}`}
        onClick={handleClick}
        className={className || 'group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#C99400] transition-colors'}
      >
        {checking ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C99400]" />
        ) : null}
        {!checking && (
          <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={checking}
      className={className || 'inline-flex items-center gap-2.5 bg-[#FEF9E7] hover:bg-[#FDF0C8] text-[#C99400] border border-[#F3BA2F]/30 px-6 py-3.5 rounded-xl font-bold transition-all text-sm disabled:opacity-70'}
    >
      {checking ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <BnbLogo className="w-5 h-5" />
      )}
      {checking ? 'Verifying on chain...' : label}
      {!checking && <ExternalLink className="w-4 h-4" />}
    </button>
  );
}

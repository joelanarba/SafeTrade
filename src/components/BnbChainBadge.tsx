'use client';

import { ExternalLink } from 'lucide-react';

// Official BNB Chain / Binance logo SVG
function BnbLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 126.6 126.6" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M38.7 53.4L63.3 28.8l24.6 24.6 14.3-14.3L63.3 0.2 24.4 39.1zM0.2 63.3l14.3-14.3 14.3 14.3-14.3 14.3zM38.7 73.2L63.3 97.8l24.6-24.6 14.3 14.3L63.3 126.4 24.4 87.5l-0.1-0.1zM97.8 63.3l14.3-14.3 14.3 14.3-14.3 14.3z"
        fill="#F3BA2F"
      />
      <path
        d="M77.8 63.3L63.3 48.8 52.6 59.5l-1.2 1.2-2.6 2.6 14.5 14.5 14.5-14.5z"
        fill="#F3BA2F"
      />
    </svg>
  );
}

// Inline "Powered by BNB Smart Chain" badge for use across pages
export function BnbPoweredBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-[#FEF9E7] border border-[#F3BA2F]/30 rounded-full px-4 py-2 shadow-sm ${className}`}>
      <BnbLogo className="w-4 h-4" />
      <span className="text-[#C99400] text-xs font-bold tracking-wide uppercase">
        Secured by BNB Smart Chain
      </span>
    </div>
  );
}

// Larger "Powered by" block for sections
export function BnbPoweredBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 bg-[#FEF9E7] rounded-xl flex items-center justify-center border border-[#F3BA2F]/20">
        <BnbLogo className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-900 leading-tight">BNB Smart Chain</p>
        <p className="text-xs font-bold text-slate-500">Blockchain-verified escrow</p>
      </div>
    </div>
  );
}

// BSCScan link button — shows a "View on Blockchain" link
export function ViewOnBlockchainButton({
  txHash,
  label = 'View on Blockchain',
  compact = false,
}: {
  txHash: string;
  label?: string;
  compact?: boolean;
}) {
  if (!txHash) return null;

  return (
    <a
      href={`https://testnet.bscscan.com/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 font-bold transition-all ${
        compact
          ? 'text-xs text-[#C99400] hover:text-[#A67C00] gap-1'
          : 'bg-[#FEF9E7] hover:bg-[#FDF0C8] text-[#C99400] border border-[#F3BA2F]/30 px-4 py-2.5 rounded-xl text-sm'
      }`}
    >
      <BnbLogo className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {label}
      <ExternalLink className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    </a>
  );
}

// Full blockchain trust section — for landing page
export function BlockchainTrustSection() {
  return (
    <section className="relative px-4 py-24 bg-gradient-to-b from-[#FEF9E7]/40 to-white overflow-hidden">
      {/* Decorative BNB background */}
      <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.04] pointer-events-none">
        <BnbLogo className="w-full h-full" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 bg-[#FEF9E7] border border-[#F3BA2F]/30 rounded-full px-5 py-2.5 mb-8 shadow-sm">
            <BnbLogo className="w-5 h-5" />
            <span className="text-[#C99400] text-sm font-bold tracking-wide">Blockchain Infrastructure</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Powered by <span className="text-[#F3BA2F]">BNB Smart Chain</span>
          </h2>
          <p className="text-slate-500 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            Every escrow transaction is secured by an immutable smart contract on the BNB Smart Chain.
            Release rules run in code, and disputes are handled through documented SafeTrade review.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft hover-lift text-center">
            <div className="w-16 h-16 bg-[#FEF9E7] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F3BA2F" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="#F3BA2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-3 tracking-tight">Smart Contract Escrow</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Funds are locked in a Solidity smart contract. Release is automated — triggered only when the buyer confirms delivery.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft hover-lift text-center">
            <div className="w-16 h-16 bg-[#FEF9E7] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#F3BA2F" strokeWidth="2" strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="#F3BA2F" strokeWidth="2"/>
                <path d="M9 12h6M9 16h4" stroke="#F3BA2F" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-3 tracking-tight">Tamper-Proof Records</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Every transaction is permanently recorded on the blockchain. Both parties receive a verifiable BscScan receipt as proof.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-soft hover-lift text-center">
            <div className="w-16 h-16 bg-[#FEF9E7] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#F3BA2F" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="#F3BA2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-3 tracking-tight">Trust Enforced by Code</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Smart contracts enforce release conditions automatically. If a dispute is raised, SafeTrade reviews evidence before final resolution.
            </p>
          </div>
        </div>

        {/* BSCScan Verifiable Badge */}
        <div className="mt-14 text-center">
          <a
            href="https://testnet.bscscan.com/address/0x350454F23D259Ea42cE4D6D1Eb2b41207b8fAD32"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-3 text-sm font-bold text-slate-600 hover:text-[#C99400] hover:border-[#F3BA2F]/30 hover:bg-[#FEF9E7] transition-all shadow-sm hover-lift"
          >
            <BnbLogo className="w-5 h-5" />
            Verify our smart contract on BscScan
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export { BnbLogo };
export default BnbPoweredBadge;

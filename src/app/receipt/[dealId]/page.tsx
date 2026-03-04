'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDeal, getVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import TrustScore from '@/components/TrustScore';
import { BnbLogo, BnbPoweredBadge } from '@/components/BnbChainBadge';
import {
  Shield,
  CheckCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Package,
  Clock,
  User,
  Store,
  Copy,
  Check,
  Share2,
  FileText,
  Lock,
  ArrowRight,
  Banknote,
  Hash,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const BSCSCAN_BASE = 'https://testnet.bscscan.com';
const CONTRACT_ADDRESS = '0x350454F23D259Ea42cE4D6D1Eb2b41207b8fAD32';

function truncateHash(hash: string): string {
  if (!hash) return '—';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReceiptPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReceipt();
  }, [dealId]);

  async function loadReceipt() {
    try {
      const d = await getDeal(dealId);
      setDeal(d);
      if (d) {
        const v = await getVendor(d.vendorId);
        setVendor(v);
      }
    } catch (err) {
      console.error('Error loading receipt:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/receipt/${dealId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Receipt link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    const url = `${window.location.origin}/receipt/${dealId}`;
    const text = `✅ SafeTrade Verified Receipt — ${deal?.itemName} (GHS ${deal?.amountGHS.toFixed(2)}). View the blockchain-verified proof: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading receipt...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-soft border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Receipt Not Found</h2>
          <p className="text-slate-500 font-medium mb-6">This transaction doesn&apos;t exist or the link is invalid.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
          >
            Go to SafeTrade Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // In-progress state (not yet completed/refunded)
  const isTerminal = deal.status === 'completed' || deal.status === 'refunded';

  if (!isTerminal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <Toaster position="top-center" />
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-soft border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Transaction In Progress</h2>
          <p className="text-slate-500 font-medium mb-4">
            This transaction is still active. The receipt will be available once the deal is completed.
          </p>
          <div className="inline-block mb-6">
            <StatusBadge status={deal.status} />
          </div>
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-500 font-bold text-sm">Item</span>
              <span className="text-slate-900 font-extrabold text-sm">{deal.itemName}</span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold text-sm">Amount</span>
              <span className="text-slate-900 font-extrabold text-sm">₵{deal.amountGHS.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full receipt for completed/refunded deals
  const isRefunded = deal.status === 'refunded';

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-8 sm:py-12">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto">
        {/* Receipt Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2.5 mb-6 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm font-bold tracking-wide">
              Verified Transaction Receipt
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            SafeTrade Receipt
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-lg">
            Blockchain-verified proof of transaction
          </p>
        </div>

        {/* Main Receipt Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(16,185,129,0.15)] border border-slate-100 overflow-hidden">
          {/* Status Bar */}
          <div
            className={`px-6 sm:px-8 py-5 flex items-center justify-between ${
              isRefunded
                ? 'bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200'
                : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isRefunded ? 'bg-slate-200' : 'bg-emerald-200'
                }`}
              >
                {isRefunded ? (
                  <Banknote className="w-5 h-5 text-slate-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                )}
              </div>
              <div>
                <p className={`font-extrabold text-lg ${isRefunded ? 'text-slate-700' : 'text-emerald-900'}`}>
                  {isRefunded ? 'Refunded' : 'Transaction Complete'}
                </p>
                <p className={`text-xs font-medium ${isRefunded ? 'text-slate-500' : 'text-emerald-600'}`}>
                  {formatDate(deal.updatedAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={deal.status} />
          </div>

          {/* Deal Details */}
          <div className="px-6 sm:px-8 py-8">
            {/* Item Info */}
            <div className="flex items-start gap-5 mb-8">
              {deal.itemImage ? (
                <img
                  src={deal.itemImage}
                  alt={deal.itemName}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{deal.itemName}</h2>
                {deal.description && (
                  <p className="text-sm font-medium text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {deal.description}
                  </p>
                )}
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 font-bold">Total Amount</span>
                <span className="text-2xl font-extrabold text-slate-900">₵{deal.amountGHS.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 my-3" />
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 font-medium text-sm">Platform Fee (2%)</span>
                <span className="text-slate-500 font-bold text-sm">₵{deal.platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium text-sm">
                  {isRefunded ? 'Refund Amount' : 'Vendor Payout'}
                </span>
                <span className="text-emerald-600 font-extrabold text-sm">₵{deal.vendorPayout.toFixed(2)}</span>
              </div>
            </div>

            {/* Parties */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {/* Vendor */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</span>
                </div>
                <p className="font-extrabold text-slate-900 text-lg">{deal.vendorName}</p>
                {vendor && (
                  <div className="mt-2">
                    <TrustScore score={vendor.trustScore} totalTrades={vendor.totalTrades} compact />
                  </div>
                )}
                {vendor?.verified && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">Verified Vendor</span>
                  </div>
                )}
              </div>

              {/* Buyer */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer</span>
                </div>
                <p className="font-extrabold text-slate-900 text-lg">
                  {deal.buyerName || 'Anonymous Buyer'}
                </p>
                {deal.buyerPhone && (
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {deal.buyerPhone.slice(0, 4)}****{deal.buyerPhone.slice(-3)}
                  </p>
                )}
              </div>
            </div>

            {/* Blockchain Proof Section */}
            <div className="bg-gradient-to-br from-[#FEF9E7] to-[#FDF0C8]/30 rounded-2xl p-6 border border-[#F3BA2F]/20 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#F3BA2F]/20">
                  <BnbLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Blockchain Verification</h3>
                  <p className="text-xs font-medium text-[#C99400]">BNB Smart Chain Testnet</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Escrow Lock Tx */}
                {deal.escrowTxHash && (
                  <div className="bg-white/80 rounded-xl p-4 border border-[#F3BA2F]/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-3.5 h-3.5 text-[#C99400]" />
                      <span className="text-xs font-bold text-[#C99400] uppercase tracking-wider">Escrow Lock</span>
                    </div>
                    <a
                      href={`${BSCSCAN_BASE}/tx/${deal.escrowTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#C99400] transition-colors"
                    >
                      <code className="text-xs bg-slate-100 group-hover:bg-[#FEF9E7] px-2 py-1 rounded-lg transition-colors font-mono">
                        {truncateHash(deal.escrowTxHash)}
                      </code>
                      <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                )}

                {/* Release/Refund Tx */}
                {deal.releaseTxHash && (
                  <div className="bg-white/80 rounded-xl p-4 border border-[#F3BA2F]/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        {isRefunded ? 'Refund Transaction' : 'Fund Release'}
                      </span>
                    </div>
                    <a
                      href={`${BSCSCAN_BASE}/tx/${deal.releaseTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#C99400] transition-colors"
                    >
                      <code className="text-xs bg-slate-100 group-hover:bg-[#FEF9E7] px-2 py-1 rounded-lg transition-colors font-mono">
                        {truncateHash(deal.releaseTxHash)}
                      </code>
                      <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                )}

                {/* Smart Contract */}
                <div className="bg-white/80 rounded-xl p-4 border border-[#F3BA2F]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Smart Contract</span>
                  </div>
                  <a
                    href={`${BSCSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#C99400] transition-colors"
                  >
                    <code className="text-xs bg-slate-100 group-hover:bg-[#FEF9E7] px-2 py-1 rounded-lg transition-colors font-mono">
                      {truncateHash(CONTRACT_ADDRESS)}
                    </code>
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>

                {/* No blockchain tx available */}
                {!deal.escrowTxHash && !deal.releaseTxHash && (
                  <div className="bg-white/80 rounded-xl p-4 border border-[#F3BA2F]/10 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                      On-chain transactions were not recorded for this deal.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Deal Created</span>
                  <span className="text-sm text-slate-900 font-bold">{formatDate(deal.createdAt)}</span>
                </div>
                <div className="border-t border-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">
                    {isRefunded ? 'Refunded' : 'Completed'}
                  </span>
                  <span className="text-sm text-slate-900 font-bold">{formatDate(deal.updatedAt)}</span>
                </div>
                {deal.paystackReference && (
                  <>
                    <div className="border-t border-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Payment Reference</span>
                      <code className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-lg">
                        {deal.paystackReference}
                      </code>
                    </div>
                  </>
                )}
                <div className="border-t border-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Deal ID</span>
                  <code className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-lg">
                    {truncateHash(deal.id)}
                  </code>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3.5 rounded-xl font-bold transition-all text-sm"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied!' : 'Copy Receipt Link'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-xl font-bold transition-all text-sm shadow-md"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* Footer Stamp */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-slate-500">
                  This record is tamper-proof and permanently stored on the blockchain.
                </p>
              </div>
              <BnbPoweredBadge />
            </div>
          </div>
        </div>

        {/* Back to SafeTrade */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-sm transition-colors"
          >
            <Shield className="w-4 h-4" />
            SafeTrade Ghana — Trust Layer for Social Commerce
          </Link>
        </div>
      </div>
    </div>
  );
}

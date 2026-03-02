'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDealByConfirmationToken, updateDeal, getVendor, updateVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Package,
  Camera,
  Send,
  Shield,
  PartyPopper,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfirmPage() {
  const params = useParams();
  const token = params.token as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  useEffect(() => {
    loadDeal();
  }, [token]);

  async function loadDeal() {
    try {
      const d = await getDealByConfirmationToken(token);
      setDeal(d);
      if (d) {
        const v = await getVendor(d.vendorId);
        setVendor(v);
        if (d.status === 'completed') setConfirmed(true);
        if (d.status === 'disputed') setDisputeSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!deal) return;
    setConfirming(true);
    try {
      // Call the confirm API
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, confirmationToken: token }),
      });

      if (res.ok) {
        setConfirmed(true);
        toast.success('Delivery confirmed! Funds released to vendor.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Confirmation failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error confirming delivery');
    } finally {
      setConfirming(false);
    }
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!deal || !disputeReason) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          confirmationToken: token,
          reason: disputeReason,
        }),
      });

      if (res.ok) {
        setDisputeSubmitted(true);
        toast.success('Dispute submitted. Our team will review it.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit dispute');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting dispute');
    } finally {
      setSubmittingDispute(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-gray-400">This confirmation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md glow-emerald">
          <PartyPopper className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Delivery Confirmed! 🎉</h2>
          <p className="text-gray-400 mb-4">
            Funds have been released to <strong className="text-white">{deal.vendorName}</strong>.
            Thank you for using SafeTrade!
          </p>
          {deal.releaseTxHash && (
            <a
              href={`https://testnet.bscscan.com/tx/${deal.releaseTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm"
            >
              <Shield className="w-4 h-4" />
              View blockchain receipt
            </a>
          )}
        </div>
      </div>
    );
  }

  if (disputeSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-3">Dispute Submitted</h2>
          <p className="text-gray-400">
            Our team will review your dispute and respond within 48 hours. Your funds remain
            locked in escrow until a resolution is reached.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Confirm Delivery</h1>
          <p className="text-gray-400 text-sm mt-2">
            Did you receive your item from {deal.vendorName}?
          </p>
        </div>

        {/* Deal Summary */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{deal.itemName}</h2>
              <p className="text-sm text-gray-400 mt-1">{deal.description}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-semibold">₵{deal.amountGHS.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Vendor</span>
              <span className="text-white">{deal.vendorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <StatusBadge status={deal.status} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!showDispute ? (
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Yes, I Received My Item
                </>
              )}
            </button>

            <button
              onClick={() => setShowDispute(true)}
              className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-4 rounded-xl font-medium text-sm transition-all border border-white/5 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              There&apos;s a Problem
            </button>
          </div>
        ) : (
          // Dispute Form
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Report a Problem</h3>
            <p className="text-sm text-gray-400 mb-4">
              Describe the issue and we&apos;ll review it within 48 hours
            </p>

            <form onSubmit={handleDispute} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">What happened?</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the issue — e.g. item not received, wrong item, damaged..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDispute(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute || !disputeReason}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingDispute ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

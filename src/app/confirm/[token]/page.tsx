'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDealByConfirmationToken, getBuyer } from '@/lib/firestore';
import { Deal, Buyer } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { BnbLogo } from '@/components/BnbChainBadge';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Package,
  Send,
  Shield,
  PartyPopper,
  ExternalLink,
  ImagePlus,
  X,
  Truck,
  Hash,
  Clock,
  Timer,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatDeliveryTime(hours: number): string {
  if (hours <= 48) return `${hours} hours`;
  if (hours <= 120) return '3-5 days';
  return '1-2 weeks';
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function ConfirmPage() {
  const params = useParams();
  const token = params.token as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const DISPUTE_CATEGORIES = [
    'Item never arrived',
    'Wrong item received',
    'Item damaged or defective',
    'Item not as described',
    'Seller not responding',
    'Other',
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('dispute') === 'true') {
        setShowDispute(true);
      }
    }
    loadDeal();
  }, [token]);

  async function loadDeal() {
    try {
      const d = await getDealByConfirmationToken(token);
      setDeal(d);
      if (d) {
        if (d.status === 'completed') setConfirmed(true);
        if (d.status === 'disputed') setDisputeSubmitted(true);
        // Load buyer profile
        if (d.buyerPhone) {
          try {
            const b = await getBuyer(d.buyerPhone);
            setBuyer(b);
          } catch (err) {
            console.error('Error loading buyer profile:', err);
          }
        }
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

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = photoFiles.length + newFiles.length;
      if (totalFiles > 3) {
        toast.error('Maximum 3 photos allowed');
        return;
      }
      for (const file of newFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          return;
        }
      }
      setPhotoFiles((prev) => [...prev, ...newFiles]);
      setPhotoPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
    }
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!deal || !disputeCategory) return;
    setSubmittingDispute(true);
    
    try {
      const uploadedUrls: string[] = [];
      if (photoFiles.length > 0) {
        toast.loading('Uploading evidence photos...', { id: 'upload' });
        for (const file of photoFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('dealId', deal.id);
          const uploadRes = await fetchWithTimeout('/api/upload-evidence', {
            method: 'POST',
            body: formData,
          }, 15000);
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || 'Upload failed');
          }
          const { url } = await uploadRes.json();
          uploadedUrls.push(url);
        }
      }

      const res = await fetchWithTimeout('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          confirmationToken: token,
          category: disputeCategory,
          details: disputeDetails,
          photoUrls: uploadedUrls,
        }),
      }, 15000);

      if (res.ok) {
        setDisputeSubmitted(true);
        toast.success('Dispute submitted. Our team will review it.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit dispute');
      }
    } catch (err) {
      console.error(err);
      toast.dismiss();
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Error submitting dispute');
      }
    } finally {
      toast.dismiss('upload');
      setSubmittingDispute(false);
    }
  }

  const estimatedHours = deal?.estimatedDeliveryHours || 72;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-soft border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Invalid Link</h2>
          <p className="text-slate-500 font-medium">This confirmation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)] border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
            <PartyPopper className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Delivery Confirmed!</h2>
          <p className="text-slate-600 mb-6 text-lg font-medium leading-relaxed">
            Funds have been successfully released to <strong className="text-slate-900 font-black">{deal.vendorName}</strong>.
            Thank you for choosing safe commerce.
          </p>

          {/* Buyer transaction history */}
          {buyer && buyer.totalPurchases > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-900">
                You have completed {buyer.totalPurchases} purchase{buyer.totalPurchases !== 1 ? 's' : ''} on SafeTrade
              </p>
            </div>
          )}

          {deal.releaseTxHash && (
            <a
              href={`https://testnet.bscscan.com/tx/${deal.releaseTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#FEF9E7] hover:bg-[#FDF0C8] text-[#C99400] border border-[#F3BA2F]/30 px-6 py-3.5 rounded-xl font-bold transition-all text-sm"
            >
              <BnbLogo className="w-5 h-5" />
              View Release Transaction on BscScan
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {deal.escrowTxHash && !deal.releaseTxHash && (
            <a
              href={`https://testnet.bscscan.com/tx/${deal.escrowTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#FEF9E7] hover:bg-[#FDF0C8] text-[#C99400] border border-[#F3BA2F]/30 px-6 py-3.5 rounded-xl font-bold transition-all text-sm mt-3"
            >
              <BnbLogo className="w-5 h-5" />
              View Escrow Transaction on BscScan
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <a
            href={`/receipt/${deal.id}`}
            className="inline-flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-xl font-bold transition-all text-sm mt-4"
          >
            <Shield className="w-5 h-5 text-emerald-600" />
            View Transaction Receipt
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (disputeSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(245,158,11,0.2)] border border-amber-100">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Dispute Logged</h2>
          <p className="text-slate-600 text-lg font-medium leading-relaxed bg-amber-50 p-6 rounded-2xl border border-amber-100">
            Our team will review your case and respond within 48 hours. Your funds remain securely
            locked in the escrow contract. Auto-release has been frozen.
          </p>

          {/* SLA Notice */}
          <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">SafeTrade Dispute SLA</h3>
            </div>
            <div className="space-y-3">
              {[
                { step: 'Dispute Received', time: 'Immediately', done: true },
                { step: 'Admin Review', time: 'Within 24 hours', done: false },
                { step: 'Resolution Decision', time: 'Within 48 hours', done: false },
                { step: 'Funds Released or Refunded', time: 'Within 72 hours', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-emerald-100' : 'bg-slate-200'
                  }`}>
                    {item.done ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-900">{item.step}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-5 py-2 mb-6 shadow-sm">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 text-sm font-bold tracking-wide">Pending Confirmation</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Got Your Item?</h1>
          <p className="text-slate-500 text-lg font-medium mt-4">
            Did you receive your order exactly as described from <strong className="text-slate-900">{deal.vendorName}</strong>?
          </p>
        </div>

        {/* Buyer Transaction History */}
        {buyer && buyer.totalPurchases > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-bold text-emerald-900">
              You have completed {buyer.totalPurchases} purchase{buyer.totalPurchases !== 1 ? 's' : ''} on SafeTrade
            </p>
          </div>
        )}

        {/* Smart Release Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <Timer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              {deal.shippedAt ? (
                <>
                  <p className="text-sm font-bold text-blue-900">
                    Expected delivery was within {formatDeliveryTime(estimatedHours)} of shipping
                  </p>
                  <p className="text-xs font-medium text-blue-700 mt-1">
                    You have until{' '}
                    <strong>
                      {new Date(deal.autoReleaseAt || '').toLocaleString('en-GH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>{' '}
                    to raise a dispute before funds auto-release to the vendor.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-blue-900">
                    Vendor has not marked this order as shipped yet
                  </p>
                  <p className="text-xs font-medium text-blue-700 mt-1">
                    Funds are safely locked. Auto-release will not fire until the vendor marks the order as shipped. Expected delivery: within {formatDeliveryTime(estimatedHours)} after shipping.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Deal Summary */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 mb-6 shadow-soft border border-slate-100">
          <div className="flex items-start gap-5 mb-8">
            {deal.itemImage ? (
              <img src={deal.itemImage} alt={deal.itemName} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{deal.itemName}</h2>
              <p className="text-base font-medium text-slate-500 mt-2 leading-relaxed">{deal.description}</p>
            </div>
          </div>

            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-500 font-bold">Amount Locked</span>
              <span className="text-slate-900 font-extrabold">₵{deal.amountGHS.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-500 font-bold">Vendor</span>
              <span className="text-slate-900 font-extrabold">{deal.vendorName}</span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold text-lg">Status</span>
              <div className="scale-110 origin-right">
                <StatusBadge status={deal.status} />
              </div>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold text-lg">Escrow</span>
              <span className="inline-flex items-center gap-1.5 text-[#C99400] font-bold text-sm bg-[#FEF9E7] px-3 py-1 rounded-full border border-[#F3BA2F]/20">
                <BnbLogo className="w-3.5 h-3.5" />
                BNB Smart Chain
              </span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold text-lg flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Smart Release
              </span>
              <span className="text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full text-sm">
                {deal.shippedAt ? (
                  `${formatDeliveryTime(estimatedHours)} + 48hr buffer`
                ) : (
                  'Waiting for shipment'
                )}
              </span>
            </div>
            {deal.deliveryMethod && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-lg flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery
                  </span>
                  <span className="text-slate-900 font-extrabold capitalize">
                    {deal.deliveryMethod === 'personal' ? 'Personal Delivery' : deal.deliveryMethod === 'courier' ? 'Courier / Dispatch' : 'Pickup'}
                  </span>
                </div>
              </>
            )}
            {deal.deliveryMethod === 'courier' && deal.trackingNumber && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Tracking
                  </span>
                  <span className="text-blue-700 font-extrabold bg-blue-50 px-3 py-1 rounded-full text-sm">
                    {deal.trackingNumber}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!showDispute ? (
          <div className="space-y-4">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 tracking-tight"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Releasing Funds...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Yes, I Received My Order
                </>
              )}
            </button>

            <button
              onClick={() => setShowDispute(true)}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 py-5 rounded-2xl font-bold text-lg transition-all border-2 border-slate-200 shadow-sm hover-lift flex items-center justify-center gap-3 tracking-tight"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              No, There&apos;s a Problem
            </button>
          </div>
        ) : (
          // Dispute Form
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-soft border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Report an Issue</h3>
            <p className="text-base font-medium text-slate-500 mb-8">
              Describe why you haven&apos;t received what was promised. Your funds will remain safe and auto-release will be frozen.
            </p>

            <form onSubmit={handleDispute} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">What&apos;s the issue?</label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all appearance-none"
                >
                  <option value="">Select a reason...</option>
                  {DISPUTE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Additional Details</label>
                <textarea
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  rows={4}
                  placeholder="Provide more details about what happened..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Photo Evidence (Optional — max 3)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoPreviews.map((preview, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200">
                      <img src={preview} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photoPreviews.length < 3 && (
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-400 font-bold">Add Photo</p>
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                    </label>
                  )}
                </div>
              </div>

              {/* SLA Notice */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">SafeTrade Dispute SLA</p>
                  <p className="text-xs text-blue-700 font-medium mt-1">
                    Disputes are reviewed within 24 hours. Resolution (refund or release) within 48–72 hours. Your funds stay locked and auto-release is frozen until resolved.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setShowDispute(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 py-4 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute || !disputeCategory}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-extrabold transition-all shadow-md hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingDispute ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
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

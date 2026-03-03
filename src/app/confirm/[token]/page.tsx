'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDealByConfirmationToken, getVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  function clearPhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!deal || !disputeReason) return;
    setSubmittingDispute(true);
    
    try {
      let photoUrl = '';
      if (photoFile) {
        toast.loading('Uploading evidence photo...', { id: 'upload' });
        const storageRef = ref(storage, `disputes/${deal.id}_${Date.now()}_${photoFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, photoFile);
        photoUrl = await getDownloadURL(uploadTask.ref);
        toast.dismiss('upload');
      }

      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          confirmationToken: token,
          reason: disputeReason,
          photoUrl,
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
      toast.dismiss();
      toast.error('Error submitting dispute');
    } finally {
      setSubmittingDispute(false);
    }
  }

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
          <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">
            Funds have been successfully released to <strong className="text-slate-900 font-black">{deal.vendorName}</strong>.
            Thank you for choosing safe commerce.
          </p>
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
            locked in the escrow contract.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-16 sm:py-24">
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

        {/* Deal Summary */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-10 mb-8 shadow-soft border border-slate-100">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
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
              No, There's a Problem
            </button>
          </div>
        ) : (
          // Dispute Form
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-soft border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Report an Issue</h3>
            <p className="text-base font-medium text-slate-500 mb-8">
              Describe why you haven't received what was promised. Your funds will remain safe.
            </p>

            <form onSubmit={handleDispute} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">What happened?</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="e.g. The item never arrived, wrong color, damaged package..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Photo Evidence (Optional)</label>
                {!photoPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500 font-bold">Click to upload photo</p>
                      <p className="text-xs text-slate-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                  </label>
                ) : (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-slate-200">
                    <img src={photoPreview} alt="Evidence preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                  disabled={submittingDispute || !disputeReason}
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

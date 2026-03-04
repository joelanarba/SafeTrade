'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getBuyer, getBuyerDeals } from '@/lib/firestore';
import { Deal, Buyer } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import {
  Shield,
  Loader2,
  Phone,
  KeyRound,
  MessageSquare,
  CheckCircle,
  ShoppingBag,
  AlertTriangle,
  Star,
  Package,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BuyerPage() {
  const params = useParams();
  const phone = decodeURIComponent(params.phone as string);

  const [otpStep, setOtpStep] = useState<'verify' | 'verified'>('verify');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  async function handleSendOtp() {
    setSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: 'Buyer' }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCooldown(60);
        toast.success('Verification code sent!');
      } else {
        toast.error(data.error || 'Failed to send code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error sending verification code');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpCode }),
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setOtpStep('verified');
        toast.success('Verified! Loading your history...');
        loadBuyerData(data.phone);
      } else {
        toast.error(data.error || 'Invalid code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error verifying code');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function loadBuyerData(normalizedPhone: string) {
    setLoading(true);
    try {
      const [b, d] = await Promise.all([
        getBuyer(normalizedPhone),
        getBuyerDeals(normalizedPhone),
      ]);
      setBuyer(b);
      setDeals(d);
    } catch (err) {
      console.error(err);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  }

  const completedDeals = deals.filter(d => d.status === 'completed');
  const disputedDeals = deals.filter(d => d.status === 'disputed');
  const totalSpent = completedDeals.reduce((acc, d) => acc + d.amountGHS, 0);

  // Trust rating: based on completed vs disputed ratio
  const trustRating = deals.length > 0
    ? Math.round(((completedDeals.length) / Math.max(deals.length, 1)) * 5 * 10) / 10
    : 0;

  if (otpStep === 'verify') {
    return (
      <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-16 sm:py-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Buyer Transaction History</h1>
            <p className="text-slate-500 font-medium">Verify your phone number to view your SafeTrade history</p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-500" />
              <span className="font-bold text-slate-900">{phone}</span>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-md hover-lift disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                ) : (
                  <><MessageSquare className="w-5 h-5" /> Send Verification Code</>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900">Code sent to {phone}</span>
                </div>

                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-900 font-medium text-center text-2xl tracking-[0.3em] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Verify & View History</>
                  )}
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={otpCooldown > 0}
                  className="w-full text-sm font-bold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition-colors py-2"
                >
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend code'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Verified view
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Your SafeTrade History</h1>
          <p className="text-slate-500 font-medium">{phone}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{buyer?.totalPurchases || 0}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Purchases</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{buyer?.disputes || 0}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Disputes</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-extrabold text-slate-900">{trustRating}</p>
              <Star className="w-5 h-5 text-amber-400" fill="currentColor" stroke="none" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Trust Rating</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
            <p className="text-3xl font-extrabold text-slate-900">
              <span className="text-xl text-slate-400">₵</span>{totalSpent.toLocaleString('en-GH', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Spent</p>
          </div>
        </div>

        {/* Member Since */}
        {buyer?.firstSeen && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-bold text-emerald-900">
              SafeTrade buyer since {new Date(buyer.firstSeen).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        {/* Order History */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Order History
            </h2>
          </div>

          {deals.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-900 mb-1">No transactions yet</p>
              <p className="text-sm text-slate-500">Your SafeTrade purchases will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deals.map((deal) => (
                <div key={deal.id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 truncate">{deal.itemName}</h3>
                        <StatusBadge status={deal.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                        <span className="font-bold text-slate-900">₵{deal.amountGHS.toFixed(2)}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>{deal.vendorName}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>{new Date(deal.createdAt).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disputed Orders */}
        {disputedDeals.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-amber-100 bg-amber-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Dispute History ({disputedDeals.length})
              </h2>
            </div>
            <div className="divide-y divide-amber-100">
              {disputedDeals.map((deal) => (
                <div key={deal.id} className="px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{deal.itemName}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {deal.disputeCategory || deal.disputeReason || 'Dispute filed'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">₵{deal.amountGHS.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

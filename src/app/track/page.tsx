'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Phone, KeyRound, MessageSquare, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrackOrderPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'details' | 'otp'>('details');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  async function handleSendOtp() {
    if (!phone.trim() || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: 'Buyer' }), // Name is recorded during payment, this is just for the API structure requirement
      });

      const data = await res.json();
      if (res.ok) {
        setOtpStep('otp');
        setOtpCooldown(60);
        toast.success(data.message || 'Verification code sent!');
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
        toast.success('Verified! Redirecting to your dashboard...');
        // Save auth to local storage so the dashboard doesn't re-ask
        localStorage.setItem('buyer_auth', data.phone);
        
        // Encode phone to handle the + sign correctly in the URL
        router.push(`/buyer/${encodeURIComponent(data.phone)}`);
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

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Track Your Order
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Log in securely with your phone number to check your order status, confirm receipt, or file a dispute.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-[2rem] sm:px-10 border border-slate-100">
          {otpStep === 'details' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                <div className="mt-2 relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    placeholder="e.g. +233 24 123 4567"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={sendingOtp || phone.length < 9}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {sendingOtp ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Login Code'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <CheckCircle className="w-4 h-4 text-emerald-600" />
                   <span className="text-sm font-bold text-emerald-900">{phone}</span>
                 </div>
                 <button onClick={() => setOtpStep('details')} className="text-xs font-bold text-emerald-600 hover:underline">Change</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">6-Digit Code</label>
                <div className="mt-2 relative">
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
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Verify & Login</>
                )}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={otpCooldown > 0}
                className="w-full text-sm font-bold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition-colors py-2"
              >
                {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend code'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

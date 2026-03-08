'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { getDeal } from '@/lib/firestore';
import { getVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
import TrustScore from '@/components/TrustScore';
import VendorBadge from '@/components/VendorBadge';
import { BnbPoweredBadge, BnbPoweredBlock, BnbLogo } from '@/components/BnbChainBadge';
import BscScanLink from '@/components/BscScanLink';
import {
  Shield,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Package,
  Phone,
  User,
  Mail,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import contractABI from '@/lib/contract-abi.json';

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

function formatDeliveryTime(hours: number): string {
  if (hours <= 48) return `${hours} hours`;
  if (hours <= 120) return '3-5 days';
  return '1-2 weeks';
}

function PayPageContent() {
  const params = useParams();
  const dealId = params.dealId as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // OTP verification state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'details' | 'otp' | 'verified'>('details');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Web3 state
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'web3'>('momo');
  const [showWhySafeTrade, setShowWhySafeTrade] = useState(false);
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  useEffect(() => {
    loadDeal();
  }, [dealId]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  async function loadDeal() {
    try {
      const d = await getDeal(dealId);
      setDeal(d);
      if (d && d.vendorId) {
        const v = await getVendor(d.vendorId);
        setVendor(v);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      toast.error('Please enter your name and phone number');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: buyerPhone, name: buyerName }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpStep('otp');
        setOtpCooldown(60);
        toast.success(data.message || 'Verification code sent to your phone!', { duration: 8000 });
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error sending verification code');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: buyerPhone, otp: otpCode }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        setOtpStep('verified');
        toast.success('Phone number verified!');
      } else {
        toast.error(data.error || 'Invalid verification code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error verifying code');
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handlePay() {
    if (!deal || !buyerName || !buyerPhone || !buyerEmail) {
      toast.error('Please fill in all fields');
      return;
    }

    if (otpStep !== 'verified') {
      toast.error('Please verify your phone number first');
      return;
    }

    setPaying(true);

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!paystackKey) {
      toast.error('Payment configuration missing. Please contact support.');
      setPaying(false);
      return;
    }

    if (!window.PaystackPop) {
      toast.error('Payment system is still initializing. Please try again in a few seconds.');
      setPaying(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: buyerEmail,
      amount: Math.round(deal.amountGHS * 100),
      currency: 'GHS',
      reference: Date.now().toString() + Math.random().toString(36).substring(7),
      metadata: {
        dealId: deal.id,
        buyerName,
        buyerPhone,
        buyerEmail,
      },
      callback: function (response: { reference: string }) {
        verifyPayment(response.reference);
      },
      onClose: function () {
        setPaying(false);
        toast.error('Payment cancelled');
      },
    });

    handler.openIframe();
  }

  async function verifyPayment(reference: string) {
    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          dealId: deal?.id,
          buyerName,
          buyerPhone,
          buyerEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaid(true);
        if (data.confirmationToken) {
          setConfirmationToken(data.confirmationToken);
        }
        toast.success('Payment successful! Your money is in escrow.');
      } else {
        toast.error('Payment verification failed. Contact support.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error processing payment');
    } finally {
      setPaying(false);
    }
  }

  async function handleWeb3Pay() {
    if (!deal || !buyerName || !buyerPhone || !buyerEmail) {
      toast.error('Please fill in all fields');
      return;
    }

    if (otpStep !== 'verified') {
      toast.error('Please verify your phone number first');
      return;
    }

    if (!isConnected || !walletProvider) {
      open();
      return;
    }

    setPaying(true);

    try {
      // @reown/appkit returns walletProvider typed as {}, so we cast it to standard Eip1193 provider expected by ethers
      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS!;
      const fallbackVendor = process.env.NEXT_PUBLIC_ESCROW_VENDOR_FALLBACK_ADDRESS!;

      const escrow = new Contract(escrowAddress, contractABI, signer);

      // Convert GHS amount to a symbolic BNB wei amount (GHS / 10000 as BNB)
      const symbolicBnb = (deal.amountGHS / 10000).toFixed(18);
      const amountWei = parseUnits(symbolicBnb, 18);

      toast.loading('Confirming payment on chain...', { id: 'web3-pay' });
      const vendorAddress = vendor?.walletAddress || fallbackVendor;

      // The deployed contract requires msg.value == amount
      const tx = await escrow.createEscrow(deal.id, vendorAddress, amountWei, { value: amountWei });
      const receipt = await tx.wait();
      toast.dismiss('web3-pay');

      const res = await fetch('/api/web3/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.hash,
          dealId: deal.id,
          buyerName,
          buyerPhone,
          buyerEmail,
        }),
      });

      if (res.ok) {
        setPaid(true);
        toast.success('Payment successful! Your USDT is in escrow.');
      } else {
        toast.error('Payment verification failed.');
      }
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error(err.shortMessage || err.message || 'Error processing Web3 payment');
    } finally {
      setPaying(false);
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
        <div className="text-center bg-white p-10 rounded-3xl shadow-soft border border-slate-100 max-w-md w-full">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Deal Not Found</h2>
          <p className="text-slate-500 font-medium">This payment link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (deal.status !== 'pending_payment' && !paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-soft border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Secured</h2>
          <p className="text-slate-500 font-medium">This deal has already been paid for. The funds are safely in escrow.</p>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)] border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Payment Secured!</h2>
          <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">
            Your <strong className="text-slate-900 font-black">GHS {deal.amountGHS.toFixed(2)}</strong> is now locked
            in a smart contract. The vendor has been notified to ship your item.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 mb-6 border border-slate-100">
            <div className="flex justify-between items-center text-base">
              <span className="text-slate-500 font-bold">Item</span>
              <span className="text-slate-900 font-extrabold">{deal.itemName}</span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-slate-500 font-bold">Expected Delivery</span>
              <span className="text-emerald-700 font-black bg-emerald-100 px-3 py-1 rounded-full text-sm">
                within {formatDeliveryTime(estimatedHours)}
              </span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-slate-500 font-bold">Smart Release</span>
              <span className="text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full text-sm">
                +48hr buffer
              </span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-slate-500 font-bold">Escrow</span>
              <span className="inline-flex items-center gap-1.5 text-[#C99400] font-bold text-sm bg-[#FEF9E7] px-3 py-1 rounded-full border border-[#F3BA2F]/20">
                <BnbLogo className="w-3.5 h-3.5" />
                BNB Smart Chain
              </span>
            </div>
          </div>
          
          <p className="text-sm font-semibold text-slate-500 bg-slate-100 p-4 rounded-xl mb-4">
            When you receive your item, use the button below to confirm delivery or raise a dispute.
          </p>

          {confirmationToken && (
            <a
              href={`/confirm/${confirmationToken}`}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-all shadow-md mb-4"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Delivery / Report Issue
            </a>
          )}

          {deal.escrowTxHash && (
            <BscScanLink txHash={deal.escrowTxHash} label="View Escrow Transaction on BscScan" className="inline-flex items-center gap-2.5 bg-[#FEF9E7] hover:bg-[#FDF0C8] text-[#C99400] border border-[#F3BA2F]/30 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full justify-center disabled:opacity-70" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-8 sm:py-12">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <BnbPoweredBadge className="mb-4 sm:mb-6 mx-auto" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Secure Payment</h1>
        </div>

        {/* Deal Details Card */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 mb-6 shadow-soft border border-slate-100">
          <div className="flex items-start gap-5 mb-6">
            {deal.itemImage ? (
              <img src={deal.itemImage} alt={deal.itemName} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{deal.itemName}</h2>
              <p className="text-base font-medium text-slate-500 mt-2 leading-relaxed">{deal.description}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-500">Amount Due</span>
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                <span className="text-2xl text-slate-400 mr-1">₵</span>
                {deal.amountGHS.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Estimated Delivery Banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Expected delivery: within {formatDeliveryTime(estimatedHours)}</p>
              <p className="text-xs font-medium text-blue-700 mt-0.5">
                If you don&apos;t confirm delivery or raise a dispute within 48 hours of the estimated delivery time, funds will be automatically released to the vendor.
              </p>
            </div>
          </div>

          {/* Vendor Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sold securely by</p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-lg font-extrabold text-slate-900">{deal.vendorName}</p>
                {vendor && (
                  <VendorBadge
                    successfulTrades={vendor.successfulTrades}
                    trustScore={vendor.trustScore}
                    verified={vendor.verified}
                  />
                )}
              </div>
            </div>
            {vendor && (
              <div className="scale-105 origin-left sm:origin-right">
                <TrustScore
                  score={vendor.trustScore}
                  totalTrades={vendor.totalTrades}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        {/* Buyer Verification — Two-Step OTP Flow */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 mb-6 shadow-soft border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Verify Your Identity</h3>
            </div>
            {otpStep === 'verified' && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          {otpStep === 'details' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                    placeholder="e.g. Kwame Asante"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    required
                    placeholder="e.g. 0241234567"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={sendingOtp || !buyerName.trim() || !buyerPhone.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-md hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Send Verification Code via SMS
                  </>
                )}
              </button>
            </div>
          )}

          {otpStep === 'otp' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Code sent to {buyerPhone}</p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">Enter the 6-digit code we sent to your phone</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all text-center text-2xl tracking-[0.3em]"
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-md hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify Code
                  </>
                )}
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setOtpStep('details'); setOtpCode(''); }}
                  className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Change number
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={otpCooldown > 0 || sendingOtp}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {otpStep === 'verified' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">{buyerName}</p>
                  <p className="text-sm text-emerald-700 font-medium">{buyerPhone} — Verified</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2">We'll send your order confirmation and delivery link here</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Toggle — only show when verified */}
        {otpStep === 'verified' && (
          <>
            <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-6">
              <button
                onClick={() => setPaymentMethod('momo')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  paymentMethod === 'momo'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pay with MoMo/Card (GHS)
              </button>
              <button
                onClick={() => setPaymentMethod('web3')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  paymentMethod === 'web3'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pay with USDT (Web3)
              </button>
            </div>

            {/* Selected Pay Button */}
            {paymentMethod === 'momo' ? (
              <button
                onClick={handlePay}
                disabled={paying || !buyerEmail}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 tracking-tight"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing Securely...
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6" />
                    Pay ₵{deal.amountGHS.toFixed(2)} Securely
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                {!isConnected ? (
                  <button
                    onClick={() => open()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-md hover-lift flex items-center justify-center gap-3 tracking-tight"
                  >
                    Connect Wallet to Pay USDT
                  </button>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-500 bg-slate-100 p-4 rounded-xl">
                      <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      <button onClick={() => open()} className="text-emerald-600 hover:underline">Change</button>
                    </div>
                    <button
                      onClick={handleWeb3Pay}
                      disabled={paying || !buyerEmail}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 tracking-tight"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Executing Contract...
                        </>
                      ) : (
                        <>
                          <Lock className="w-6 h-6" />
                          Approve & Pay {(deal.amountGHS * 1).toFixed(2)} USDT
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Why SafeTrade for MoMo? */}
        {paymentMethod === 'momo' && otpStep === 'verified' && (
          <div className="mt-6">
            <button
              onClick={() => setShowWhySafeTrade(!showWhySafeTrade)}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 py-3 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Why use SafeTrade instead of sending MoMo directly?
              <ChevronDown className={`w-4 h-4 transition-transform ${showWhySafeTrade ? 'rotate-180' : ''}`} />
            </button>
            {showWhySafeTrade && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Your money is held securely</p>
                    <p className="text-xs text-slate-600 mt-1">When you send MoMo directly, it&apos;s gone instantly. With SafeTrade, your money stays locked until you confirm you received your item.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">No more fake payment screenshots</p>
                    <p className="text-xs text-slate-600 mt-1">Vendors see verified payment in their dashboard. Buyers get proof their money is in escrow. No he-said-she-said.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Smart Release Protection</p>
                    <p className="text-xs text-slate-600 mt-1">Funds release automatically 48 hours after your estimated delivery window, unless a dispute is raised. If the vendor doesn&apos;t deliver, our team steps in.</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-700">
                    <span className="inline-flex items-center gap-1"><span className="w-4 h-4 bg-[#FFCC00] rounded-full inline-block" /> MTN MoMo</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><span className="w-4 h-4 bg-red-500 rounded-full inline-block" /> Telecel Cash</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><span className="w-4 h-4 bg-red-600 rounded-full inline-block" /> AirtelTigo Money</span>
                    <span>•</span>
                    <span>Visa/Mastercard</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trust Section with BNB branding */}
        <div className="mt-8 bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <Shield className="w-5 h-5 text-emerald-600" />
              How SafeTrade Protects You
            </h3>
            <BnbPoweredBlock />
          </div>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FEF9E7] flex items-center justify-center flex-shrink-0 mt-0.5">
                <BnbLogo className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Your money is held in a <strong className="text-slate-900">BNB Smart Chain smart contract</strong> — the vendor can&apos;t touch it until you confirm delivery.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                <strong className="text-slate-900">Smart Release Protection</strong> — funds auto-release 48 hours after the estimated delivery window, unless you raise a dispute.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Full automatic refund if the vendor fails to deliver and the dispute is resolved in your favor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PayPage = dynamic(() => Promise.resolve(PayPageContent), { 
  ssr: false 
});

export default PayPage;

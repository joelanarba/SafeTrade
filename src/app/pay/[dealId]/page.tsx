'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { getDeal } from '@/lib/firestore';
import { getVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
import TrustScore from '@/components/TrustScore';
import { BnbPoweredBadge, BnbPoweredBlock, BnbLogo } from '@/components/BnbChainBadge';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
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

export default function PayPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // Buyer form
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // Web3 state
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'web3'>('momo');
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  useEffect(() => {
    loadDeal();
  }, [dealId]);

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

  function handlePay() {
    if (!deal || !buyerName || !buyerPhone || !buyerEmail) {
      toast.error('Please fill in all fields');
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

    if (!isConnected || !walletProvider) {
      open();
      return;
    }

    setPaying(true);

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS!;
      const usdtAddress = process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS!;
      const fallbackVendor = process.env.NEXT_PUBLIC_ESCROW_VENDOR_FALLBACK_ADDRESS!;

      const usdt = new Contract(usdtAddress, ERC20_ABI, signer);
      const escrow = new Contract(escrowAddress, contractABI, signer);

      // Testing: 1-to-1 conversion for USDT (mocking exchange rate)
      const amountWei = parseUnits(deal.amountGHS.toString(), 18);

      // Approve
      const allowance = await usdt.allowance(address, escrowAddress);
      if (allowance < amountWei) {
        toast.loading('Approving USDT...', { id: 'web3-appr' });
        const txApprove = await usdt.approve(escrowAddress, amountWei);
        await txApprove.wait();
        toast.dismiss('web3-appr');
      }

      // Lock Escrow
      toast.loading('Confirming payment on chain...', { id: 'web3-pay' });
      const vendorAddress = vendor?.walletAddress || fallbackVendor;

      const tx = await escrow.createEscrow(deal.id, vendorAddress, amountWei);
      const receipt = await tx.wait();
      toast.dismiss('web3-pay');

      // Verify on backend
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
              <span className="text-slate-500 font-bold">Delivery Window</span>
              <span className="text-emerald-700 font-black bg-emerald-100 px-3 py-1 rounded-full text-sm">72 hours</span>
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
            <a
              href={`https://testnet.bscscan.com/tx/${deal.escrowTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FEF9E7] hover:bg-[#FDF0C8] text-[#C99400] border border-[#F3BA2F]/30 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full justify-center"
            >
              <BnbLogo className="w-4 h-4" />
              View Escrow Transaction on BscScan
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-16 sm:py-24">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <BnbPoweredBadge className="mb-6" />
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Secure Payment</h1>
        </div>

        {/* Deal Details Card */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-10 mb-8 shadow-soft border border-slate-100">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-emerald-600" />
            </div>
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

          {/* Vendor Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sold securely by</p>
              <p className="text-lg font-extrabold text-slate-900">{deal.vendorName}</p>
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

        {/* Buyer Form */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-10 mb-8 shadow-soft border border-slate-100">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight">Your Details</h3>

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
            </div>
          </div>
        </div>

        {/* Payment Method Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-8">
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
            disabled={paying || !buyerName || !buyerPhone || !buyerEmail}
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
                  disabled={paying || !buyerName || !buyerPhone || !buyerEmail}
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

        {/* Trust Section */}
        {/* Trust Section with BNB branding */}
        <div className="mt-10 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
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
                Your money is held in a <strong className="text-slate-900">BNB Smart Chain smart contract</strong> — the vendor can't touch it until you confirm delivery.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                72-hour delivery window — if you don't receive your item, raise a dispute effortlessly.
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

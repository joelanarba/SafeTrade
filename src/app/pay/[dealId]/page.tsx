'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDeal } from '@/lib/firestore';
import { getVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
import TrustScore from '@/components/TrustScore';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // Buyer form
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

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

    // Use Paystack Inline
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!paystackKey) {
      toast.error('Payment configuration missing. Please contact support.');
      setPaying(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: buyerEmail,
      amount: Math.round(deal.amountGHS * 100), // Convert to pesewas
      currency: 'GHS',
      ref: `st_${dealId}_${Date.now()}`,
      metadata: {
        dealId: deal.id,
        buyerName,
        buyerPhone,
        buyerEmail,
        custom_fields: [
          { display_name: 'Deal', variable_name: 'deal_id', value: deal.id },
          { display_name: 'Item', variable_name: 'item_name', value: deal.itemName },
        ],
      },
      callback: function (response: { reference: string }) {
        // Payment successful
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
      const res = await fetch('/api/paystack/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'charge.success',
          data: {
            reference,
            metadata: {
              dealId: deal?.id,
              buyerName,
              buyerPhone,
              buyerEmail,
            },
          },
        }),
      });

      if (res.ok) {
        setPaid(true);
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
          <h2 className="text-xl font-bold text-white mb-2">Deal Not Found</h2>
          <p className="text-gray-400">This payment link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (deal.status !== 'pending_payment' && !paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Already Made</h2>
          <p className="text-gray-400">This deal has already been paid for. The funds are in escrow.</p>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md glow-emerald">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Payment Secured! 🎉</h2>
          <p className="text-gray-400 mb-6">
            Your <strong className="text-white">GHS {deal.amountGHS.toFixed(2)}</strong> is now locked
            in a blockchain-secured escrow. The vendor has been notified to ship your item.
          </p>
          <div className="bg-white/5 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Item</span>
              <span className="text-white">{deal.itemName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Delivery Window</span>
              <span className="text-amber-400 font-medium">72 hours</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Check your email for a confirmation link to use when you receive your item.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js" />

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Escrow Protected</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Secure Payment</h1>
        </div>

        {/* Deal Details Card */}
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

          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount</span>
              <span className="text-2xl font-bold text-white">
                ₵{deal.amountGHS.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Vendor Info */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <p className="text-xs text-gray-500 mb-1">Sold by</p>
              <p className="text-sm font-medium text-white">{deal.vendorName}</p>
            </div>
            {vendor && (
              <TrustScore
                score={vendor.trustScore}
                totalTrades={vendor.totalTrades}
                compact
              />
            )}
          </div>
        </div>

        {/* Buyer Form */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                  placeholder="Kwame Asante"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  required
                  placeholder="0241234567"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={paying || !buyerName || !buyerPhone || !buyerEmail}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {paying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay ₵{deal.amountGHS.toFixed(2)} Securely
            </>
          )}
        </button>

        {/* Trust Section */}
        <div className="mt-8 glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            How SafeTrade Protects You
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-400">
                Your money is held in a blockchain smart contract — the vendor can&apos;t touch it until you confirm delivery
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-400">
                72-hour delivery window — if you don&apos;t receive your item, raise a dispute
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-400">
                Full refund if the vendor fails to deliver and dispute is resolved in your favor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

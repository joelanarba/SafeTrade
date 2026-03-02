'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getVendor, getVendorTransactionHistory } from '@/lib/firestore';
import { Vendor, Deal } from '@/lib/types';
import TrustScore from '@/components/TrustScore';
import StatusBadge from '@/components/StatusBadge';
import {
  Shield,
  CheckCircle,
  Calendar,
  Package,
  AlertTriangle,
  Loader2,
  BadgeCheck,
  TrendingUp,
  Scale,
} from 'lucide-react';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [history, setHistory] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  async function loadVendor() {
    try {
      const v = await getVendor(vendorId);
      setVendor(v);
      if (v) {
        const h = await getVendorTransactionHistory(vendorId);
        setHistory(h);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Vendor Not Found</h2>
          <p className="text-gray-400">This vendor profile doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(vendor.createdAt).toLocaleDateString('en-GH', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-6 sm:p-8 text-center mb-6">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-emerald-500/20">
              {vendor.displayName?.charAt(0)?.toUpperCase() || 'V'}
            </div>
            {vendor.verified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-950">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{vendor.displayName}</h1>

          {vendor.verified && (
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified Vendor
            </div>
          )}

          {/* Trust Score */}
          <div className="my-6">
            <TrustScore score={vendor.trustScore} totalTrades={vendor.totalTrades} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white">{vendor.successfulTrades}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Scale className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white">{vendor.disputes}</p>
              <p className="text-xs text-gray-500">Disputes</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-white">{memberSince}</p>
              <p className="text-xs text-gray-500">Member Since</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Recent Transactions
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No completed transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((deal) => (
                <div key={deal.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{deal.itemName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(deal.createdAt).toLocaleDateString('en-GH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={deal.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SafeTrade Branding */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Trust profile powered by SafeTrade Ghana</span>
          </div>
        </div>
      </div>
    </div>
  );
}

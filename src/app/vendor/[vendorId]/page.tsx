'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getVendor, getVendorTransactionHistory } from '@/lib/firestore';
import { Vendor, Deal } from '@/lib/types';
import TrustScore from '@/components/TrustScore';
import StatusBadge from '@/components/StatusBadge';
import VendorBadge from '@/components/VendorBadge';
import ShareLink from '@/components/ShareLink';
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
  Copy,
  MessageCircle,
  Instagram,
  Check
} from 'lucide-react';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [history, setHistory] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState('');
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [copiedIg, setCopiedIg] = useState(false);

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  useEffect(() => {
    if (vendor) {
      setProfileUrl(`https://safetrade-africa.vercel.app/${vendor.username || vendor.id}`);
    }
  }, [vendor]);

  async function loadVendor() {
    try {
      const v = await getVendor(vendorId);
      setVendor(v);
      if (v) {
        const h = await getVendorTransactionHistory(vendorId, 5);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-soft border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Vendor Not Found</h2>
          <p className="text-slate-500 font-medium">This vendor profile doesn't exist.</p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(vendor.createdAt).toLocaleDateString('en-GH', {
    month: 'long',
    year: 'numeric',
  });

  const handleCopyProfile = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my SafeTrade profile: ${profileUrl}`)}`, '_blank');
  };

  const handleShareIG = async () => {
    try {
      const caption = `I'm a verified SafeTrade seller. Check my trust score before you buy.\n\n${profileUrl}`;
      await navigator.clipboard.writeText(caption);
      setCopiedIg(true);
      setTimeout(() => setCopiedIg(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 text-center mb-10 shadow-soft border border-slate-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-50 to-blue-50 opacity-50" />
          
          {/* Avatar */}
          <div className="relative inline-block mb-6 mt-4">
            <div className="w-28 h-28 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-4xl font-black text-emerald-700 shadow-sm border-4 border-white rotate-3 hover:rotate-0 transition-transform duration-300">
              {vendor.displayName?.charAt(0)?.toUpperCase() || 'V'}
            </div>
            {vendor.verified && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {vendor.displayName}
          </h1>

          {/* Trust Score & Share */}
          <div className="mb-8">
            <VendorBadge
              successfulTrades={vendor.successfulTrades}
              trustScore={vendor.trustScore}
              verified={vendor.verified}
            />
          </div>

          <div className="flex flex-col items-center justify-center mb-10 gap-6">
            <div className="scale-110">
              <TrustScore score={vendor.trustScore} totalTrades={vendor.totalTrades} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center">
              <button
                onClick={handleCopyProfile}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm"
              >
                {copiedProfile ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedProfile ? 'Copied Link!' : 'Copy Profile Link'}
              </button>
              
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Share on WhatsApp
              </button>

              <button
                onClick={handleShareIG}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-600 hover:from-purple-500/20 hover:to-pink-500/20 border border-pink-500/20 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm"
              >
                {copiedIg ? <Check className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
                {copiedIg ? 'Copied Caption!' : 'Share on Instagram'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6">
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{vendor.successfulTrades}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Completed</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{vendor.disputes}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Disputes</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight text-center">{memberSince}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Joined</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Recent Transactions
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 mb-2">No completed transactions yet</p>
              <p className="text-base text-slate-500">This vendor is new to the platform.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((deal) => (
                <div key={deal.id} className="px-8 py-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-slate-900">{deal.itemName}</p>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                        {new Date(deal.createdAt).toLocaleDateString('en-GH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SafeTrade Branding */}
        <div className="text-center mt-12 mb-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="inline-flex items-center gap-2 text-slate-500">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Powered by SafeTrade</span>
          </div>
        </div>
      </div>
    </div>
  );
}

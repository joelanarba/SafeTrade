'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { getVendor } from '@/lib/firestore';
import { Deal, Vendor } from '@/lib/types';
import { auth } from '@/lib/firebase';
import {
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
  ShieldOff,
  Truck,
  Info,
  Phone,
  Star,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Admin email whitelist — must match ADMIN_EMAILS env var on the server
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminGate />
    </ProtectedRoute>
  );
}

/** Gate: checks if the logged-in user is an admin before rendering content */
function AdminGate() {
  const { user } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mesh-bg px-4">
        <div className="text-center bg-white rounded-3xl p-10 max-w-md w-full shadow-soft border border-slate-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 font-medium">
            You do not have admin privileges. This page is restricted to platform administrators.
          </p>
        </div>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Deal[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<string, Vendor>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    try {
      // Use server-side API (Admin SDK) to fetch disputes — bypasses Firestore security rules
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.error('No auth token available');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/admin/disputes', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        console.error('Failed to fetch disputes:', await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      const d: Deal[] = data.disputes || [];
      setDisputes(d);
      // Load vendor data for each dispute
      const vendors: Record<string, Vendor> = {};
      for (const deal of d) {
        if (!vendors[deal.vendorId]) {
          const v = await getVendor(deal.vendorId);
          if (v) vendors[deal.vendorId] = v;
        }
      }
      setVendorMap(vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(dealId: string, action: 'release' | 'refund') {
    setActionLoading(dealId);
    try {
      // Get fresh ID token for admin verification
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error('Authentication expired. Please refresh the page.');
        return;
      }

      const res = await fetch('/api/admin/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ dealId, action }),
      });

      if (res.ok) {
        toast.success(action === 'release' ? 'Funds released to vendor' : 'Funds refunded to buyer');
        setDisputes((prev) => prev.filter((d) => d.id !== dealId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error resolving dispute');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg px-4 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-5 mb-12">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-base font-medium text-slate-500 mt-1">Manage disputes and resolutions securely.</p>
          </div>
        </div>

        {/* Courier API Note */}
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-900 text-sm">Courier API Integration</p>
            <p className="text-blue-700 text-xs font-medium mt-0.5">
              Automated courier tracking and delivery confirmation coming soon. Currently, delivery is verified manually by buyers.
            </p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Active Disputes
              <span className="bg-red-100 text-red-700 text-sm font-black px-3 py-0.5 rounded-full ml-2">
                {disputes.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mb-2">Platform is Clean</p>
              <p className="text-base font-medium text-slate-500">There are no active disputes at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {disputes.map((deal) => (
                <div key={deal.id} className="p-8 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                    {/* Deal Info */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-xl font-extrabold text-slate-900">{deal.itemName}</h3>
                        <StatusBadge status={deal.status} />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Amount Locked</span>
                          <span className="text-slate-900 font-black text-lg">₵{deal.amountGHS.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Date</span>
                          <span className="text-slate-900 font-bold text-base">
                            {new Date(deal.createdAt).toLocaleDateString('en-GH', { dateStyle: 'medium' })}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Vendor</span>
                          <span className="text-slate-900 font-bold text-base">{deal.vendorName}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Buyer</span>
                          <span className="text-slate-900 font-bold text-base">{deal.buyerName || 'Unknown'}</span>
                        </div>
                      </div>

                      {/* Dispute Reason */}
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Dispute Reason
                        </p>
                        <p className="text-base font-medium text-slate-800 leading-relaxed">
                          {deal.disputeReason || 'No detailed reason provided by the buyer.'}
                        </p>
                        {deal.disputePhoto && (
                          <div className="mt-4">
                            <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-amber-600" />
                              Evidence Photos
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(deal.disputePhotos && deal.disputePhotos.length > 0 ? deal.disputePhotos : [deal.disputePhoto]).map((photo: string, i: number) => (
                                photo && (
                                  <a
                                    key={i}
                                    href={photo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block aspect-square rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-400 transition-colors"
                                  >
                                    <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vendor Context */}
                      {vendorMap[deal.vendorId] && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-4">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Vendor Context</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-4 h-4 text-amber-500" />
                              </div>
                              <p className="text-lg font-black text-slate-900">{vendorMap[deal.vendorId].trustScore.toFixed(1)}</p>
                              <p className="text-xs font-bold text-slate-500">Trust Score</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-slate-900">{vendorMap[deal.vendorId].successfulTrades}</p>
                              <p className="text-xs font-bold text-slate-500">Completed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-red-600">{vendorMap[deal.vendorId].disputes}</p>
                              <p className="text-xs font-bold text-slate-500">Disputes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-slate-900">{vendorMap[deal.vendorId].totalTrades}</p>
                              <p className="text-xs font-bold text-slate-500">Total Trades</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contact Buttons */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        {deal.vendorPhone && (
                          <a
                            href={`https://wa.me/${deal.vendorPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 px-4 py-2 rounded-xl border border-[#25D366]/20 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Vendor
                          </a>
                        )}
                        {deal.buyerPhone && (
                          <a
                            href={`https://wa.me/${deal.buyerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-100 transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            WhatsApp Buyer
                          </a>
                        )}
                      </div>

                      {deal.escrowTxHash && (
                        <a
                          href={`https://testnet.bscscan.com/tx/${deal.escrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 mt-6"
                        >
                          Verify on BSCScan <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-4 lg:min-w-[200px]">
                      <button
                        onClick={() => handleResolve(deal.id, 'release')}
                        disabled={actionLoading === deal.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-4 rounded-xl text-base font-extrabold transition-all shadow-md hover-lift disabled:opacity-50"
                      >
                        {actionLoading === deal.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        Release to Vendor
                      </button>
                      <button
                        onClick={() => handleResolve(deal.id, 'refund')}
                        disabled={actionLoading === deal.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 px-5 py-4 rounded-xl text-base font-extrabold transition-all shadow-sm disabled:opacity-50"
                      >
                        {actionLoading === deal.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-5 h-5" />
                        )}
                        Refund to Buyer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

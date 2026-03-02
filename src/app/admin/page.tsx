'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { getDisputedDeals } from '@/lib/firestore';
import { Deal } from '@/lib/types';
import {
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    try {
      const d = await getDisputedDeals();
      setDisputes(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(dealId: string, action: 'release' | 'refund') {
    setActionLoading(dealId);
    try {
      const res = await fetch('/api/admin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                          <a
                            href={deal.disputePhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 mt-4 bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm transition-all"
                          >
                            <ImageIcon className="w-4 h-4" />
                            View Attached Evidence
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

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
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Manage disputes and resolutions</p>
          </div>
        </div>

        {/* Disputes List */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Active Disputes
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {disputes.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">No Active Disputes</p>
              <p className="text-gray-500 text-sm">All disputes have been resolved</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {disputes.map((deal) => (
                <div key={deal.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Deal Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{deal.itemName}</h3>
                        <StatusBadge status={deal.status} />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Amount:</span>{' '}
                          <span className="text-white font-medium">₵{deal.amountGHS.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Vendor:</span>{' '}
                          <span className="text-white">{deal.vendorName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Buyer:</span>{' '}
                          <span className="text-white">{deal.buyerName || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>{' '}
                          <span className="text-white">
                            {new Date(deal.createdAt).toLocaleDateString('en-GH')}
                          </span>
                        </div>
                      </div>

                      {/* Dispute Reason */}
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                        <p className="text-xs text-red-400 font-medium mb-1">Dispute Reason</p>
                        <p className="text-sm text-gray-300">
                          {deal.disputeReason || 'No reason provided'}
                        </p>
                        {deal.disputePhoto && (
                          <a
                            href={deal.disputePhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                          >
                            <ImageIcon className="w-3 h-3" />
                            View attached photo
                          </a>
                        )}
                      </div>

                      {deal.escrowTxHash && (
                        <a
                          href={`https://testnet.bscscan.com/tx/${deal.escrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 mt-3"
                        >
                          View escrow on BSCScan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-3 lg:min-w-[160px]">
                      <button
                        onClick={() => handleResolve(deal.id, 'release')}
                        disabled={actionLoading === deal.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {actionLoading === deal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Release
                      </button>
                      <button
                        onClick={() => handleResolve(deal.id, 'refund')}
                        disabled={actionLoading === deal.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {actionLoading === deal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Refund
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

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import TrustScore from '@/components/TrustScore';
import { createDeal, getVendorDeals } from '@/lib/firestore';
import { Deal } from '@/lib/types';
import {
  Plus,
  Copy,
  ExternalLink,
  Package,
  TrendingUp,
  Loader2,
  X,
  CheckCircle,
  Banknote,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, vendor } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) loadDeals();
  }, [user]);

  async function loadDeals() {
    if (!user) return;
    try {
      const d = await getVendorDeals(user.uid);
      setDeals(d);
    } catch (err) {
      console.error('Error loading deals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !vendor) return;
    setCreating(true);
    try {
      const amount = parseFloat(price);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Enter a valid price');
        return;
      }
      const deal = await createDeal(
        user.uid,
        vendor.displayName || user.displayName || 'Vendor',
        phone,
        itemName,
        description,
        amount
      );
      setDeals((prev) => [deal, ...prev]);
      setShowCreateModal(false);
      setItemName('');
      setDescription('');
      setPrice('');
      setPhone('');
      toast.success('Deal created! Share the payment link with your buyer.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create deal');
    } finally {
      setCreating(false);
    }
  }

  function copyPaymentLink(dealId: string) {
    const url = `${window.location.origin}/pay/${dealId}`;
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied!');
  }

  const totalEarnings = deals
    .filter((d) => d.status === 'completed')
    .reduce((acc, d) => acc + d.vendorPayout, 0);

  const activeDeals = deals.filter((d) => !['completed', 'refunded'].includes(d.status));
  const completedDeals = deals.filter((d) => d.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome, {vendor?.displayName || 'Vendor'} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage your deals and track payments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              ₵{totalEarnings.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Earnings</p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{activeDeals.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Deals</p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{completedDeals.length}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="mt-1">
              <TrustScore
                score={vendor?.trustScore || 0}
                totalTrades={vendor?.totalTrades || 0}
                compact
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Trust Score</p>
          </div>
        </div>

        {/* Deals List */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">Your Deals</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No deals yet</p>
              <p className="text-gray-600 text-sm">Create your first deal and share the link with your buyer</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white truncate">{deal.itemName}</h3>
                        <StatusBadge status={deal.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        ₵{deal.amountGHS.toFixed(2)}
                        {deal.buyerName && ` • ${deal.buyerName}`}
                        {' • '}
                        {new Date(deal.createdAt).toLocaleDateString('en-GH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {deal.escrowTxHash && (
                        <a
                          href={`https://testnet.bscscan.com/tx/${deal.escrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 mt-1"
                        >
                          View on BSCScan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {deal.status === 'pending_payment' && (
                        <button
                          onClick={() => copyPaymentLink(deal.id)}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-xs transition-all border border-white/5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Deal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl w-full max-w-md p-6 relative border border-white/10">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Create New Deal</h2>
            <p className="text-sm text-gray-400 mb-6">
              Fill in the details and share the payment link
            </p>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Item Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  placeholder="e.g. iPhone 14 Pro Max"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe the item — color, size, condition..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Price (GHS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₵</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Your Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="e.g. 0241234567"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {price && parseFloat(price) > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Platform Fee (2%)</span>
                    <span>₵{(parseFloat(price) * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold mt-1">
                    <span>You Receive</span>
                    <span>₵{(parseFloat(price) * 0.98).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Deal & Get Link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

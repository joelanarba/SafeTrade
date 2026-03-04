'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import TrustScore from '@/components/TrustScore';
import VendorBadge from '@/components/VendorBadge';
import { BnbLogo } from '@/components/BnbChainBadge';
import ShareLink from '@/components/ShareLink';
import { createDeal, getVendorDeals } from '@/lib/firestore';
import { Deal, DeliveryMethod, ESTIMATED_DELIVERY_OPTIONS } from '@/lib/types';
import {
  Plus,
  ExternalLink,
  Package,
  TrendingUp,
  Loader2,
  X,
  Banknote,
  Search,
  XCircle,
  CheckCircle,
  Pencil,
  Trash2,
  Truck,
  Globe,
  Send as SendIcon,
  Timer,
  ImagePlus,
  FileText,
  Settings,
  Rocket,
  Share2,
  CircleDot,
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
  const [cancellingDealId, setCancellingDealId] = useState<string | null>(null);
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [shippingDealId, setShippingDealId] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete'; dealId: string; itemName: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('personal');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<number>(24);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  function handleImageSelect(file: File, mode: 'create' | 'edit') {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const url = URL.createObjectURL(file);
    if (mode === 'create') { setImageFile(file); setImagePreview(url); }
    else { setEditImageFile(file); setEditImagePreview(url); }
  }

  async function uploadDealImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-deal-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  }

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
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadDealImage(imageFile);
      }
      const deal = await createDeal(
        user.uid,
        vendor.displayName || user.displayName || 'Vendor',
        phone,
        itemName,
        description,
        amount,
        deliveryMethod,
        deliveryMethod === 'courier' ? trackingNumber : '',
        estimatedDelivery,
        imageUrl
      );
      setDeals((prev) => [deal, ...prev]);
      setShowCreateModal(false);
      setItemName('');
      setDescription('');
      setPrice('');
      setPhone('');
      setDeliveryMethod('personal');
      setTrackingNumber('');
      setEstimatedDelivery(24);
      setImageFile(null);
      setImagePreview(null);
      toast.success('Deal created! Share the payment link with your buyer.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create deal');
    } finally {
      setCreating(false);
    }
  }

  async function handleCancelDeal(dealId: string) {
    if (!user) return;
    setConfirmAction(null);
    setCancellingDealId(dealId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/deals/${dealId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Deal cancelled.');
        setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'cancelled' as any } : d));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to cancel deal');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cancelling deal');
    } finally {
      setCancellingDealId(null);
    }
  }

  async function handleDeleteDeal(dealId: string) {
    if (!user) return;
    setConfirmAction(null);
    setDeletingDealId(dealId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Deal deleted.');
        setDeals(deals.filter(d => d.id !== dealId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete deal');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting deal');
    } finally {
      setDeletingDealId(null);
    }
  }

  function openEditModal(deal: Deal) {
    setEditingDeal(deal);
    setEditName(deal.itemName);
    setEditDesc(deal.description);
    setEditPrice(deal.amountGHS.toString());
    setEditImageFile(null);
    setEditImagePreview(deal.itemImage || null);
  }

  async function handleEditDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editingDeal) return;
    setSaving(true);
    try {
      let newImageUrl: string | undefined = undefined;
      if (editImageFile) {
        newImageUrl = await uploadDealImage(editImageFile);
      } else if (editImagePreview === null && editingDeal.itemImage) {
        // Image was removed
        newImageUrl = '';
      }

      const token = await user.getIdToken();
      const res = await fetch(`/api/deals/${editingDeal.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: editName,
          description: editDesc,
          price: editPrice,
          ...(newImageUrl !== undefined ? { itemImage: newImageUrl } : {}),
        }),
      });

      if (res.ok) {
        const amount = parseFloat(editPrice);
        const fee = Math.round(amount * 0.02 * 100) / 100;
        setDeals(deals.map(d => d.id === editingDeal.id ? {
          ...d,
          itemName: editName,
          description: editDesc,
          amountGHS: amount,
          platformFee: fee,
          vendorPayout: Math.round((amount - fee) * 100) / 100,
          ...(newImageUrl !== undefined ? { itemImage: newImageUrl } : {}),
        } : d));
        setEditingDeal(null);
        toast.success('Deal updated.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update deal');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating deal');
    } finally {
      setSaving(false);
    }
  }

  async function handleShipDeal(dealId: string) {
    if (!user) return;
    setShippingDealId(dealId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/deals/${dealId}/ship`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Order marked as shipped!');
        setDeals(deals.map(d => d.id === dealId ? {
          ...d,
          shippedAt: data.shippedAt,
          autoReleaseAt: data.autoReleaseAt,
        } : d));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to mark as shipped');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error marking as shipped');
    } finally {
      setShippingDealId(null);
    }
  }

  const getPaymentUrl = (dealId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/pay/${dealId}`;
    }
    return '';
  };

  const totalEarnings = deals
    .filter((d) => d.status === 'completed')
    .reduce((acc, d) => acc + d.vendorPayout, 0);

  const activeDeals = deals.filter((d) => !['completed', 'refunded'].includes(d.status));
  const completedDeals = deals.filter((d) => d.status === 'completed');

  const filteredDeals = deals.filter((d) => {
    const term = searchQuery.toLowerCase();
    return (
      d.itemName.toLowerCase().includes(term) ||
      (d.buyerName && d.buyerName.toLowerCase().includes(term)) ||
      d.status.toLowerCase().replace('_', ' ').includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
              Welcome, {vendor?.displayName || 'Vendor'}
              {vendor && (
                <VendorBadge 
                  successfulTrades={vendor.successfulTrades}
                  trustScore={vendor.trustScore}
                  verified={vendor.verified}
                />
              )}
            </h1>
            <p className="text-slate-500 text-base mt-2 font-medium">Manage your protected deals and track payouts.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-base font-bold transition-all shadow-md hover-lift"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Create New Deal
          </button>
        </div>

        {/* Onboarding Checklist */}
        {vendor && (() => {
          const steps = [
            { key: 'account', label: 'Create your account', desc: 'Sign up and get started on SafeTrade', done: true, icon: CheckCircle, color: 'emerald' },
            { key: 'momo', label: 'Set up MoMo payout', desc: 'Add your Mobile Money number to receive payouts', done: !!vendor.momoNumber, icon: Banknote, color: 'amber', action: '/settings', actionLabel: 'Go to Settings' },
            { key: 'deal', label: 'Create your first deal', desc: 'Generate a secure escrow payment link', done: deals.length > 0, icon: Package, color: 'blue', onClick: () => setShowCreateModal(true), actionLabel: 'Create Deal' },
            { key: 'share', label: 'Get your first buyer', desc: 'Share your payment link and receive a payment', done: deals.some(d => d.status !== 'pending_payment' && d.status !== 'cancelled'), icon: Share2, color: 'purple' },
            { key: 'complete', label: 'Complete your first sale', desc: 'Buyer confirms delivery and funds are released', done: completedDeals.length > 0, icon: Rocket, color: 'emerald' },
          ];
          const doneCount = steps.filter(s => s.done).length;
          const allDone = doneCount === steps.length;
          if (allDone) return null;
          const progress = Math.round((doneCount / steps.length) * 100);
          return (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Getting Started</h3>
                    <p className="text-sm text-slate-500 font-medium">{doneCount} of {steps.length} steps completed</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">{progress}%</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              {/* Steps */}
              <div className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const colorMap: Record<string, {bg: string, icon: string, ring: string}> = {
                    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'border-emerald-200' },
                    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'border-amber-200' },
                    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'border-blue-200' },
                    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'border-purple-200' },
                  };
                  const c = colorMap[step.color] || colorMap.emerald;
                  return (
                    <div key={step.key} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step.done ? 'bg-slate-50/50' : 'bg-white border border-slate-100'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-100' : c.bg}`}>
                        {step.done ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Icon className={`w-5 h-5 ${c.icon}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.label}</p>
                        {!step.done && <p className="text-xs text-slate-500 font-medium mt-0.5">{step.desc}</p>}
                      </div>
                      {!step.done && step.action && (
                        <a href={step.action} className={`text-xs font-bold px-3.5 py-1.5 rounded-lg ${c.bg} ${c.icon} border ${c.ring} hover:opacity-80 transition-opacity flex-shrink-0`}>
                          {step.actionLabel}
                        </a>
                      )}
                      {!step.done && step.onClick && (
                        <button onClick={step.onClick} className={`text-xs font-bold px-3.5 py-1.5 rounded-lg ${c.bg} ${c.icon} border ${c.ring} hover:opacity-80 transition-opacity flex-shrink-0`}>
                          {step.actionLabel}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Banknote className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
              <span className="text-2xl text-slate-400 font-bold mr-1">₵</span>
              {totalEarnings.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Total Earnings</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeDeals.length}</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Active Deals</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{completedDeals.length}</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Completed</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 scale-110 origin-left">
              <TrustScore
                score={vendor?.trustScore || 0}
                totalTrades={vendor?.totalTrades || 0}
                compact
              />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-3">Trust Score</p>
          </div>
        </div>

        {/* Works Everywhere Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Works Everywhere</h3>
              <p className="text-sm text-slate-500 font-medium">Share your payment links on any platform</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { name: 'WhatsApp', color: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20' },
              { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-600 border-pink-500/20' },
              { name: 'X (Twitter)', color: 'bg-slate-900/5 text-slate-900 border-slate-900/10' },
              { name: 'TikTok', color: 'bg-slate-900/5 text-slate-800 border-slate-900/10' },
              { name: 'Facebook', color: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20' },
              { name: 'Telegram', color: 'bg-[#0088cc]/10 text-[#0088cc] border-[#0088cc]/20' },
            ].map((platform) => (
              <span
                key={platform.name}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${platform.color}`}
              >
                {platform.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-4">
            Your SafeTrade payment links generate rich previews with item name, price, and your trust score when shared.
          </p>
        </div>

        {/* Deals List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deals..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-24 sm:py-32">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">No deals yet</p>
              <p className="text-base text-slate-500 max-w-sm mx-auto">Create your first deal to generate a secure payment link for your buyer.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-8 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Create First Deal
              </button>
            </div>
          ) : filteredDeals.length === 0 && searchQuery ? (
            <div className="text-center py-24 sm:py-32">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">No results found</p>
              <p className="text-base text-slate-500 max-w-sm mx-auto mb-6">We couldn't find any deals matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="px-8 py-6 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {deal.itemImage ? (
                        <img src={deal.itemImage} alt={deal.itemName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{deal.itemName}</h3>
                        <StatusBadge status={deal.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-500">
                        <span className="text-slate-900 font-bold">₵{deal.amountGHS.toFixed(2)}</span>
                        {deal.buyerName && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{deal.buyerName}</span>
                          </>
                        )}
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>
                          {new Date(deal.createdAt).toLocaleDateString('en-GH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {deal.escrowTxHash && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <a
                              href={`https://testnet.bscscan.com/tx/${deal.escrowTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#C99400] hover:text-[#A67C00] hover:underline underline-offset-2 font-bold"
                            >
                              <BnbLogo className="w-3.5 h-3.5" />
                              BscScan <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {deal.status === 'pending_payment' && (
                        <>
                          <button
                            onClick={() => openEditModal(deal)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-blue-200 shadow-sm"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'cancel', dealId: deal.id, itemName: deal.itemName })}
                            disabled={cancellingDealId === deal.id}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-amber-200 shadow-sm disabled:opacity-50"
                          >
                            {cancellingDealId === deal.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'delete', dealId: deal.id, itemName: deal.itemName })}
                            disabled={deletingDealId === deal.id}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-red-200 shadow-sm disabled:opacity-50"
                          >
                            {deletingDealId === deal.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                          <ShareLink 
                            url={getPaymentUrl(deal.id)} 
                            title={`SafeTrade Escrow: ${deal.itemName}`} 
                            text={`Securely pay ₵${deal.amountGHS.toFixed(2)} to ${vendor?.displayName || 'me'} using SafeTrade. Your money is protected!`}
                          />
                        </>
                      )}
                      {deal.status === 'in_escrow' && (
                        <>
                          {!deal.shippedAt ? (
                            <button
                              onClick={() => handleShipDeal(deal.id)}
                              disabled={shippingDealId === deal.id}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-blue-200 shadow-sm disabled:opacity-50"
                            >
                              {shippingDealId === deal.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <SendIcon className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">Mark Shipped</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200">
                              <Timer className="w-3.5 h-3.5" />
                              Auto-release: {new Date(deal.autoReleaseAt || '').toLocaleDateString('en-GH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {deal.confirmationToken && (
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/confirm/${deal.confirmationToken}`;
                                navigator.clipboard.writeText(url);
                                toast.success('Confirmation link copied! Send it to your buyer.');
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-emerald-200 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Copy Buyer Link
                            </button>
                          )}
                        </>
                      )}
                      {(deal.status === 'cancelled') && (
                        <button
                          onClick={() => setConfirmAction({ type: 'delete', dealId: deal.id, itemName: deal.itemName })}
                          disabled={deletingDealId === deal.id}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-red-200 shadow-sm disabled:opacity-50"
                        >
                          {deletingDealId === deal.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                      {(deal.status === 'completed' || deal.status === 'refunded') && (
                        <a
                          href={`/receipt/${deal.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border border-emerald-200 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Receipt</span>
                        </a>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 sm:p-10 pb-12 relative shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
                <Plus className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Create New Deal</h2>
              <p className="text-base font-medium text-slate-500">
                Setup the product details to generate your secure escrow link.
              </p>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  placeholder="e.g. Pre-owned iPhone 14 Pro Max"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe the condition, color, delivery terms..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Price (GHS)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₵</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-9 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Your Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="e.g. 0241234567"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Delivery Method</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all appearance-none"
                  >
                    <option value="personal">Personal Delivery</option>
                    <option value="courier">Courier / Dispatch</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Estimated Delivery Time</label>
                <div className="relative">
                  <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all appearance-none"
                  >
                    {ESTIMATED_DELIVERY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {deliveryMethod === 'courier' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tracking Number (Optional)</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. GH-12345678"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
              )}

              {/* Product Image (Optional) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Product Image <span className="text-slate-400 font-medium">(Optional)</span></label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl border-2 border-emerald-200" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group">
                    <ImagePlus className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 transition-colors mb-2" />
                    <span className="text-sm font-medium text-slate-400 group-hover:text-emerald-600 transition-colors">Click to upload image</span>
                    <span className="text-xs text-slate-300 mt-1">JPG, PNG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], 'create'); }}
                    />
                  </label>
                )}
              </div>

              {price && parseFloat(price) > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                    <span>Platform Fee (2%)</span>
                    <span>₵{(parseFloat(price) * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>You Receive</span>
                    <span className="text-emerald-600">₵{(parseFloat(price) * 0.98).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 mt-6 rounded-2xl font-bold text-lg transition-all shadow-md hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-5 h-5 animate-spin" />}
                Generate Payment Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 sm:p-10 pb-12 relative shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingDeal(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
                <Pencil className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Edit Deal</h2>
              <p className="text-base font-medium text-slate-500">
                Update the details for this deal. Changes apply immediately.
              </p>
            </div>

            <form onSubmit={handleEditDeal} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (GHS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₵</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Product Image (Optional) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Product Image <span className="text-slate-400 font-medium">(Optional)</span></label>
                {editImagePreview ? (
                  <div className="relative inline-block">
                    <img src={editImagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl border-2 border-blue-200" />
                    <button
                      type="button"
                      onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                    <ImagePlus className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors mb-2" />
                    <span className="text-sm font-medium text-slate-400 group-hover:text-blue-600 transition-colors">Click to upload image</span>
                    <span className="text-xs text-slate-300 mt-1">JPG, PNG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], 'edit'); }}
                    />
                  </label>
                )}
              </div>

              {editPrice && parseFloat(editPrice) > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                    <span>Platform Fee (2%)</span>
                    <span>₵{(parseFloat(editPrice) * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>You Receive</span>
                    <span className="text-emerald-600">₵{(parseFloat(editPrice) * 0.98).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-base transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 sm:p-8 pb-10 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                confirmAction.type === 'delete' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                {confirmAction.type === 'delete' ? (
                  <Trash2 className="w-8 h-8 text-red-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                {confirmAction.type === 'delete' ? 'Delete Deal?' : 'Cancel Deal?'}
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                {confirmAction.type === 'delete'
                  ? `"${confirmAction.itemName}" will be permanently removed.`
                  : `"${confirmAction.itemName}" will be cancelled and the payment link will stop working.`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === 'delete') handleDeleteDeal(confirmAction.dealId);
                    else handleCancelDeal(confirmAction.dealId);
                  }}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all ${
                    confirmAction.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'Yes, Delete' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

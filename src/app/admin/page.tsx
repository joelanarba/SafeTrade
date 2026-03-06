'use client';

import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import BscScanLink from '@/components/BscScanLink';
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
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Users,
  Settings,
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
  
  const [activeTab, setActiveTab] = useState<'overview' | 'disputes' | 'users'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  async function handleLogout() {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

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

  const activeDisputesCount = disputes.length;
  const uniqueVendorsCount = Object.keys(vendorMap).length;
  const totalLockedAmount = disputes.reduce((acc, d) => acc + d.amountGHS, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          Admin
        </h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-50 rounded-lg">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'fixed inset-0 z-30 mt-[69px] bg-white' : 'hidden md:flex'}
        w-full md:w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 md:min-h-screen md:sticky md:top-0 md:h-screen
      `}>
        <div className="p-6 hidden md:block">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Admin Panel
          </h2>
        </div>
        
        <div className="flex-1 px-4 py-4 md:py-0 overflow-y-auto">
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                activeTab === 'overview' 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('disputes'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                activeTab === 'disputes' 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Disputes
              {activeDisputesCount > 0 && (
                <span className={`ml-auto text-xs py-0.5 px-2 rounded-full ${activeTab === 'disputes' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                  {activeDisputesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                activeTab === 'users' 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-5 h-5" />
              Users & Data
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="mb-4 px-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Administrator</p>
              <p className="text-xs font-medium text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full bg-slate-50/50 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-8 lg:p-12 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
              <p className="text-slate-500 text-base mt-2 font-medium">Platform oversight and dispute resolution.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeDisputesCount}</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Active Disputes</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                <span className="text-2xl text-slate-400 font-bold mr-1">₵</span>
                {totalLockedAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Locked in Disputes</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{uniqueVendorsCount}</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Vendors with Disputes</p>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4 rounded-tl-2xl">Item & Detail</th>
                    <th className="px-6 py-4">Amount & Status</th>
                    <th className="px-6 py-4">Parties</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disputes.map((deal) => (
                    <Fragment key={deal.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{deal.itemName}</p>
                              <p className="text-xs font-medium text-slate-500 max-w-[200px] truncate" title={deal.disputeReason || ''}>
                                {deal.disputeReason || 'No reason provided'}
                              </p>
                              {deal.escrowTxHash && (
                                <BscScanLink
                                  txHash={deal.escrowTxHash}
                                  label="Verify Tx"
                                  variant="inline"
                                  className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold mt-0.5 cursor-pointer"
                                />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900">₵{deal.amountGHS.toFixed(2)}</span>
                          <div className="mt-1">
                            <StatusBadge status={deal.status} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-bold text-slate-400 w-12">VENDOR</span>
                              <span className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{deal.vendorName}</span>
                              {deal.vendorPhone && (
                                <a href={`https://wa.me/${deal.vendorPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:bg-[#25D366]/10 p-1 rounded-md transition-colors" title="WhatsApp Vendor">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-bold text-slate-400 w-12">BUYER</span>
                              <span className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{deal.buyerName || 'Unknown'}</span>
                              {deal.buyerPhone && (
                                <a href={`https://wa.me/${deal.buyerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:bg-[#25D366]/10 p-1 rounded-md transition-colors" title="WhatsApp Buyer">
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                          {new Date(deal.createdAt).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                              {expandedDeal === deal.id ? 'Hide Details' : 'Review Case'}
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolve(deal.id, 'release')}
                                disabled={actionLoading === deal.id}
                                className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-emerald-200"
                                title="Release to Vendor"
                              >
                                {actionLoading === deal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleResolve(deal.id, 'refund')}
                                disabled={actionLoading === deal.id}
                                className="inline-flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-red-200"
                                title="Refund to Buyer"
                              >
                                {actionLoading === deal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {expandedDeal === deal.id && (
                        <tr className="bg-slate-50/50 relative">
                          <td colSpan={5} className="p-0 border-t border-slate-100">
                            <div className="w-full absolute left-0 h-full border-l-4 border-amber-400 pointer-events-none" />
                            <div className="px-8 py-6 max-w-4xl mx-auto whitespace-normal pl-12 grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4 text-amber-600" />
                                  Evidence Photos
                                </h4>
                                {!deal.disputePhoto && (!deal.disputePhotos || deal.disputePhotos.length === 0) ? (
                                  <p className="text-sm font-medium text-slate-500 italic">No evidence uploaded</p>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {(deal.disputePhotos && deal.disputePhotos.length > 0 ? deal.disputePhotos : [deal.disputePhoto]).map((photo: string, i: number) => (
                                      photo && (
                                        <a
                                          key={i}
                                          href={photo}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block aspect-square rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-400 transition-colors shadow-sm"
                                        >
                                          <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                        </a>
                                      )
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                {vendorMap[deal.vendorId] && (
                                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 mb-4">
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Vendor Reliability metrics</p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                          <span className="text-xl font-black text-slate-900">{vendorMap[deal.vendorId].trustScore.toFixed(1)}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Trust Score</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-xl font-black text-slate-900">{vendorMap[deal.vendorId].successfulTrades}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Completed Sales</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-xl font-black text-red-600">{vendorMap[deal.vendorId].disputes}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Disputes Raised</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-xl font-black text-slate-900">{vendorMap[deal.vendorId].totalTrades}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Trades</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Full Dispute Description</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                      {deal.disputeReason || 'No detailed reason provided by the buyer.'}
                                    </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  </div>
  );
}

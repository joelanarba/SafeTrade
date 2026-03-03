'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/lib/firebase';
import {
  Settings,
  Smartphone,
  User,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { vendor, refreshVendor } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Vodafone' | 'AirtelTigo'>('MTN');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pre-fill from vendor profile
  useEffect(() => {
    if (vendor) {
      setDisplayName(vendor.displayName || '');
      setPhone(vendor.phone || '');
      setMomoNumber(vendor.momoNumber || '');
      setMomoProvider(vendor.momoProvider || 'MTN');
    }
  }, [vendor]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName,
          phone,
          momoNumber,
          momoProvider,
        }),
      });

      if (res.ok) {
        setSaved(true);
        toast.success('Profile updated! Your payout details are saved.');
        await refreshVendor();
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  const isMomoConfigured = vendor?.momoNumber && vendor?.momoProvider;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-24 sm:py-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Settings className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-slate-500 font-medium mt-1">
              Manage your profile and payout details.
            </p>
          </div>
        </div>

        {/* MoMo Alert */}
        {!isMomoConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Set up your payout details</h3>
              <p className="text-amber-700 text-sm font-medium leading-relaxed">
                You need to add your Mobile Money number to receive payouts when buyers confirm
                delivery. Without this, your earnings will be held until you configure it.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-soft border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <User className="w-5 h-5 text-emerald-600" />
              Business Profile
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Business / Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Abena's Fashion"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0241234567"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MoMo Payout Section */}
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-soft border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Mobile Money Payout
              {isMomoConfigured && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Configured
                </span>
              )}
            </h2>
            <p className="text-sm font-medium text-slate-500 mb-6">
              This is the account where your earnings will be sent when a buyer confirms delivery.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  MoMo Provider
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['MTN', 'Vodafone', 'AirtelTigo'] as const).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setMomoProvider(provider)}
                      className={`py-3.5 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                        momoProvider === provider
                          ? provider === 'MTN'
                            ? 'bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm'
                            : provider === 'Vodafone'
                            ? 'bg-red-50 border-red-400 text-red-800 shadow-sm'
                            : 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  MoMo Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    placeholder="e.g. 0241234567"
                    maxLength={10}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium transition-all"
                  />
                </div>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  10-digit number starting with 0. This is the number registered with your MoMo
                  provider.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-md hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

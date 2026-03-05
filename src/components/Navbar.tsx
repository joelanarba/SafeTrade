'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Menu, X, LogOut, LayoutDashboard, User, Phone } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function Navbar() {
  const { user, vendor, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const authPhone = localStorage.getItem('buyer_auth');
      if (authPhone) {
        setBuyerPhone(authPhone);
      }
    }
  }, []);

  const handleBuyerLogout = () => {
    localStorage.removeItem('buyer_auth');
    setBuyerPhone(null);
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center group transition-transform hover:scale-105 active:scale-95 origin-left">
            <Logo variant="light" className="h-10 sm:h-11 w-auto" />
          </Link>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-6">
            {!loading && mounted && user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-50">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {vendor && (
                  <Link href={`/vendor/${vendor.id}`} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-50">
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                )}
                <button onClick={logout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors text-sm px-4 py-2.5 rounded-xl hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
             ) : !loading && mounted && buyerPhone ? (
               <>
                <Link href={`/buyer/${encodeURIComponent(buyerPhone)}`} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-50">
                  <Phone className="w-4 h-4" />
                  Buyer Portal
                </Link>
                <button onClick={handleBuyerLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors text-sm px-4 py-2.5 rounded-xl hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
               </>
            ) : !loading && mounted ? (
              <>
                <Link href="/track" className="text-slate-600 hover:text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-1 text-sm font-bold transition-colors">
                  Track Order
                </Link>
                <Link href="/login" className="text-slate-600 hover:text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-1 text-sm font-bold transition-colors">
                  Sign In
                </Link>
                <Link href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-soft hover-lift">
                  Start as Vendor
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-600 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-6 border-t border-slate-100 mt-2 pt-4 space-y-3 bg-white">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 text-slate-700 hover:text-emerald-600 font-bold px-4 py-4 rounded-xl hover:bg-emerald-50"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                {vendor && (
                  <Link
                    href={`/vendor/${vendor.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-slate-700 hover:text-emerald-600 font-bold px-4 py-4 rounded-xl hover:bg-emerald-50"
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-slate-500 hover:text-red-600 font-bold px-4 py-4 rounded-xl hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : buyerPhone ? (
               <>
                <Link
                  href={`/buyer/${encodeURIComponent(buyerPhone)}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 text-slate-700 hover:text-emerald-600 font-bold px-4 py-4 rounded-xl hover:bg-emerald-50"
                >
                  <Phone className="w-5 h-5" />
                  Buyer Portal
                </Link>
                <button
                  onClick={() => {
                    handleBuyerLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-slate-500 hover:text-red-600 font-bold px-4 py-4 rounded-xl hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
               </>
            ) : (
              <>
                <Link
                  href="/track"
                  onClick={() => setMenuOpen(false)}
                  className="block text-slate-700 hover:text-emerald-600 font-bold px-4 py-3 hover:bg-emerald-50 rounded-xl"
                >
                  Track Order
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-slate-700 hover:text-emerald-600 font-bold px-4 py-3 hover:bg-emerald-50 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-4 rounded-xl text-center font-bold shadow-soft w-full mx-2 mt-2"
                >
                  Start as Vendor
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}


'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const { user, vendor, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Safe<span className="text-emerald-400">Trade</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {vendor && (
                  <Link
                    href={`/vendor/${vendor.id}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : !loading ? (
              <Link
                href="/login"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
              >
                Get Started
              </Link>
            ) : null}
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4 space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 text-gray-300 hover:text-white px-3 py-3 rounded-lg hover:bg-white/5"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                {vendor && (
                  <Link
                    href={`/vendor/${vendor.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-300 hover:text-white px-3 py-3 rounded-lg hover:bg-white/5"
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
                  className="flex items-center gap-3 text-gray-400 hover:text-red-400 px-3 py-3 rounded-lg hover:bg-white/5 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block bg-emerald-500 text-white px-4 py-3 rounded-lg text-center font-medium"
              >
                Get Started
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

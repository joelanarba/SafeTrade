'use client';

import Link from 'next/link';
import { Shield, ArrowRight, Lock, CheckCircle, Banknote, TrendingUp, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [dealCount, setDealCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Animate count up
    const target = 1247; // Demo number, replace with real Firestore count
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setDealCount(target);
        clearInterval(timer);
      } else {
        setDealCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-20 pb-32 sm:pt-32 sm:pb-40">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className={`max-w-5xl mx-auto text-center relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 bg-emerald-400 rounded-full pulse-glow" />
            <span className="text-emerald-400 text-sm font-medium">Blockchain-Secured Escrow</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Stop Getting Scammed.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent animated-gradient">
              Start Trading Safely.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Buy from Instagram & WhatsApp vendors with confidence. Your money stays in escrow until
            you get your item. Protected by smart contract technology on the blockchain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              I&apos;m a Vendor — Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="text-gray-400 hover:text-white px-6 py-4 rounded-xl text-lg font-medium transition-colors hover:bg-white/5"
            >
              How It Works
            </a>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="glass rounded-xl p-4">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{dealCount.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500">Deals Secured</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-2xl sm:text-3xl font-bold text-white">₵0</p>
              <p className="text-xs sm:text-sm text-gray-500">Lost to Scams</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-2xl sm:text-3xl font-bold text-amber-400">4.8</p>
              <p className="text-xs sm:text-sm text-gray-500">Trust Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative px-4 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How SafeTrade{' '}
              <span className="text-emerald-400">Works</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Three simple steps to protect every transaction
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="glass rounded-2xl p-8 text-center group hover:bg-white/[0.04] transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="inline-flex items-center bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                STEP 1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Buyer Pays Into Escrow</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Instead of sending MoMo directly, the buyer pays through SafeTrade. Funds are locked
                in a blockchain smart contract and can&apos;t be touched.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass rounded-2xl p-8 text-center group hover:bg-white/[0.04] transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Banknote className="w-8 h-8 text-blue-400" />
              </div>
              <div className="inline-flex items-center bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                STEP 2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vendor Ships The Item</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The vendor is notified that payment is secured. They ship the item knowing the money
                is waiting for them once the buyer confirms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass rounded-2xl p-8 text-center group hover:bg-white/[0.04] transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-amber-400" />
              </div>
              <div className="inline-flex items-center bg-amber-500/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                STEP 3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Confirm & Release</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Buyer confirms they received the item. Funds are released to the vendor&apos;s MoMo.
                Both parties see a blockchain receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Blockchain Proof</h3>
                <p className="text-gray-400 text-sm">
                  Every transaction is recorded on the BNB Smart Chain. Both parties get a
                  transaction hash as immutable proof.
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Vendor Trust Scores</h3>
                <p className="text-gray-400 text-sm">
                  Every vendor builds a public trust score based on successful trades. Verified
                  vendors get a special badge after 10+ trades.
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">No Account Needed to Buy</h3>
                <p className="text-gray-400 text-sm">
                  Buyers pay with just a link — no signup required. Pay with card or Mobile Money
                  via Paystack.
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">72-Hour Auto-Release</h3>
                <p className="text-gray-400 text-sm">
                  If no dispute is raised within 72 hours, funds are automatically released to the
                  vendor. No friction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-24 sm:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 sm:p-16 glow-emerald">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Trade Safely?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join thousands of vendors who use SafeTrade to build trust with their customers.
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Create Your First Deal
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-gray-500">
              © 2026 SafeTrade Ghana. All rights reserved.
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Escrow secured on BNB Smart Chain Testnet
          </p>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-50 mesh-bg font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-32 sm:pt-40 sm:pb-48">
        <div className={`max-w-6xl mx-auto text-center relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2 mb-10 shadow-sm hover-lift">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full pulse-glow" />
            <span className="text-emerald-700 text-sm font-bold tracking-wide">Blockchain-Secured Escrow</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
            Stop Getting Scammed.<br />
            <span className="text-emerald-600">Start Trading Safely.</span>
          </h1>

          <p className="text-lg sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Buy from Instagram & WhatsApp vendors with total confidence. Your money stays securely in escrow until
            you receive your item. Protected by unbreakable smart contracts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all shadow-soft hover-lift w-full sm:w-auto"
            >
              I'm a Vendor — Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="group flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-10 py-5 rounded-2xl text-lg font-bold transition-all shadow-sm hover-lift w-full sm:w-auto"
            >
              How It Works
            </a>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-sm hover-lift">
              <p className="text-4xl sm:text-5xl font-black text-emerald-600 mb-2">{dealCount.toLocaleString()}</p>
              <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">Deals Secured</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-sm hover-lift">
              <p className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">₵0</p>
              <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">Lost to Scams</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-sm hover-lift">
              <p className="text-4xl sm:text-5xl font-black text-emerald-600 mb-2">4.8</p>
              <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">Average Trust Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative px-4 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              How SafeTrade <span className="text-emerald-600">Works</span>
            </h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium">
              Three simple steps to protect every social commerce transaction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-[2rem] p-10 text-center border-2 border-transparent hover:border-emerald-100 transition-all hover-lift">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Lock className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="inline-flex items-center text-emerald-600 text-sm font-black px-4 py-1.5 rounded-full mb-6 bg-emerald-50">
                STEP 1
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Buyer Pays Into Escrow</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Instead of sending MoMo directly to the vendor, pay through a secure SafeTrade link. Funds are locked in a smart contract.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-[2rem] p-10 text-center border-2 border-transparent hover:border-blue-100 transition-all hover-lift">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Banknote className="w-10 h-10 text-blue-600" />
              </div>
              <div className="inline-flex items-center text-blue-600 text-sm font-black px-4 py-1.5 rounded-full mb-6 bg-blue-50">
                STEP 2
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Vendor Ships Item</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                The vendor receives an instant notification that payment is secured. They safely ship the item, knowing the money is waiting.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-[2rem] p-10 text-center border-2 border-transparent hover:border-emerald-100 transition-all hover-lift">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="inline-flex items-center text-emerald-600 text-sm font-black px-4 py-1.5 rounded-full mb-6 bg-emerald-50">
                STEP 3
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Confirm & Release</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Once the item arrives, the buyer confirms delivery. Funds are automatically released to the vendor's Mobile Money account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative px-4 py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Built for <span className="text-emerald-600">Zero Trust</span>
            </h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium">
              We eliminated the risk so you don't have to worry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Immutable Blockchain Proof</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Every transaction is recorded on the BNB Smart Chain. Both buyers and sellers receive a verifiable transaction hash as absolute proof of funds.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Public Vendor Trust Scores</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Bad actors can't hide. Every vendor builds a public trust score based on successful, completed trades. Verified vendors receive a trust badge.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-8">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">No Buyer Account Needed</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Reduce friction. Buyers simply click your SafeTrade link, enter their address, and pay instantly with Mobile Money or cards via Paystack.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-8">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">72-Hour Auto-Release</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Vendors don't wait forever. If a buyer forgets to confirm and no dispute is raised within 72 hours, algorithms automatically release the funds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Massive CTA */}
      <section className="relative px-4 py-32 sm:py-48 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-slate-900 rounded-[3rem] p-12 sm:p-24 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Decorative background flare */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[150px] opacity-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20 pointer-events-none" />
            
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight relative z-10">
              Ready to Trade Safely?
            </h2>
            <p className="text-slate-300 text-xl sm:text-2xl mb-12 max-w-2xl mx-auto font-medium relative z-10">
              Join thousands of top vendors in Ghana who use SafeTrade to build ultimate trust with their customers.
            </p>
            <Link
              href="/login"
              className="relative z-10 group inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-10 py-5 rounded-2xl text-xl font-bold transition-all shadow-lg hover-lift"
            >
              Create Your First Deal
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 px-4 py-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span className="text-base font-bold text-slate-600">
              © 2026 SafeTrade Ghana. All rights reserved.
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            Powered by BNB Smart Chain
          </p>
        </div>
      </footer>
    </div>
  );
}

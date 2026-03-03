'use client';

import Link from 'next/link';
import { Shield, ArrowRight, Lock, CheckCircle, Banknote, TrendingUp, Users, Zap, Search, Star, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BlockchainTrustSection, BnbLogo } from '@/components/BnbChainBadge';
import { getTotalDealsCount } from '@/lib/firestore';
import Image from 'next/image';

export default function Home() {
  const [dealCount, setDealCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Fetch real deal count from Firestore
    getTotalDealsCount()
      .then((count) => {
        // Animate count up to real number
        const target = count;
        if (target === 0) return;
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
      })
      .catch((err) => {
        console.error('Failed to fetch deal count:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 mesh-bg font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-32 sm:pt-40 sm:pb-48">
        <div className={`max-w-6xl mx-auto text-center relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FEF9E7] border border-[#F3BA2F]/30 rounded-full px-5 py-2 mb-10 shadow-sm hover-lift">
            <BnbLogo className="w-4 h-4" />
            <span className="text-[#C99400] text-sm font-bold tracking-wide">Secured by BNB Smart Chain</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
            Build Trust. Sell More.<br />
            <span className="text-emerald-600">Never Lose a Deal to Doubt Again.</span>
          </h1>

          <p className="text-lg sm:text-2xl text-slate-600 max-w-4xl mx-auto mb-12 leading-relaxed font-medium">
            Social commerce in Ghana runs on Instagram and WhatsApp — but payments still run on blind trust. SafeTrade protects every transaction so your customers feel safe buying from you. No awkward "send MoMo first." No lost deals. No unnecessary risk.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all shadow-soft hover-lift w-full sm:w-auto"
            >
              I'm a Vendor — Start Securing My Sales
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
              <p className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">400+</p>
              <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">Vendors Protected</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-sm hover-lift">
              <p className="text-4xl sm:text-5xl font-black text-emerald-600 mb-2">4.8</p>
              <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">Average Trust Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Vendors Use SafeTrade */}
      <section className="relative px-4 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Why Vendors Use <span className="text-emerald-600">SafeTrade</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Increase Conversions</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Buyers hesitate when asked to send money upfront. SafeTrade removes that fear — more buyers complete checkout.
              </p>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-8">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Build Verified Reputation</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Every completed transaction increases your SafeTrade Trust Score. Show proof. Not promises.
              </p>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Protect Yourself From Fraud</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Funds are secured before you ship. No fake payment screenshots. No risky reversals.
              </p>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-10 sm:p-12 shadow-soft hover-lift border border-slate-100">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-8">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Stand Out From Competitors</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Two vendors. Same product. Only one offers protected payment. Guess who wins the sale?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative px-4 py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              How It <span className="text-emerald-600">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-100 hover:border-emerald-100 transition-all hover-lift shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-xl font-black">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Generate Secure Payment Link</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Create a SafeTrade deal in seconds and share the link in your Instagram or WhatsApp chat.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-100 hover:border-emerald-100 transition-all hover-lift shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-xl font-black">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Buyer Pays Securely</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Buyer pays via Mobile Money. Funds are locked in escrow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-100 hover:border-emerald-100 transition-all hover-lift shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-xl font-black">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Ship With Confidence</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                You ship knowing the money is secured.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-100 hover:border-emerald-100 transition-all hover-lift shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-xl font-black">
                4
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Delivery Confirmed. Funds Released.</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Buyer confirms receipt. Payment is instantly released. If a dispute occurs, SafeTrade steps in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Profile Section */}
      <section className="relative px-4 py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 lg:pr-12">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Public <span className="text-emerald-600">Trust Profiles</span>
            </h2>
            <p className="text-slate-600 text-xl font-medium leading-relaxed mb-8">
              Every vendor builds a visible trust score based on completed transactions, successful deliveries, and dispute history. Turn your good service into verifiable proof.
            </p>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Verified Sellers</h4>
                  <p className="text-slate-500">Stand out with a verified badge when you connect your credentials.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Transparent History</h4>
                  <p className="text-slate-500">Show buyers exactly how many successful trades you've completed.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 w-full max-w-md mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-blue-50 rounded-[3rem] transform rotate-3 scale-105"></div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl relative border border-slate-100">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  SP
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-slate-900">SneakerPlugGH</h3>
                    <Shield className="w-5 h-5 text-emerald-500" fill="currentColor" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                    Verified Seller
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <p className="text-3xl font-black text-slate-900 mb-1">324</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Transactions</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-6 h-6 text-amber-500" fill="currentColor" />
                    <p className="text-3xl font-black text-emerald-700">4.9</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Trust Score</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-red-800">Disputes Received</span>
                <span className="text-sm font-bold bg-white text-red-600 px-3 py-1 rounded-lg border border-red-200">2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Works With Section */}
      <section className="relative px-4 py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Designed for Social Commerce
          </h2>
          <p className="text-slate-600 text-xl font-medium leading-relaxed mb-12">
            Works seamlessly with Instagram, WhatsApp, and TikTok. No website required. No complex setup. Just safer transactions.
          </p>
          <div className="flex flex-wrap justify-center gap-6 opacity-70">
            {/* Simple logo placeholders styling to represent social platforms without custom SVGs */}
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-pink-600 font-bold text-lg">Instagram</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-green-500 font-bold text-lg">WhatsApp</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-900 font-bold text-lg">TikTok</span>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Trust Section */}
      <BlockchainTrustSection />

      {/* Massive CTA */}
      <section className="relative px-4 py-32 sm:py-48 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-slate-900 rounded-[3rem] p-12 sm:p-24 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Decorative background flare */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[150px] opacity-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20 pointer-events-none" />
            
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight relative z-10">
              Ready to Sell With Confidence?
            </h2>
            <p className="text-slate-300 text-xl sm:text-2xl mb-12 max-w-2xl mx-auto font-medium relative z-10">
              Join vendors across Ghana who refuse to lose sales because of trust issues.
            </p>
            <div className="flex flex-col items-center gap-6 relative z-10">
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-10 py-5 rounded-2xl text-xl font-bold transition-all shadow-lg hover-lift"
              >
                Create Your First SafeTrade Deal
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-slate-400 font-medium text-sm">
                Buying from a vendor? Ask them to send you a SafeTrade link.
              </p>
            </div>
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
          <a
            href="https://testnet.bscscan.com/address/0xF246Ed2E6832768df984150aE3dbb860819bED8D"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:border-[#F3BA2F]/30 hover:bg-[#FEF9E7] hover:text-[#C99400] transition-all"
          >
            <BnbLogo className="w-4 h-4" />
            Powered by BNB Smart Chain
          </a>
        </div>
      </footer>
    </div>
  );
}

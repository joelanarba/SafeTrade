'use client';

import Link from 'next/link';
import { Shield, Lock, Users, Star, CheckCircle, ArrowRight, CheckCircle2, Circle, Check, Zap, Smartphone, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BlockchainTrustSection, BnbLogo } from '@/components/BnbChainBadge';
import { getTotalDealsCount } from '@/lib/firestore';
import { Logo } from '@/components/Logo';

// Data for the rotating hero animations
const HERO_CATEGORIES = [
  {
    title: 'Complete protection for merchandise transactions',
    graphicColor: 'bg-emerald-100/50 border border-emerald-200', // SafeTrade Mint
    icon: <ShoppingBag className="w-12 h-12 text-emerald-600" strokeWidth={2.5} />
  },
  {
    title: 'Complete protection for social commerce sales',
    graphicColor: 'bg-amber-100/50 border border-amber-200', // Yellow
    icon: <Smartphone className="w-12 h-12 text-amber-500" strokeWidth={2.5} />
  },
  {
    title: 'Complete protection for service agreements',
    graphicColor: 'bg-blue-100/50 border border-blue-200', // Light Blue
    icon: <Zap className="w-12 h-12 text-blue-500" strokeWidth={2.5} />
  }
];

const TRANSACTION_STEPS = [
  'Buyer and seller agree on terms',
  'Buyer pays SafeTrade.GH',
  'Seller ships the merchandise',
  'Buyer inspects & approves goods',
  'SafeTrade.GH pays the seller',
  'If a dispute occurs, SafeTrade steps in to review evidence and resolve fairly.'
];

export default function Home() {
  const [dealCount, setDealCount] = useState(0);
  
  // Animation state for the Hero 5-steps
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Escrow.com style animation cycle
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= TRANSACTION_STEPS.length - 1) {
          setTimeout(() => {
            setActiveCategory((cat) => (cat + 1) % HERO_CATEGORIES.length);
            setActiveStep(0);
          }, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // 2 seconds per step

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    // Fetch real deal count from Firestore
    getTotalDealsCount()
      .then((count) => {
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
      .catch((err) => console.error('Failed to fetch:', err));
  }, []);

  const currentCategoryInfo = HERO_CATEGORIES[activeCategory];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600">
      
      {/* Hero Section using Native Light App Colors */}
      <section className="relative px-4 pt-[100px] pb-16 lg:pt-[120px] lg:pb-24 bg-slate-50 overflow-hidden">
        
        {/* Subtle Background sweeps representing SafeTrade's aesthetic */}
        <div className="absolute right-0 top-0 w-full h-[100%] bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08)_0%,transparent_50%)] pointer-events-none z-0"></div>

        <div className="max-w-[1240px] mx-auto relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left Column (Static Value Prop & Form) */}
          <div className="relative z-20">
            <h1 className="text-[42px] md:text-[52px] font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
              Build Trust. Sell More. Never Lose a Deal to Doubt Again.
            </h1>
            
            <p className="text-[18px] md:text-[20px] text-slate-600 font-medium leading-[1.5] mb-10 max-w-[520px]">
              Social commerce in Ghana runs on Instagram and WhatsApp — but payments still run on blind trust. SafeTrade protects every transaction so your customers feel safe buying from you.
            </p>

            {/* Escrow-style Interactive Form Box aligned with app aesthetics */}
            <div className="bg-transparent mb-6 max-w-[540px]">
              <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-5 text-slate-800 font-sans overflow-hidden border border-slate-200/60 hover-lift">
                {/* Row 1 */}
                <div className="flex flex-col sm:flex-row border-b border-slate-100">
                  <div className="flex items-center cursor-pointer hover:bg-slate-50 flex-[0.35] p-5 border-r border-slate-100 transition-colors">
                    <span className="text-[17px] mr-1 text-slate-500">I'm</span>
                    <span className="text-[17px] font-bold text-slate-900 mr-auto">Selling</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  <div className="flex flex-1 items-center px-5 py-4 min-h-[56px]">
                    <span className="text-[17px] text-slate-400">Shoes, iPhones, clothes...</span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col sm:flex-row">
                  <div className="flex items-center flex-[0.65] px-5 py-4 border-r border-slate-100 transition-colors focus-within:bg-emerald-50/50">
                    <span className="text-[17px] text-slate-500 mr-2 font-medium">for ₵</span>
                    <input type="text" defaultValue="500" className="text-[19px] font-bold text-slate-900 flex-1 outline-none bg-transparent" />
                  </div>
                  <div className="flex items-center cursor-pointer hover:bg-slate-50 flex-[0.35] px-5 py-4 transition-colors">
                    {/* Tiny Ghana Flag representation */}
                    <div className="w-5 h-3.5 mr-2 flex flex-col shadow-sm border border-slate-200 overflow-hidden rounded-[2px]">
                       <div className="h-[33.3%] w-full bg-[#ce1126]"></div>
                       <div className="h-[33.3%] w-full bg-[#fcd116] flex items-center justify-center"><Star className="w-1.5 h-1.5 text-black" fill="black" /></div>
                       <div className="h-[33.3%] w-full bg-[#006b3f]"></div>
                    </div>
                    <span className="text-[17px] font-bold mr-auto tracking-wide text-slate-900">GHS</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                </div>
              </div>
              
              <Link
                href="/login"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 hover-lift text-white text-[17px] font-bold py-4 px-8 rounded-xl text-center shadow-emerald-500/20 shadow-lg"
              >
                Get started now
              </Link>
            </div>
          </div>

          {/* Right Column (Animated Switcher & 5-Steps) */}
          <div className="relative z-20 flex flex-col items-start lg:pl-10">
            
            {/* Swapping Graphic Element & Dynamic Headline */}
            <div className="flex items-center gap-5 mb-8 lg:mt-0">
              <div className="relative w-[80px] h-[80px] transition-transform duration-500 hover:scale-105 shrink-0">
                 {/* Decorative outer rings */}
                 <div className={`absolute inset-0 rounded-full ${currentCategoryInfo.graphicColor} opacity-50 -z-20 scale-[1.3] transition-colors duration-700`}></div>
                 {/* The actual colored circle graphic */}
                 <div className={`w-full h-full rounded-full ${currentCategoryInfo.graphicColor} flex items-center justify-center shadow-sm transition-colors duration-700 bg-white`}>
                    {currentCategoryInfo.icon}
                 </div>
              </div>
              
              <h2 className="text-[20px] md:text-[24px] font-black text-slate-900 leading-[1.2] transition-opacity duration-300 tracking-tight max-w-[280px]">
                {currentCategoryInfo.title}
              </h2>
            </div>

            {/* The Animated 5 Step List with Progress Line */}
            <div className="relative ml-2 md:ml-6 pl-10 h-[300px]">
              {/* Vertical Progress Line Track */}
              <div className="absolute left-[13px] top-6 bottom-6 w-[2px] bg-slate-200/80 rounded-full"></div>
              
              {/* Active Progress Bar Fill */}
              <div 
                className="absolute left-[13px] top-6 w-[2px] bg-emerald-500 rounded-full transition-all duration-500"
                style={{ height: `calc(${(activeStep / (TRANSACTION_STEPS.length - 1)) * 100}% - 24px)` }}
              ></div>

              <ul className="space-y-6 relative z-10 w-full py-4">
                {TRANSACTION_STEPS.map((text, index) => {
                  
                  // Active Step Styling
                  if (index === activeStep) {
                    return (
                      <li key={index} className="flex items-center gap-5 transition-all duration-300 relative group min-h-[28px]">
                        <div className="absolute left-[-42px] top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_0_4px_rgba(16,185,129,0.2)] z-10">
                           <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        </div>
                        <span className="text-[17px] md:text-[19px] text-slate-900 font-bold tracking-tight">{text}</span>
                      </li>
                    );
                  }
                  
                  // Completed Steps Styling
                  if (index < activeStep) {
                    return (
                      <li key={index} className="flex items-center gap-5 transition-all duration-300 relative min-h-[28px]">
                        <div className="absolute left-[-42px] top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                        </div>
                        <span className="text-[15px] md:text-[17px] text-slate-500 font-medium">{text}</span>
                      </li>
                    );
                  }

                  // Future Steps Styling
                  return (
                    <li key={index} className="flex items-center gap-5 transition-all duration-300 relative min-h-[28px]">
                      <div className="absolute left-[-38px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-300 rounded-full z-10"></div>
                      <span className="text-[15px] md:text-[17px] text-slate-400 font-medium">{text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Why Vendors Use SafeTrade */}
      <section className="relative px-4 py-16 lg:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto">
          
          <div className="text-center mb-20 lg:mb-24">
            <h2 className="text-[32px] md:text-[40px] font-black text-slate-900 mb-4 tracking-tight">Over {dealCount?.toLocaleString()} protected</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            <div className="text-center px-4 hover-lift">
              <div className="w-20 h-20 mx-auto mb-8 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-600" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-4">Increase Conversions</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Buyers hesitate when asked to send money upfront. SafeTrade removes that fear — more buyers complete checkout.
              </p>
            </div>

            <div className="text-center px-4 hover-lift">
              <div className="w-20 h-20 mx-auto mb-8 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Star className="w-10 h-10 text-amber-500" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-4">Build Reputation</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Every completed transaction increases your Trust Score. Show proof. Not promises.
              </p>
            </div>

            <div className="text-center px-4 hover-lift">
              <div className="w-20 h-20 mx-auto mb-8 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Lock className="w-10 h-10 text-blue-600" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-4">Fraud Protection</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Funds are secured before you ship. No fake payment screenshots. No risky reversals.
              </p>
            </div>

            <div className="text-center px-4 hover-lift">
              <div className="w-20 h-20 mx-auto mb-8 bg-purple-50 rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10 text-purple-600" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-4">Stand Out</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Two vendors. Same product. Only one offers protected payment. Guess who wins the sale?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Profile Section */}
      <section className="relative px-4 py-16 lg:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-[1240px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[36px] font-black text-slate-900 mb-6 tracking-tight">Public Trust Profiles</h2>
            <p className="text-[18px] text-slate-600 mb-8 leading-relaxed max-w-[500px] font-medium">
              Every vendor builds a visible trust score based on completed transactions, successful deliveries, and dispute history. Turn your good service into verifiable proof.
            </p>
            
            <Link href="/login" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
              Learn more about verified sellers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 shadow-soft border border-slate-100 transition-transform hover:-translate-y-2 duration-500">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-50">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  SP
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <h3 className="text-[20px] font-bold text-slate-900">SneakerPlugGH</h3>
                    <CheckCircle className="w-5 h-5 text-emerald-500" fill="currentColor" stroke="white" />
                  </div>
                  <span className="text-emerald-700 text-[11px] font-bold uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md">
                    Verified Seller
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[36px] font-black text-slate-900 mb-1">{dealCount || 324}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Transactions</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <p className="text-[36px] font-black text-slate-900">4.9</p>
                    <Star className="w-6 h-6 text-amber-400" fill="currentColor" stroke="none" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Trust Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Trust Section */}
      <BlockchainTrustSection />

      {/* Works With — Payment Providers */}
      <section className="relative px-4 py-12 lg:py-16 bg-white border-t border-slate-100">
        <div className="max-w-[800px] mx-auto text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Works With</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFCC00]/10 text-[#CC9900] border border-[#FFCC00]/20 rounded-full text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FFCC00]" />
              MTN MoMo
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Vodafone Cash
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              AirtelTigo Money
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900/5 text-slate-700 border border-slate-900/10 rounded-full text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              Visa / Mastercard
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-5">
            All payments processed securely through Paystack. Funds held in BNB Chain escrow until delivery is confirmed.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative px-4 py-16 lg:py-20 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="text-[40px] md:text-[52px] font-black text-white mb-6 tracking-tight leading-tight">
            Ready to Sell With Confidence?
          </h2>
          <p className="text-[19px] text-slate-300 font-medium mb-12 max-w-2xl mx-auto">
            Join vendors across Ghana who refuse to lose sales because of trust issues. Buying from a vendor? Ask them to send you a SafeTrade link.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl text-[18px] font-bold transition-all shadow-emerald-500/20 shadow-lg hover-lift inline-flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Create Your First SafeTrade Deal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white px-4 py-10 border-t border-slate-100">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <Logo variant="light" className="h-8 w-auto" />
            <span className="text-[14px] font-bold text-slate-500 md:border-l md:border-slate-200 md:pl-6">
              © 2026 SafeTrade Ghana. All rights reserved.
            </span>
          </div>
          <a
            href="https://testnet.bscscan.com/address/0xF246Ed2E6832768df984150aE3dbb860819bED8D"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl"
          >
            <BnbLogo className="w-4 h-4" />
            Powered by BNB Smart Chain
          </a>
        </div>
      </footer>
    </div>
  );
}

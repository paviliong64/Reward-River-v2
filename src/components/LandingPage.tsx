import React, { useState, useEffect } from 'react';
import { UsdtQuote, PublicMetrics } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Globe2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Layers,
  Sparkles,
  BarChart3,
  Users,
  Briefcase,
  ExternalLink,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  usdtQuote: UsdtQuote | null;
  onGetStarted: () => void;
  onOpenLegal: (page: string) => void;
  onSelectRoleSignup?: (role: 'user' | 'advertiser') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  usdtQuote,
  onGetStarted,
  onOpenLegal,
  onSelectRoleSignup
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [metrics, setMetrics] = useState<PublicMetrics>({
    registeredWorkers: 1949,
    registeredAdvertisers: 48,
    activeTasksCount: 5,
    offerwallOptionsCount: 3,
    completedTasksCount: 342,
    platformFeePercent: 10,
    pointsRatePerUsd: 10000
  });

  useEffect(() => {
    fetch('/api/public/metrics')
      .then(res => res.json())
      .then(data => {
        if (data.registeredWorkers) setMetrics(data);
      })
      .catch(() => {});
  }, []);

  const faqs = [
    {
      q: 'How does earning on Reward River work?',
      a: 'Registered workers can earn Points by completing advertiser micro-tasks (app installs, sign-ups, social actions) and participating in our Direct Partner Streams (consumer research surveys, verified app installs, and interactive sponsor tasks). 10,000 Points equals $1.00 USDT wallet value.'
    },
    {
      q: 'How are micro-tasks verified and approved?',
      a: 'When you complete a task, you submit the required structured proof (such as a username, reference ID, or screenshot link). The campaign advertiser and system moderation review the proof. Once approved, the reward points immediately credit to your available balance.'
    },
    {
      q: 'How do advertisers launch campaigns and fund their budget?',
      a: 'Advertisers deposit funds (via FaucetPay or USDT). When creating a task campaign, you specify the target worker slots and reward points. The exact user reward budget and 10% platform fee are reserved upfront so campaign accounting stays completely reconciled. Unused budget from paused campaigns is safely released.'
    },
    {
      q: 'Which withdrawal methods are supported?',
      a: 'We support pure Tether USD (USDT) on both TRON (TRC-20) and Ethereum (ERC-20), as well as FaucetPay micropayments. Minimum payout starts at only $5.00 (50,000 Points).'
    },
    {
      q: 'Can a user complete the same task twice?',
      a: 'By default, each account can complete an advertiser task only once to guarantee genuine unique engagement for advertisers.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-100 py-2.5 px-4 text-xs font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold">Reward River • Micro-Task & Offerwall Marketplace</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-xs">
            <span>Points Exchange: <strong className="text-white">10,000 Points = $1.00 USDT</strong></span>
            <span className="text-emerald-400 font-semibold">TRC-20 & ERC-20 Verified</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Verified Micro-Task & Offerwall Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Earn. Complete.{' '}
              <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
                Get Rewarded.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              A premium micro-task and direct survey network. Complete tasks and partner streams to earn USDT, or launch targeted campaigns with verified human engagement.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (onSelectRoleSignup) onSelectRoleSignup('user');
                  else onGetStarted();
                }}
                className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2"
              >
                Start Earning Rewards
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (onSelectRoleSignup) onSelectRoleSignup('advertiser');
                  else onGetStarted();
                }}
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2"
              >
                Launch Campaign
              </button>
            </div>

            {/* Trust Row */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> 10,000 Points = $1.00 USDT
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Structured Proof Verification
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Transparent 10% Platform Fee
              </span>
            </div>
          </div>

          {/* How Earning Works Card Panel (JobsWorkTech Layout) */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-extrabold text-sm uppercase tracking-wider text-sky-400">
                How Earning Works
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Network
              </span>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 font-black text-sm flex items-center justify-center shrink-0 border border-sky-400/30">
                01
              </span>
              <div>
                <strong className="block text-slate-100 text-sm">Choose work</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  Open an eligible micro-task, app test, or rewarded survey.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 font-black text-sm flex items-center justify-center shrink-0 border border-sky-400/30">
                02
              </span>
              <div>
                <strong className="block text-slate-100 text-sm">Complete & prove</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow instructions and submit your required text or screenshot proof.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 font-black text-sm flex items-center justify-center shrink-0 border border-sky-400/30">
                03
              </span>
              <div>
                <strong className="block text-slate-100 text-sm">Get credited</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  Approved rewards move immediately to your available Points balance.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Points Rate</span>
                <span className="text-lg font-black text-sky-400">10,000 Points</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  = $1.00 USDT Value
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Marketplace Statistics (JobsWorkTech 6 Metrics) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block">12</span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">Users online now</span>
            <small className="text-[10px] text-slate-400 block mt-0.5">Active in last 10m</small>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-sky-600 block">
              {metrics.registeredWorkers.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">Registered workers</span>
            <small className="text-[10px] text-slate-400 block mt-0.5">Active worker accounts</small>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block">
              {metrics.activeTasksCount}
            </span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">Active tasks</span>
            <small className="text-[10px] text-slate-400 block mt-0.5">Live campaigns</small>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-indigo-600 block">3</span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">Offerwall options</span>
            <small className="text-[10px] text-slate-400 block mt-0.5">CPX, Aoyco, AdvertsReward</small>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 block">
              {metrics.completedTasksCount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">Completed tasks</span>
            <small className="text-[10px] text-slate-400 block mt-0.5">Approved submissions</small>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block">
              {metrics.platformFeePercent}%
            </span>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">Advertiser fee</span>
            <small className="text-[10px] text-slate-400 block mt-0.5">Platform rate</small>
          </div>
        </div>
      </section>

      {/* Offerwalls Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-indigo-900/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Reward River Direct Streams
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Direct Earning Streams & Instant Rewards.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Direct Streams give registered workers endless ways to earn Points by completing verified consumer opinion surveys, sponsored mobile app milestones, and interactive tasks. Rewards are verified and credited directly to your wallet in real-time.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">✓ Direct Research Surveys</span>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">✓ App Lab & Games</span>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">✓ Interactive Sponsor Ads</span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                OW
              </div>
              <strong className="block text-base font-bold text-white">
                Verified S2S Reward Tracking
              </strong>
              <p className="text-xs text-slate-300 leading-relaxed">
                Each conversion is checked against its transaction ID and security signature. Duplicate callbacks are blocked and reversals are handled cleanly in the ledger.
              </p>
              <button
                onClick={onGetStarted}
                className="mt-3 w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Register & Start Earning
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* For Advertisers Section (Campaign Cost Calculator) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                For Advertisers
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Launch campaigns with a balance you can actually reconcile.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Create a task in Points, choose the number of workers, and see the exact campaign cost before funding it. Worker budget is reserved separately from the platform fee, so available, reserved and spent funds stay easy to understand.
              </p>
              <div className="space-y-2 text-xs text-slate-700 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>User receives the full advertised task reward</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Platform fee is added separately at 10%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unused eligible worker budget can be released safely</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Finance & Billing view tracks deposits, spend, fees and releases</span>
                </div>
              </div>
            </div>

            {/* Example Campaign Cost Card (JobsWorkTech Layout) */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-baseline pb-2 border-b border-slate-800">
                <strong className="text-sm text-sky-400 font-bold">Example Campaign Cost</strong>
                <small className="text-[11px] text-slate-400">Platform fee 10%</small>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Reward per worker</span>
                <span className="font-bold">1,000 Points</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Workers</span>
                <span className="font-bold">500</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">User reward budget</span>
                <span className="font-bold">500,000 Points</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Platform fee (10%)</span>
                <span className="font-bold">50,000 Points</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-slate-200 text-sm">Total advertiser cost</span>
                <div className="text-right">
                  <span className="font-black text-base text-sky-400">550,000 Points</span>
                  <span className="block text-[11px] text-slate-400">≈ $55.00 USDT</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectRoleSignup) onSelectRoleSignup('advertiser');
                  else onGetStarted();
                }}
                className="mt-3 w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Create Advertiser Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need to know about working, advertising, and payouts.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm sm:text-base hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-sky-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Get Started Now
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              One unified platform to earn and grow.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Create the account that fits your goals and manage everything from a fast, responsive dashboard.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (onSelectRoleSignup) onSelectRoleSignup('user');
                else onGetStarted();
              }}
              className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Start Earning Rewards
            </button>
            <button
              onClick={() => {
                if (onSelectRoleSignup) onSelectRoleSignup('advertiser');
                else onGetStarted();
              }}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition border border-white/20"
            >
              Launch Campaigns
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

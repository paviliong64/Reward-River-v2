import React, { useState } from 'react';
import { OfferwallItem, UsdtQuote } from '../types';
import {
  ExternalLink,
  ShieldCheck,
  Zap,
  Gift,
  CheckCircle,
  HelpCircle,
  Maximize2,
  X,
  Sparkles,
  ArrowRight,
  Lock,
  Coins
} from 'lucide-react';

interface OfferwallsViewProps {
  offerwalls: OfferwallItem[];
  onRefresh: () => void;
  usdtQuote: UsdtQuote | null;
}

export function OfferwallsView({ offerwalls, onRefresh, usdtQuote }: OfferwallsViewProps) {
  const [activeFrameUrl, setActiveFrameUrl] = useState<string | null>(null);
  const [activeWallTitle, setActiveWallTitle] = useState<string>('');

  const handleLaunchWall = (wall: OfferwallItem) => {
    setActiveWallTitle(wall.name);
    setActiveFrameUrl(wall.launchUrl);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            Reward River Direct Gateway • Verified Streams
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Direct Tasks, Surveys & Instant Ads
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Earn Points continuously through Reward River's direct partner integrations. Complete sponsored mobile apps, high-yield consumer surveys, and direct interactive ads. All rewards are credited immediately to your balance and redeemable in USDT.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 10,000 Points = $1.00 USDT
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Direct Server-to-Server Instant Credit
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-400" /> SSL Encrypted Gateway
            </span>
          </div>
        </div>
      </div>

      {/* Offerwalls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offerwalls.map(wall => (
          <div
            key={wall.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-xl transition-all duration-200 group"
          >
            <div>
              {/* Badge & Category */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  {wall.icon || 'RR'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  {wall.badge || 'Reward River Direct'}
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                {wall.name}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                {wall.tagline || 'Direct High-Yield Earning Stream'}
              </p>

              {/* Description */}
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {wall.description}
              </p>

              {/* Pills / Features */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(wall.pills || ['Direct S2S Credit', 'Instant Points', 'Verified Safe']).map((pill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600"
                  >
                    ✓ {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {wall.category || 'Direct Tasks'}
              </span>
              <button
                onClick={() => handleLaunchWall(wall)}
                className="px-4 py-2 bg-slate-900 group-hover:bg-sky-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                Open Direct Stream <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-sky-500" />
          How Reward River Direct Earning Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center mb-2">
              1
            </span>
            <strong className="block text-slate-800 text-sm mb-1">Select Any Direct Stream</strong>
            Choose from surveys, mobile games, trial offers, or fast interactive sponsor tasks matching your preferences.
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center mb-2">
              2
            </span>
            <strong className="block text-slate-800 text-sm mb-1">Complete Direct Goal</strong>
            Fulfill the clear instructions (e.g., complete demographic questions, reach game milestone, or engage with sponsor).
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center mb-2">
              3
            </span>
            <strong className="block text-slate-800 text-sm mb-1">Instant Wallet Credit</strong>
            The verified direct postback triggers immediately. Points land directly in your wallet, ready for seamless USDT withdrawal.
          </div>
        </div>
      </div>

      {/* Embedded Direct Gateway Modal */}
      {activeFrameUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in duration-200">
          {/* Top Control Bar with Reward River Direct Branding */}
          <div className="bg-slate-900 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between border-b border-slate-800 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-extrabold text-sm text-sky-400 flex items-center gap-1.5">
                  Reward River Direct Gateway • {activeWallTitle}
                </div>
                <div className="text-[10px] text-slate-400">
                  RR-VERIFIED-STREAM • Instant Server-to-Server Sync
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={activeFrameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-300 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition"
              >
                Open in Full Window <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setActiveFrameUrl(null);
                  onRefresh();
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-600 rounded-lg transition"
                title="Close and Sync Wallet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* IFrame Container */}
          <div className="flex-1 bg-white rounded-b-2xl overflow-hidden relative shadow-2xl">
            <iframe
              src={activeFrameUrl}
              title={activeWallTitle}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
            />
          </div>
        </div>
      )}
    </div>
  );
}


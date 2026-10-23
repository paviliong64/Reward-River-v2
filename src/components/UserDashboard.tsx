import React from 'react';
import { User, UserBalances, UsdtQuote, LedgerEntry, Withdrawal } from '../types';
import { usdCentsToUsdt } from '../utils/usdt';
import {
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface UserDashboardProps {
  user: User;
  balances: UserBalances | null;
  usdtQuote: UsdtQuote | null;
  recentLedger: LedgerEntry[];
  recentWithdrawals: Withdrawal[];
  onSelectTab?: (tab: string) => void;
  onNavigateTab?: (tab: string) => void;
  onVerifyEmail: () => void;
  surveys?: any[];
  surveysLoading?: boolean;
  onStartSurvey?: (survey: any) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  balances,
  recentLedger,
  onSelectTab,
  onNavigateTab
}) => {
  const navigate = onSelectTab || onNavigateTab || (() => {});
  const availableCents = balances?.availableCents ?? 0;
  const pendingCents = balances?.pendingCents ?? 0;
  const totalEarnedCents = balances?.totalEarnedCents ?? 0;
  const totalWithdrawnCents = balances?.totalWithdrawnCents ?? 0;

  const availableUsdt = usdCentsToUsdt(availableCents).toFixed(2);
  const pendingUsdt = usdCentsToUsdt(pendingCents).toFixed(2);
  const availablePoints = (availableCents * 100).toLocaleString();
  const pendingPoints = (pendingCents * 100).toLocaleString();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Stats Overview (3 Harmonious Equal-Height Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Available Withdrawable Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-sky-400">
                Available Withdrawable Balance
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                10k Pts = $1.00 USDT
              </span>
            </div>

            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                  {availablePoints}
                </span>
                <span className="text-sm font-bold text-sky-400">Points</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-mono text-sm font-bold">
                <span className="text-emerald-300 font-black">₮</span>
                <span>≈ {availableUsdt} USDT</span>
                <span className="text-slate-400 text-xs font-sans font-normal ml-1">
                  (1:1 USD Peg)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => navigate('withdraw')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-emerald-900/30"
            >
              Withdraw USDT
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('tasks')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-sky-900/30"
            >
              Marketplace Tasks
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Pending Verification
              </span>
              <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Clock className="w-4 h-4" />
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {pendingPoints}
                </span>
                <span className="text-xs font-bold text-slate-400">Pts</span>
              </div>
              <p className="text-xs text-amber-600 font-mono font-bold mt-1">
                ≈ {pendingUsdt} USDT pending credit
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Points are credited to your withdrawable balance once advertiser proof verification or survey postback completes.
            </p>
          </div>
        </div>

        {/* Card 3: Total Confirmed & Lifetime Withdrawn */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Lifetime Confirmed
              </span>
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  ${(totalEarnedCents / 100).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">USDT</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <span>Withdrawn to date:</span>
                <span className="font-bold text-emerald-600 font-mono">${(totalWithdrawnCents / 100).toFixed(2)} USDT</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Verified Ledger Events:</span>
            <span className="font-extrabold text-slate-900 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
              {recentLedger.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Hub (4 Clean, Responsive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <button
          onClick={() => navigate('tasks')}
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-lg transition-all duration-200 text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              Active
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
            Micro-Tasks Marketplace
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            App installs, social follows, web sign-ups, and review campaigns with rapid proof approval.
          </p>
        </button>

        <button
          onClick={() => navigate('surveys')}
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-lg transition-all duration-200 text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
              High Yield
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1 group-hover:text-violet-600 transition-colors">
            Direct Streams & Surveys
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Access white-labeled surveys, game offers, and partner streams with instant crediting.
          </p>
        </button>

        <button
          onClick={() => navigate('withdraw')}
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Instant
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
            Withdraw USDT
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fast on-chain settlement directly to your TRON (TRC-20) or Ethereum (ERC-20) crypto wallet.
          </p>
        </button>

        <button
          onClick={() => navigate('transactions')}
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all duration-200 text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Audit
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1 group-hover:text-slate-900 transition-colors">
            Transaction History
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Complete cryptographic audit trail of all task bonuses, completions, and payouts.
          </p>
        </button>
      </div>

      {/* Recent Ledger Activity */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">Recent Account Activity</h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">• Live Statement</span>
          </div>
          <button
            onClick={() => navigate('transactions')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
          >
            <span>View Full Ledger</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentLedger.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600 mb-1">No transactions recorded yet</p>
            <p className="text-xs text-slate-400 mb-4">Start your first marketplace task or explore a direct stream to earn rewards.</p>
            <button
              onClick={() => navigate('tasks')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs"
            >
              Browse Active Tasks
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLedger.slice(0, 6).map(entry => (
              <div key={entry.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    +₮
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                      {entry.description || 'Reward Credit'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-emerald-600 font-mono text-xs sm:text-sm block">
                    +{(entry.amountCents * 100).toLocaleString()} Pts
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    +${(entry.amountCents / 100).toFixed(2)} USDT
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

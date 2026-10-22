import React from 'react';
import { User, UserBalances, UsdtQuote, LedgerEntry, Withdrawal } from '../types';
import { usdCentsToUsdt } from '../utils/usdt';
import {
  Coins,
  ArrowUpRight,
  ClipboardList,
  Receipt,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Gift
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
  usdtQuote,
  recentLedger,
  recentWithdrawals,
  onSelectTab,
  onNavigateTab,
  onVerifyEmail
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
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome & Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Available Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
              Available Withdrawable Balance
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              10,000 Pts = $1.00 USDT
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                {availablePoints}
              </span>
              <span className="text-sm font-bold text-sky-400">Points</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-emerald-400 font-mono text-sm font-bold">
              <span className="text-emerald-500">₮</span>
              <span>≈ {availableUsdt} USDT</span>
              <span className="text-slate-400 text-xs font-sans font-normal">
                (Pure 1:1 USD Peg)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => navigate('withdraw')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              Withdraw USDT
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('tasks')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              Marketplace Tasks
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('surveys')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            >
              Direct Streams
              <ClipboardList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pending Rewards Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {pendingPoints} <span className="text-xs font-bold text-slate-400">Pts</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              ≈ {pendingUsdt} USDT
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            Awaiting advertiser or survey review validation.
          </p>
        </div>

        {/* Lifetime Confirmed & Paid Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Earned</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              ${(totalEarnedCents / 100).toFixed(2)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Withdrawn:</span>
              <span className="font-bold text-slate-700">${(totalWithdrawnCents / 100).toFixed(2)} USDT</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-4 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Ledger Transactions:</span>
            <span className="font-bold text-slate-900">{recentLedger.length}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('tasks')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Micro-Tasks Marketplace</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse advertiser tasks: app downloads, social follows, reviews and sign-ups.
          </p>
        </button>

        <button
          onClick={() => navigate('surveys')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Direct Streams & Surveys</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Access high-yield surveys, mobile apps, and instant sponsor tasks with direct Reward River crediting.
          </p>
        </button>

        <button
          onClick={() => navigate('withdraw')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Withdraw USDT</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instant on-chain settlement on TRON (TRC-20) or Ethereum (ERC-20).
          </p>
        </button>

        <button
          onClick={() => navigate('transactions')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Receipt className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Transaction History</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Full audit log of task credits, offerwall bonuses, and withdrawal events.
          </p>
        </button>
      </div>

      {/* Recent Ledger Activity */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Account Activity</h3>
          <button
            onClick={() => navigate('transactions')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            View Full Ledger <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLedger.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No activity recorded yet. Start a task or open an offerwall to earn your first reward.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLedger.map(entry => (
              <div key={entry.id} className="p-4 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {entry.description || 'Reward Credit'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 font-mono">
                    +{(entry.amountCents * 100).toLocaleString()} Pts
                  </span>
                  <span className="text-xs text-slate-400 block font-mono">
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

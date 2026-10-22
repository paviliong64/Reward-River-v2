import React, { useState } from 'react';
import { Logo } from './Logo';
import { User, UserBalances, UsdtQuote } from '../types';
import { usdCentsToUsdt } from '../utils/usdt';
import {
  LayoutDashboard,
  ClipboardList,
  Coins,
  ArrowUpRight,
  Receipt,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Briefcase,
  Layers,
  PlusCircle,
  CheckSquare,
  Wallet,
  Repeat
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  balances: UserBalances | null;
  usdtQuote: UsdtQuote | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
  onOpenLegal: (page: string) => void;
  onSwitchRole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  balances,
  currentTab,
  onSelectTab,
  onOpenAuth,
  onSignOut,
  onSwitchRole
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const availableCents = balances?.availableCents ?? 0;
  const usdtAmount = usdCentsToUsdt(availableCents).toFixed(2);
  const pointsAmount = (availableCents * 100).toLocaleString(); // 10,000 Points = $1 (100 pts / cent)

  const isAdvertiser = user?.role === 'advertiser';
  const isAdmin = user?.role === 'admin';

  // Worker Nav Items
  const workerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: Layers },
    { id: 'surveys', label: 'Direct Streams', icon: ClipboardList },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Advertiser Nav Items
  const advertiserNavItems = [
    { id: 'advertiser', label: 'Campaigns', icon: Briefcase },
    { id: 'advertiser-create', label: 'Create Task', icon: PlusCircle },
    { id: 'advertiser-proofs', label: 'Review Proofs', icon: CheckSquare },
    { id: 'advertiser-billing', label: 'Billing & Deposits', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const navItems = isAdvertiser ? advertiserNavItems : workerNavItems;

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldCheck });
  }

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Mode Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => handleNavClick(user ? (isAdvertiser ? 'advertiser' : 'dashboard') : 'landing')}
              className="text-left focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-lg p-1"
              aria-label="Reward River Home"
            >
              <Logo size="md" showTagline={!user} />
            </button>

            {/* Injazify Studios & Rayan Mirza Architectural Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500">
              <span className="text-slate-400">By</span>
              <a
                href="https://injazify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-700 hover:text-sky-600 transition-colors"
                title="Injazify Studios Official Website"
              >
                Injazify Studios
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="https://github.com/rynzer0x"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-700 hover:text-sky-600 transition-colors"
                title="Rayan Mirza GitHub Profile"
              >
                Rayan Mirza
              </a>
            </div>

            {user && !isAdmin && (
              <span
                className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isAdvertiser
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                {isAdvertiser ? 'Advertiser Mode' : 'Worker Mode'}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6" aria-label="Public Navigation">
              <button
                onClick={() => handleNavClick('landing')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavClick('landing')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Marketplace Tasks
              </button>
              <button
                onClick={() => handleNavClick('landing')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Advertisers
              </button>
              <button
                onClick={() => handleNavClick('landing')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                FAQ
              </button>
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Switch Role Button */}
                {!isAdmin && onSwitchRole && (
                  <button
                    onClick={onSwitchRole}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title={`Switch to ${isAdvertiser ? 'Worker' : 'Advertiser'} Mode`}
                  >
                    <Repeat className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAdvertiser ? 'Worker Mode' : 'Advertiser Hub'}</span>
                  </button>
                )}

                {/* Worker Balance (Points + USDT) */}
                {!isAdvertiser && (
                  <button
                    onClick={() => handleNavClick('withdraw')}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white hover:from-emerald-100/70 hover:to-teal-50 border border-emerald-200 hover:border-emerald-400 shadow-xs transition-all text-left"
                    title="Your Available Wallet Balance — Click to Withdraw USDT"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      ₮
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-baseline gap-1 leading-tight">
                        <span className="text-xs font-extrabold text-slate-900 font-mono">
                          {pointsAmount} <span className="text-[10px] text-slate-500 font-sans">Pts</span>
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 leading-none mt-0.5">
                        <span>${usdtAmount} USDT</span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Advertiser Balance */}
                {isAdvertiser && (
                  <button
                    onClick={() => handleNavClick('advertiser-billing')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition"
                    title="Advertiser Deposit Balance"
                  >
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-amber-950 font-mono">
                        ${((user.advertiserBalanceCents || 0) / 100).toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] font-medium text-amber-700">Deposit Wallet</div>
                    </div>
                  </button>
                )}

                {/* User Settings Icon */}
                <button
                  onClick={() => handleNavClick('settings')}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition text-slate-700"
                  title={user.email}
                  aria-label="User Settings"
                >
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user.displayName?.[0] || user.email[0]}
                  </div>
                </button>

                {/* Sign Out Icon */}
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {/* Mobile Role Switcher */}
          {!isAdmin && onSwitchRole && (
            <button
              onClick={() => {
                onSwitchRole();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs mb-2"
            >
              <Repeat className="w-4 h-4" />
              Switch to {isAdvertiser ? 'Worker Mode' : 'Advertiser Hub'}
            </button>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="pt-2 pb-1 text-center text-[10px] text-slate-400">
            Architected by{' '}
            <a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 hover:text-sky-600">
              Injazify Studios
            </a>{' '}
            by{' '}
            <a href="https://github.com/rynzer0x" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 hover:text-sky-600">
              Rayan Mirza
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

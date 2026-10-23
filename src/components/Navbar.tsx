import React, { useState } from 'react';
import { Logo } from './Logo';
import { User, UserBalances, UsdtQuote } from '../types';
import { usdCentsToUsdt } from '../utils/usdt';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X
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
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  balances,
  currentTab,
  onSelectTab,
  onOpenAuth,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const availableCents = balances?.availableCents ?? 0;
  const usdtAmount = usdCentsToUsdt(availableCents).toFixed(2);
  const pointsAmount = (availableCents * 100).toLocaleString(); // 10,000 Points = $1

  const isAdmin = user?.role === 'admin';

  // Streamlined, high-profile nav items for users
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: Layers },
    { id: 'surveys', label: 'Direct Streams', icon: Sparkles },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldCheck });
  }

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick(user ? 'dashboard' : 'landing')}
              className="text-left focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl p-1 transition"
              aria-label="Reward River Home"
            >
              <Logo size="md" showTagline={!user} />
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          {user ? (
            <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isAdminItem = item.id === 'admin';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? isAdminItem
                          ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200/80 shadow-xs'
                          : 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-xs'
                        : isAdminItem
                        ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? (isAdminItem ? 'text-rose-600' : 'text-sky-600') : 'text-slate-400'}`} />
                    <span>{item.label}</span>
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
                Direct Streams
              </button>
              <button
                onClick={() => handleNavClick('landing')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                FAQ
              </button>
            </nav>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Wallet Balance Pill */}
                <button
                  onClick={() => handleNavClick('withdraw')}
                  className="group flex items-center gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/80 to-white hover:from-emerald-100/80 hover:to-teal-100/50 border border-emerald-200/90 hover:border-emerald-300 shadow-xs transition-all text-left"
                  title="Your Available Wallet Balance — Click to Withdraw USDT"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    ₮
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-1 leading-tight">
                      <span className="text-xs font-black text-slate-900 font-mono tracking-tight">
                        {pointsAmount} <span className="text-[10px] text-slate-500 font-sans font-semibold">Pts</span>
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 leading-none mt-0.5 font-mono">
                      <span>${usdtAmount} USDT</span>
                    </div>
                  </div>
                </button>

                {/* User Avatar & Settings Trigger */}
                <button
                  onClick={() => handleNavClick('settings')}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition text-slate-700"
                  title={user.email}
                  aria-label="User Settings"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {user.displayName?.[0] || user.email[0]}
                  </div>
                  <span className="hidden xl:inline-block text-xs font-semibold text-slate-700 max-w-[110px] truncate">
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                </button>

                {/* Sign Out Button */}
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Sign Out"
                  aria-label="Sign Out"
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

            {/* Mobile Hamburger Menu Toggle */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
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
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1.5 animate-fadeIn shadow-lg">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isAdminItem = item.id === 'admin';
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? isAdminItem
                      ? 'bg-rose-50 text-rose-700 font-bold'
                      : 'bg-sky-50 text-sky-700 font-bold'
                    : isAdminItem
                    ? 'text-rose-600 hover:bg-rose-50/50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? (isAdminItem ? 'text-rose-600' : 'text-sky-600') : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

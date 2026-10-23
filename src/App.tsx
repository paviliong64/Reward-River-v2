/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  UserBalances,
  UsdtQuote,
  Survey,
  Withdrawal,
  LedgerEntry,
  CpxConfigStatus,
  TaskCampaign,
  TaskSubmission,
  OfferwallItem,
  AdSettings,
  AdvertiserOverview,
  AdvertiserDeposit,
  PlatformAnnouncement
} from './types';
import { UsdtNetwork } from './utils/usdt';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { TasksView } from './components/TasksView';
import { OfferwallsView } from './components/OfferwallsView';
import { AdvertiserView } from './components/AdvertiserView';
import { SurveysView } from './components/SurveysView';
import { WithdrawalView } from './components/WithdrawalView';
import { TransactionsView } from './components/TransactionsView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { LegalModal } from './components/LegalModal';
import { PhoneOnboardingModal } from './components/PhoneOnboardingModal';
import { AdBanners } from './components/AdBanners';
import { signOutWithSupabase, resendSupabaseVerification, onSupabaseAuthStateChange, syncSupabaseUserWithBackend } from './supabase';

const getInitialTab = (): string => {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab')?.toLowerCase();

  const candidate = hash || tabParam || path;
  const validTabs = [
    'admin', 'tasks', 'surveys', 'withdraw', 'transactions',
    'settings', 'advertiser', 'advertiser-create', 'advertiser-proofs',
    'advertiser-billing', 'dashboard'
  ];
  if (validTabs.includes(candidate)) {
    return candidate;
  }
  return 'landing';
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [usdtQuote, setUsdtQuote] = useState<UsdtQuote | null>(null);
  const [cpxStatus, setCpxStatus] = useState<CpxConfigStatus | null>(null);

  // Tab navigation: 'landing', 'dashboard', 'tasks', 'surveys', 'withdraw', 'transactions', 'settings', 'admin',
  // Advertiser tabs: 'advertiser', 'advertiser-create', 'advertiser-proofs', 'advertiser-billing'
  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [authRoleChoice, setAuthRoleChoice] = useState<'user' | 'advertiser'>('user');
  const [legalModalPage, setLegalModalPage] = useState<string | null>(null);

  // Data states
  const [tasks, setTasks] = useState<TaskCampaign[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [workerSubmissions, setWorkerSubmissions] = useState<TaskSubmission[]>([]);
  const [offerwalls, setOfferwalls] = useState<OfferwallItem[]>([]);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);

  // Advertiser specific data
  const [advertiserOverview, setAdvertiserOverview] = useState<AdvertiserOverview | null>(null);
  const [advertiserCampaigns, setAdvertiserCampaigns] = useState<TaskCampaign[]>([]);
  const [advertiserSubmissions, setAdvertiserSubmissions] = useState<TaskSubmission[]>([]);
  const [advertiserDeposits, setAdvertiserDeposits] = useState<AdvertiserDeposit[]>([]);

  // Surveys, Ledger & Withdrawals
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [surveysError, setSurveysError] = useState<string | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Token helper
  const getAuthToken = () => localStorage.getItem('rr_auth_token');

  // Fetch USDT price quote
  const fetchUsdtQuote = useCallback(async () => {
    try {
      const res = await fetch('/api/usdt/price');
      if (res.ok) setUsdtQuote(await res.json());
    } catch (e) {
      console.warn('Could not fetch USDT quote:', e);
    }
  }, []);

  // Fetch public ad configurations
  const fetchPublicAds = useCallback(async () => {
    try {
      const res = await fetch('/api/public/ads');
      if (res.ok) setAdSettings(await res.json());
    } catch {}
  }, []);

  // Fetch active announcements & breaking notices
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/public/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch {}
  }, []);

  // Fetch user account & balances
  const fetchUserData = useCallback(async (token?: string) => {
    const activeToken = token || getAuthToken();
    if (!activeToken) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setBalances(data.balances);
      } else {
        localStorage.removeItem('rr_auth_token');
        setUser(null);
        setBalances(null);
      }
    } catch (e) {
      console.warn('Failed to fetch user session:', e);
    }
  }, []);

  // Fetch micro-tasks for worker
  const fetchTasks = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setTasksLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tasks/my-submissions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (tRes.ok) {
        const data = await tRes.json();
        setTasks(data.tasks || []);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        setWorkerSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Fetch multi-offerwalls
  const fetchOfferwalls = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/offerwalls', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfferwalls(data.offerwalls || []);
      }
    } catch {}
  }, []);

  // Fetch advertiser panel data
  const fetchAdvertiserData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const [ovRes, cRes, sRes, bRes] = await Promise.all([
        fetch('/api/advertiser/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/advertiser/campaigns', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/advertiser/submissions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/advertiser/billing', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (ovRes.ok) setAdvertiserOverview(await ovRes.json());
      if (cRes.ok) setAdvertiserCampaigns((await cRes.json()).campaigns || []);
      if (sRes.ok) setAdvertiserSubmissions((await sRes.json()).submissions || []);
      if (bRes.ok) {
        const bData = await bRes.json();
        setAdvertiserDeposits(bData.deposits || []);
      }
    } catch {}
  }, []);

  // Fetch CPX surveys
  const fetchSurveys = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setSurveysLoading(true);
    setSurveysError(null);
    try {
      const res = await fetch('/api/surveys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setSurveysError(data.error || 'Failed to fetch available surveys.');
      } else {
        setSurveys(data.surveys || []);
        if (data.usdtQuote) setUsdtQuote(data.usdtQuote);
      }
    } catch {
      setSurveysError('Connection to survey server failed.');
    } finally {
      setSurveysLoading(false);
    }
  }, []);

  // Fetch ledger and withdrawals
  const fetchLedgerAndWithdrawals = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const [ledgRes, withRes] = await Promise.all([
        fetch('/api/ledger', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/withdrawals', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (ledgRes.ok) {
        const lData = await ledgRes.json();
        setLedgerEntries(lData.entries || []);
        if (lData.balances) setBalances(lData.balances);
      }

      if (withRes.ok) {
        const wData = await withRes.json();
        setWithdrawals(wData.withdrawals || []);
      }
    } catch {}
  }, []);

  // Refresh all user data
  const handleRefreshAll = useCallback(() => {
    fetchUserData();
    fetchTasks();
    fetchOfferwalls();
    fetchSurveys();
    fetchLedgerAndWithdrawals();
    fetchAdvertiserData();
    fetchUsdtQuote();
    fetchPublicAds();
    fetchAnnouncements();
  }, [fetchUserData, fetchTasks, fetchOfferwalls, fetchSurveys, fetchLedgerAndWithdrawals, fetchAdvertiserData, fetchUsdtQuote, fetchPublicAds, fetchAnnouncements]);

  // Initial load & Auth Listener
  useEffect(() => {
    fetchUsdtQuote();
    fetchPublicAds();
    fetchAnnouncements();

    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 500);
    }

    const authSub = onSupabaseAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const data = await syncSupabaseUserWithBackend(
            session.user,
            session.access_token,
            authRoleChoice
          );

          localStorage.setItem('rr_auth_token', data.token);
          setUser(data.user);
          setBalances(data.balances);
          setCurrentTab((prev) => (prev === 'landing' ? (data.user.role === 'advertiser' ? 'advertiser' : 'dashboard') : prev));

          if (data.user && !data.user.whatsappNumber && !data.user.phoneNumber && !data.user.hasPromptedPhone && !sessionStorage.getItem('phone_prompt_dismissed')) {
            setPhoneModalOpen(true);
          }
        } catch (e) {
          console.warn('Supabase state sync warning:', e);
        }
      } else {
        const token = getAuthToken();
        if (token) {
          fetchUserData(token).then(() => {
            setCurrentTab((prev) => (prev === 'landing' ? 'dashboard' : prev));
          });
        }
      }
    });

    return () => {
      if (authSub && (authSub as any).data?.subscription) {
        (authSub as any).data.subscription.unsubscribe();
      }
    };
  }, [fetchUsdtQuote, fetchPublicAds, fetchUserData, authRoleChoice]);

  // Tab change triggers
  useEffect(() => {
    if (user) {
      if (currentTab === 'tasks') fetchTasks();
      if (currentTab === 'surveys') {
        fetchOfferwalls();
        fetchSurveys();
      }
      if (currentTab.startsWith('advertiser')) fetchAdvertiserData();
      if (['dashboard', 'withdraw', 'transactions', 'earnings'].includes(currentTab)) {
        fetchLedgerAndWithdrawals();
      }
    }
  }, [currentTab, user, fetchTasks, fetchOfferwalls, fetchSurveys, fetchAdvertiserData, fetchLedgerAndWithdrawals]);

  // Synchronize URL hash with current tab for direct deep-linking & Vercel deployment support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentTab === 'landing') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else {
      window.history.replaceState(null, '', `#${currentTab}`);
    }
  }, [currentTab]);

  // Listen to hash changes (e.g. user navigates to #admin or clicks browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '').toLowerCase();
      const validTabs = [
        'admin', 'tasks', 'surveys', 'withdraw', 'transactions',
        'settings', 'advertiser', 'advertiser-create', 'advertiser-proofs',
        'advertiser-billing', 'dashboard'
      ];
      if (hash && validTabs.includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Role Switcher Handler (Worker <-> Advertiser)
  const handleSwitchRole = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/user/switch-role', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.role === 'advertiser') {
          setCurrentTab('advertiser');
          fetchAdvertiserData();
        } else {
          setCurrentTab('dashboard');
          fetchTasks();
        }
      }
    } catch {}
  };

  // Worker submits proof
  const handleSubmitTaskProof = async (taskId: string, proof: any) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(proof)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      fetchTasks();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error submitting proof.' };
    }
  };

  // Advertiser creates campaign
  const handleCreateCampaign = async (campaignData: any) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch('/api/advertiser/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(campaignData)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      fetchAdvertiserData();
      fetchUserData();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to create campaign' };
    }
  };

  // Advertiser updates campaign status (pause/resume)
  const handleUpdateCampaignStatus = async (taskId: string, status: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch(`/api/advertiser/campaigns/${taskId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      fetchAdvertiserData();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update campaign' };
    }
  };

  // Advertiser reviews worker proof
  const handleReviewSubmission = async (submissionId: string, action: 'approved' | 'rejected', reason?: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch(`/api/advertiser/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      fetchAdvertiserData();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to review submission' };
    }
  };

  // Advertiser deposits funds
  const handleDepositFunds = async (amountUsd: number, method: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch('/api/advertiser/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amountUsd, method })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      fetchAdvertiserData();
      fetchUserData();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to deposit funds' };
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOutWithSupabase();
    } catch {}
    localStorage.removeItem('rr_auth_token');
    setUser(null);
    setBalances(null);
    setCurrentTab('landing');
  };

  // Auth Success
  const handleAuthSuccess = (token: string, newUser: User, newBalances?: UserBalances) => {
    localStorage.setItem('rr_auth_token', token);
    setUser(newUser);
    if (newBalances) setBalances(newBalances);
    setCurrentTab(newUser.role === 'advertiser' ? 'advertiser' : 'dashboard');
    handleRefreshAll();
  };

  // Verify email trigger
  const handleVerifyEmail = async () => {
    const token = getAuthToken();
    try {
      if (user?.email) await resendSupabaseVerification(user.email);
      if (token) {
        await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      handleRefreshAll();
    } catch {}
  };

  // Submit Withdrawal Request
  const handleSubmitWithdrawal = async (amountCents: number, usdtAddress: string, network: UsdtNetwork) => {
    const token = getAuthToken();
    if (!token) {
      setAuthInitialMode('signin');
      setAuthModalOpen(true);
      return;
    }

    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amountCents, usdtAddress, network })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Withdrawal request failed.');
    handleRefreshAll();
  };

  // Password change handler
  const handlePasswordChange = async (currentPass: string, newPass: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Password update failed' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network communication failed' };
    }
  };

  // WhatsApp / Phone onboarding
  const handleSavePhone = async (whatsappNumber: string, countryCode: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/user/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ whatsappNumber, countryCode })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
    } catch {} finally {
      sessionStorage.setItem('phone_prompt_dismissed', 'true');
      setPhoneModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Announcement Bar */}
      <AnnouncementBar
        announcement={announcements.find((a) => a.active && a.showInTopBar) || null}
        allAnnouncements={announcements.filter((a) => a.active)}
        onNavigateTab={setCurrentTab}
      />

      {/* Top Navigation */}
      <Navbar
        user={user}
        balances={balances}
        usdtQuote={usdtQuote}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode);
          setAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
        onOpenLegal={(page) => setLegalModalPage(page)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              setAuthInitialMode('signup');
              setAuthModalOpen(true);
            }}
            onOpenLegal={(page) => setLegalModalPage(page)}
            usdtQuote={usdtQuote}
            currentUser={user}
          />
        )}

        {/* Worker Dashboard */}
        {currentTab === 'dashboard' && user && (
          <UserDashboard
            user={user}
            balances={balances}
            usdtQuote={usdtQuote}
            surveys={surveys.slice(0, 4)}
            surveysLoading={surveysLoading}
            recentWithdrawals={withdrawals.slice(0, 3)}
            recentLedger={ledgerEntries.slice(0, 5)}
            onNavigateTab={setCurrentTab}
            onStartSurvey={() => setCurrentTab('surveys')}
            onVerifyEmail={handleVerifyEmail}
          />
        )}

        {/* Micro-Tasks Marketplace (JobsWorkTech Marketplace) */}
        {currentTab === 'tasks' && user && (
          <TasksView
            tasks={tasks}
            submissions={workerSubmissions}
            loading={tasksLoading}
            onRefresh={fetchTasks}
            onSubmitProof={handleSubmitTaskProof}
            usdtQuote={usdtQuote}
          />
        )}

        {/* Multi-Offerwalls (CPX, Aoyco, AdvertsReward) */}
        {currentTab === 'surveys' && user && (
          <OfferwallsView
            offerwalls={offerwalls}
            onRefresh={fetchOfferwalls}
            usdtQuote={usdtQuote}
          />
        )}

        {/* Advertiser Portal (Campaigns, Create Task, Review Proofs, Billing) */}
        {currentTab.startsWith('advertiser') && user && (
          <AdvertiserView
            user={user}
            overview={advertiserOverview}
            campaigns={advertiserCampaigns}
            submissions={advertiserSubmissions}
            deposits={advertiserDeposits}
            onRefresh={fetchAdvertiserData}
            onCreateCampaign={handleCreateCampaign}
            onUpdateCampaignStatus={handleUpdateCampaignStatus}
            onReviewSubmission={handleReviewSubmission}
            onDepositFunds={handleDepositFunds}
          />
        )}

        {/* Withdrawal Page */}
        {currentTab === 'withdraw' && user && (
          <WithdrawalView
            user={user}
            balances={balances}
            usdtQuote={usdtQuote}
            withdrawals={withdrawals}
            onRefreshQuote={fetchUsdtQuote}
            onSubmitWithdrawal={async (usdtAddress, network, amountCents) => {
              try {
                await handleSubmitWithdrawal(amountCents, usdtAddress, network);
                return { success: true };
              } catch (err) {
                return { success: false, error: err instanceof Error ? err.message : String(err) };
              }
            }}
            onVerifyEmail={handleVerifyEmail}
          />
        )}

        {/* Transactions / History */}
        {currentTab === 'transactions' && user && (
          <TransactionsView
            entries={ledgerEntries}
            usdtQuote={usdtQuote}
            onRefresh={fetchLedgerAndWithdrawals}
          />
        )}

        {/* Settings */}
        {currentTab === 'settings' && user && (
          <SettingsView
            user={user}
            onVerifyEmail={handleVerifyEmail}
            onPasswordChange={handlePasswordChange}
          />
        )}

        {/* Admin View */}
        {currentTab === 'admin' && (
          <AdminView
            adminUser={user?.role === 'admin' ? user : undefined}
            cpxStatus={cpxStatus}
            onDataChanged={handleRefreshAll}
            onAdminLoginSuccess={(data) => {
              localStorage.setItem('rr_auth_token', data.token);
              setUser(data.user);
              setBalances(data.balances);
            }}
          />
        )}
      </main>

      {/* Sandboxed Sticky Banner & Rail Ads (Hidden on Admin Command Center) */}
      {currentTab !== 'admin' && <AdBanners adSettings={adSettings} />}

      {/* Footer (Hidden on Admin Command Center to give full operational workspace) */}
      {currentTab !== 'admin' && (
        <Footer
          onOpenLegal={(page) => setLegalModalPage(page)}
          onSelectTab={setCurrentTab}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onOpenLegal={(page) => setLegalModalPage(page)}
      />

      {/* Legal & Policy Modals */}
      {legalModalPage && (
        <LegalModal
          page={legalModalPage}
          onClose={() => setLegalModalPage(null)}
        />
      )}

      {/* WhatsApp Onboarding Modal */}
      {user && (
        <PhoneOnboardingModal
          isOpen={phoneModalOpen}
          user={user}
          onSave={handleSavePhone}
          onClose={() => {
            sessionStorage.setItem('phone_prompt_dismissed', 'true');
            setPhoneModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

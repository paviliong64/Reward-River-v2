import React, { useState, useEffect } from 'react';
import {
  User,
  Withdrawal,
  SystemSettings,
  AdminUserDetail,
  TaskCampaign,
  TaskSubmission,
  AdSettings,
  ProviderConfig,
  AdSlotConfig,
  PlatformTreasuryEntry,
  FinancialSummary
} from '../types';
import {
  ShieldCheck,
  RefreshCw,
  Send,
  ExternalLink,
  Users,
  Search,
  MessageSquare,
  CheckCircle2,
  Eye,
  X,
  Globe,
  DollarSign,
  Layers,
  CheckSquare,
  Sparkles,
  Zap,
  Settings,
  FileText,
  AlertCircle,
  Play,
  Pause,
  Repeat,
  Plus,
  Trash2,
  Edit,
  Code,
  Sliders,
  TrendingUp,
  CreditCard,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  Key,
  Terminal,
  Activity,
  Linkedin
} from 'lucide-react';

interface AdminViewProps {
  user?: User;
  adminUser?: User;
  cpxStatus?: any;
  onRefreshAll?: () => void;
  onDataChanged?: () => void;
  onAdminLoginSuccess?: (data: { user: User; balances: any; token: string }) => void;
}

export function AdminView({ adminUser, onRefreshAll, onDataChanged, onAdminLoginSuccess }: AdminViewProps) {
  const triggerRefresh = onRefreshAll || onDataChanged || (() => {});
  const [activeSubTab, setActiveSubTab] = useState<
    'financials' | 'providers' | 'ads' | 'commissions' | 'withdrawals' | 'users' | 'campaigns' | 'submissions' | 'simulator' | 'security'
  >('financials');

  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [treasuryLogs, setTreasuryLogs] = useState<PlatformTreasuryEntry[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [adSlots, setAdSlots] = useState<AdSlotConfig[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [usersList, setUsersList] = useState<AdminUserDetail[]>([]);
  const [campaignsList, setCampaignsList] = useState<TaskCampaign[]>([]);
  const [submissionsList, setSubmissionsList] = useState<TaskSubmission[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User search & modals
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [balanceModalUser, setBalanceModalUser] = useState<AdminUserDetail | null>(null);
  const [balanceAdjAmount, setBalanceAdjAmount] = useState<number>(500); // 500 cents = $5.00
  const [balanceAdjType, setBalanceAdjType] = useState<'credit' | 'debit'>('credit');
  const [balanceAdjReason, setBalanceAdjReason] = useState<string>('Bonus reward credit');

  // Withdrawal Mark as Paid Modal
  const [payoutModal, setPayoutModal] = useState<{ id: string; txHash: string; notes: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);

  // Provider Modal (Add / Edit)
  const [providerModal, setProviderModal] = useState<Partial<ProviderConfig> | null>(null);

  // Ad Slot Modal (Edit Code)
  const [editingAdSlot, setEditingAdSlot] = useState<AdSlotConfig | null>(null);

  // Postback Simulator State
  const [simProvider, setSimProvider] = useState<string>('cpx');
  const [simPoints, setSimPoints] = useState<number>(2000);
  const [simTargetUserId, setSimTargetUserId] = useState<string>('');
  const [simStatus, setSimStatus] = useState<number>(1);
  const [simResult, setSimResult] = useState<any>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Admin Credentials Update State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credMsg, setCredMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Firewall Telemetry State
  const [firewallData, setFirewallData] = useState<any>(null);
  const [firewallLoading, setFirewallLoading] = useState(false);

  // Admin Portal Gate State (Protected by Firewall & Shield)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTrapField, setAdminTrapField] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const fetchFirewallStatus = async () => {
    setFirewallLoading(true);
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch('/api/admin/firewall/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFirewallData(data.firewall);
      }
    } catch (err) {
      console.error('Failed to load firewall telemetry:', err);
    } finally {
      setFirewallLoading(false);
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMsg(null);

    if (!currentAdminPassword) {
      setCredMsg({ text: 'Current password is required to authorize credentials update.', type: 'error' });
      return;
    }

    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      setCredMsg({ text: 'New password and confirmation password do not match.', type: 'error' });
      return;
    }

    if (!newAdminEmail && !newAdminPassword) {
      setCredMsg({ text: 'Please enter a new email or new password to update.', type: 'error' });
      return;
    }

    setCredLoading(true);
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch('/api/admin/profile/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: currentAdminPassword,
          newEmail: newAdminEmail ? newAdminEmail.trim() : undefined,
          newPassword: newAdminPassword ? newAdminPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admin credentials.');
      }

      setCredMsg({ text: data.message || 'Credentials updated successfully!', type: 'success' });
      if (data.token) {
        localStorage.setItem('rr_auth_token', data.token);
      }
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setNewAdminEmail('');

      fetchAdminData();
      fetchFirewallStatus();
      if (onAdminLoginSuccess && data.user) {
        onAdminLoginSuccess({
          user: data.user,
          balances: {},
          token: data.token
        });
      }
    } catch (err: any) {
      setCredMsg({ text: err.message || 'Update failed', type: 'error' });
    } finally {
      setCredLoading(false);
    }
  };

  const handleAdminLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError(null);
    try {
      const email = customEmail || adminEmail;
      const password = customPass || adminPassword;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, _admin_trap_field: adminTrapField })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid administrator credentials.');
      }
      if (data.user?.role !== 'admin') {
        throw new Error('This account does not have Administrator privileges.');
      }
      localStorage.setItem('rr_auth_token', data.token);
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(data);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setAdminLoginError(err.message || 'Login failed.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rr_auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [finRes, trRes, provRes, adsRes, wRes, sRes, uRes, cRes, subRes] = await Promise.all([
        fetch('/api/admin/financials', { headers }),
        fetch('/api/admin/treasury', { headers }),
        fetch('/api/admin/providers', { headers }),
        fetch('/api/admin/ad-slots', { headers }),
        fetch('/api/admin/withdrawals', { headers }),
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/campaigns', { headers }),
        fetch('/api/admin/submissions', { headers })
      ]);

      if (finRes.ok) setFinancials((await finRes.json()).summary || null);
      if (trRes.ok) setTreasuryLogs((await trRes.json()).treasury || []);
      if (provRes.ok) setProviders((await provRes.json()).providers || []);
      if (adsRes.ok) setAdSlots((await adsRes.json()).adSlots || []);
      if (wRes.ok) setWithdrawals((await wRes.json()).withdrawals || []);
      if (sRes.ok) setSettings(await sRes.json());
      if (uRes.ok) setUsersList((await uRes.json()).users || []);
      if (cRes.ok) setCampaignsList((await cRes.json()).campaigns || []);
      if (subRes.ok) setSubmissionsList((await subRes.json()).submissions || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'security') {
      fetchFirewallStatus();
    }
  }, [activeSubTab]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Provider Handlers ---
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerModal || !providerModal.id || !providerModal.name) return;

    try {
      const token = localStorage.getItem('rr_auth_token');
      const isEdit = providers.some(p => p.id === providerModal.id);
      const url = isEdit ? `/api/admin/providers/${providerModal.id}` : '/api/admin/providers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(providerModal)
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: `Provider "${providerModal.name}" saved successfully.`, type: 'success' });
        setProviderModal(null);
        fetchAdminData();
        triggerRefresh();
      } else {
        setActionMessage({ text: data.error || 'Failed to save provider.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network request failed.', type: 'error' });
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm(`Are you sure you want to delete provider "${id}"?`)) return;
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage({ text: `Provider ${id} deleted.`, type: 'success' });
        fetchAdminData();
        triggerRefresh();
      } else {
        setActionMessage({ text: 'Failed to delete provider.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Delete request failed.', type: 'error' });
    }
  };

  const handleToggleProvider = async (provider: ProviderConfig) => {
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !provider.enabled })
      });
      if (res.ok) {
        fetchAdminData();
        triggerRefresh();
      }
    } catch {}
  };

  // --- Ad Slot Handlers ---
  const handleSaveAdSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdSlot) return;

    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/ad-slots/${editingAdSlot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingAdSlot)
      });
      if (res.ok) {
        setActionMessage({ text: `Ad slot "${editingAdSlot.name}" updated successfully.`, type: 'success' });
        setEditingAdSlot(null);
        fetchAdminData();
      } else {
        setActionMessage({ text: 'Failed to update ad slot.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network request failed.', type: 'error' });
    }
  };

  const handleToggleAdSlot = async (slot: AdSlotConfig) => {
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/ad-slots/${slot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !slot.enabled })
      });
      if (res.ok) fetchAdminData();
    } catch {}
  };

  // --- Commission & System Settings Handlers ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setActionMessage({ text: 'Commission splits & system settings updated successfully.', type: 'success' });
        fetchAdminData();
      } else {
        setActionMessage({ text: 'Failed to update settings.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network request failed.', type: 'error' });
    }
  };

  // --- Withdrawal Actions ---
  const handleApprovePaid = async () => {
    if (!payoutModal) return;
    if (!payoutModal.txHash.trim()) {
      alert('Please enter the on-chain USDT transaction hash (TXID).');
      return;
    }
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/withdrawals/${payoutModal.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'mark_paid', txHash: payoutModal.txHash.trim(), notes: payoutModal.notes })
      });
      if (res.ok) {
        setActionMessage({ text: 'Withdrawal marked as PAID with TX Hash confirmed.', type: 'success' });
        setPayoutModal(null);
        fetchAdminData();
        triggerRefresh();
      } else {
        setActionMessage({ text: 'Failed to mark withdrawal as paid.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Action request failed.', type: 'error' });
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!rejectModal) return;
    if (!rejectModal.reason.trim()) {
      alert('Please provide a reason for rejecting this withdrawal.');
      return;
    }
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/withdrawals/${rejectModal.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reject', notes: rejectModal.reason.trim() })
      });
      if (res.ok) {
        setActionMessage({ text: 'Withdrawal rejected and funds refunded back to worker wallet.', type: 'success' });
        setRejectModal(null);
        fetchAdminData();
        triggerRefresh();
      } else {
        setActionMessage({ text: 'Failed to reject withdrawal.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Action request failed.', type: 'error' });
    }
  };

  // --- Balance Adjustment Handler ---
  const handleAdjustUserBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/users/${balanceModalUser.id}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amountCents: balanceAdjAmount,
          type: balanceAdjType,
          description: balanceAdjReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          text: `Balance adjusted for ${balanceModalUser.email}: ${balanceAdjType === 'credit' ? '+' : '-'}$${(balanceAdjAmount / 100).toFixed(2)} (${balanceAdjAmount * 100} Points)`,
          type: 'success'
        });
        setBalanceModalUser(null);
        fetchAdminData();
        triggerRefresh();
      } else {
        setActionMessage({ text: data.error || 'Failed to adjust balance.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Adjustment request failed.', type: 'error' });
    }
  };

  // --- Postback Simulator Handler ---
  const handleSimulatePostback = async () => {
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch('/api/admin/test-offerwall-postback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          provider: simProvider,
          targetUserId: simTargetUserId || adminUser?.id,
          rewardPoints: simPoints,
          status: simStatus
        })
      });
      const data = await res.json();
      setSimResult(data);
      fetchAdminData();
      triggerRefresh();
    } catch {
      setSimResult({ error: 'Simulation request failed' });
    }
  };

  // --- Campaign & Submission Review Handlers ---
  const handleCampaignAction = async (id: string, action: string) => {
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/campaigns/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setActionMessage({ text: `Campaign successfully ${action}d.`, type: 'success' });
        fetchAdminData();
      }
    } catch {}
  };

  const handleSubmissionAction = async (id: string, action: 'approved' | 'rejected', reason?: string) => {
    try {
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/submissions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason: reason || 'Approved by administrator' })
      });
      if (res.ok) {
        setActionMessage({ text: `Submission ${action} successfully.`, type: 'success' });
        fetchAdminData();
        triggerRefresh();
      }
    } catch {}
  };

  const handleToggleUserRole = async (targetUser: AdminUserDetail) => {
    try {
      const newRole = targetUser.role === 'advertiser' ? 'user' : 'advertiser';
      const token = localStorage.getItem('rr_auth_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setActionMessage({ text: `Updated role for ${targetUser.email} to ${newRole}.`, type: 'success' });
        fetchAdminData();
      }
    } catch {}
  };

  const filteredUsers = usersList.filter(u => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.whatsappNumber?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  if (!adminUser || adminUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500" />

          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            Reward River Command Center
          </h3>
          <p className="text-xs text-cyan-400 font-semibold mt-1 flex items-center justify-center gap-2 flex-wrap">
            <span>Architected by <a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-cyan-300">Injazify Studios</a> by <a href="https://linkedin.com/in/rynmirza" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-sky-300 inline-flex items-center gap-1"><Linkedin className="w-3 h-3 text-[#0A66C2]" />Rayan Mirza (@rynmirza)</a> • <a href="https://github.com/rynzer0x" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-slate-200">GitHub (@rynzer0x)</a></span>
          </p>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Enter authorized administrator credentials to manage providers, ad units, 60/40 treasury, and payouts.
          </p>

          {adminLoginError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs text-left flex items-start gap-2.5 shadow-md">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Access Denied / Security Shield Warning:</span>
                <span>{adminLoginError}</span>
              </div>
            </div>
          )}

          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-800/80 border border-cyan-500/30 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-200">Hardware Firewall & IP Rate Limiter Active</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              5-Try Lockout
            </span>
          </div>

          <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4 text-left">
            {/* Honeypot field for bot/scraper traps */}
            <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                name="_admin_trap_field"
                value={adminTrapField}
                onChange={(e) => setAdminTrapField(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
              <input
                type="email"
                placeholder="master@rewardriver.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Master Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={adminLoginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {adminLoginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Verify Credentials & Enter Command Center</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/90 text-left">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Strict Security Enforcement Notice:</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Normal visitors, bots, and unauthorized IP addresses are automatically blocked upon exceeding 5 failed attempts within 15 minutes. All events are written directly to immutable Supabase audit logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            <span>Reward River Master Control</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              Super Admin
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete executive portal: 60% Treasury Revenue, Direct Provider Integrations, Universal Ad Manager, 40% User Payouts & Commission Controls.
            <span className="ml-2 font-semibold text-sky-600 inline-flex items-center gap-1.5 flex-wrap">
              • Built by <a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Injazify Studios</a> by <a href="https://linkedin.com/in/rynmirza" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline inline-flex items-center gap-1"><Linkedin className="w-3 h-3 text-[#0A66C2]" />Rayan Mirza (@rynmirza)</a> (<a href="https://github.com/rynzer0x" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline">GitHub: @rynzer0x</a> • <a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="hover:underline">injazify.com</a>)
            </span>
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Financial Executive Summary Cards (60% Platform Profit vs 40% User Share) */}
      {financials && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">Reward River 60% Profit</span>
            <span className="text-2xl font-black text-emerald-400 block mt-1">
              {financials.platformProfitFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              +{financials.platformProfitPoints.toLocaleString()} Points Retained
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Gross Network Inflow</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {financials.grossInflowFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {financials.grossInflowPoints.toLocaleString()} Total Provider Pts
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold block">40% User Payouts Disbursed</span>
            <span className="text-2xl font-black text-sky-600 block mt-1">
              {financials.userDisbursedFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {financials.userDisbursedPoints.toLocaleString()} Pts to Workers
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Pending Withdrawals Queue</span>
            <span className="text-2xl font-black text-amber-600 block mt-1">
              {financials.pendingWithdrawalsFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {withdrawals.filter(w => ['requested', 'under_review'].includes(w.status)).length} requests waiting
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Net Retained Cash</span>
            <span className="text-2xl font-black text-indigo-600 block mt-1">
              {financials.netRetainedFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Profit minus pending payouts
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('financials')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'financials'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>60% Treasury & Financials</span>
        </button>

        <button
          onClick={() => setActiveSubTab('providers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'providers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Integrate Providers & Partners ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ads')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'ads'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Universal Ad Slots ({adSlots.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('commissions')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'commissions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Commissions & Margins (60/40)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('withdrawals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'withdrawals'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>USDT Withdrawals ({withdrawals.filter(w => w.status === 'requested').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users & Balance Control ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'campaigns'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Campaigns ({campaignsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'submissions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Proofs Queue ({submissionsList.filter(s => s.status === 'pending_review').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'simulator'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>1-Click Postback Simulator</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'security'
              ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-sm'
              : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>🛡️ Firewall & Credentials</span>
        </button>
      </div>

      {/* TAB 1: 60% TREASURY & FINANCIALS */}
      {activeSubTab === 'financials' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Platform Treasury Revenue Stream</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time ledger recording the exact 60% margin kept by Reward River on all surveys, offerwalls, micro-tasks, and ad monetization events.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Provider / Source</th>
                    <th className="py-2.5 px-3">Worker</th>
                    <th className="py-2.5 px-3 text-right">Gross Paid</th>
                    <th className="py-2.5 px-3 text-right">Worker Share (40%)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 font-bold">Reward River Profit (60%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {treasuryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No transactions recorded in platform treasury yet. Use the 1-Click Simulator to test!
                      </td>
                    </tr>
                  ) : (
                    treasuryLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900">{log.providerName}</span>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">{log.sourceType}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {log.userEmail || log.userId || 'Direct Earner'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          ${(log.grossAmountCents / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sky-600">
                          +${(log.userShareCents / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 font-black">
                          +${(log.platformShareCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVIDERS & PARTNER INTEGRATION */}
      {activeSubTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Partner Companies & Gateways</h3>
              <p className="text-xs text-slate-500">
                Connect external offerwalls (CPX, Aoyco, AdvertsReward, BitLabs, Monlix, Timewall, etc.). All providers automatically display under direct Reward River white-label branding.
              </p>
            </div>
            <button
              onClick={() =>
                setProviderModal({
                  id: '',
                  name: '',
                  publicBrandName: 'Reward River Direct Gateway • Stream',
                  tagline: 'Direct High-Yield Earning Stream',
                  description: 'Verified direct earning gateway with instant crediting to your balance.',
                  category: 'offers',
                  enabled: true,
                  launchUrlTemplate: 'https://example.com/wall?pub_id={app_id}&subid={external_id}',
                  appId: '',
                  secretKey: '',
                  userSharePercent: 40,
                  platformSharePercent: 60,
                  icon: 'RR',
                  badge: 'Direct Stream'
                })
              }
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Integrate New Partner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(p => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {p.icon || 'RR'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {p.userSharePercent}% User / {p.platformSharePercent}% Platform
                      </span>
                      <button
                        onClick={() => handleToggleProvider(p)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition ${
                          p.enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({p.id})</span>
                  </h4>
                  <p className="text-xs text-sky-600 font-semibold mt-0.5">{p.publicBrandName}</p>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{p.description}</p>

                  {/* S2S Webhook URL */}
                  <div className="mt-3.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">S2S Postback Webhook</span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/api/postback/${p.id}`,
                            `postback_${p.id}`
                          )
                        }
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                      >
                        {copiedId === `postback_${p.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === `postback_${p.id}` ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                    <code className="text-[11px] font-mono text-slate-700 break-all select-all block">
                      {window.location.origin}/api/postback/{p.id}
                    </code>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] capitalize">{p.category}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setProviderModal(p)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Provider"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Provider"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UNIVERSAL AD SLOTS MANAGER */}
      {activeSubTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Universal Ad Network & Banner Manager</h3>
              <p className="text-xs text-slate-500">
                Paste any advertising script or tag (Google AdSense, Adsterra, PropellerAds, Monetag, A-Ads, or direct HTML banners).
              </p>
            </div>
            <button
              onClick={() =>
                setEditingAdSlot({
                  id: `ad_slot_${Date.now()}`,
                  name: 'Custom Ad Placement',
                  placement: 'sticky_bottom',
                  format: 'responsive',
                  enabled: true,
                  adCode: '<div style="background:#0f172a;color:#38bdf8;padding:12px;text-align:center;border-radius:8px;">Custom Sponsor Banner</div>',
                  updatedAt: new Date().toISOString()
                })
              }
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ad Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adSlots.map(slot => (
              <div key={slot.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{slot.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {slot.format} • {slot.placement}
                      </span>
                      <button
                        onClick={() => handleToggleAdSlot(slot)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition ${
                          slot.enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Live Render Preview Frame */}
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center justify-between">
                      <span>Live Render Frame</span>
                      <span>{slot.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-center bg-transparent overflow-hidden">
                      <iframe
                        title={slot.name}
                        srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;font-family:sans-serif;}body{display:flex;align-items:center;justify-content:center;min-height:100vh;}img,iframe{max-width:100%;}</style></head><body>${slot.adCode || '<div style="color:#94a3b8;font-size:12px;">No Ad Code Configured</div>'}</body></html>`}
                        className="w-full border-0 rounded-lg min-h-[90px] overflow-hidden"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{slot.id}</span>
                  <button
                    onClick={() => setEditingAdSlot(slot)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Ad Code</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSIONS & MARGINS (60/40) */}
      {activeSubTab === 'commissions' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              <span>Platform Commission & Profit Margins</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control the default revenue split. User only sees their percentage share; the Reward River margin is kept invisibly in the platform treasury.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Reward River Platform Profit %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.defaultPlatformSharePercent ?? 60}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSettings({
                    ...settings,
                    defaultPlatformSharePercent: val,
                    defaultUserSharePercent: 100 - val
                  });
                }}
                className="w-full px-3 py-2 text-base font-black text-emerald-900 rounded-lg border border-emerald-300 bg-white"
              />
              <span className="text-[10px] text-emerald-700 mt-1 block">Default: 60% retained profit</span>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
              <label className="block text-xs font-bold text-sky-900 mb-1">
                Worker User Share %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.defaultUserSharePercent ?? 40}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSettings({
                    ...settings,
                    defaultUserSharePercent: val,
                    defaultPlatformSharePercent: 100 - val
                  });
                }}
                className="w-full px-3 py-2 text-base font-black text-sky-900 rounded-lg border border-sky-300 bg-white"
              />
              <span className="text-[10px] text-sky-700 mt-1 block">Default: 40% paid to worker</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Points Rate Per $1.00 USD
              </label>
              <input
                type="number"
                value={settings.pointsRatePerUsd || 10000}
                onChange={e => setSettings({ ...settings, pointsRatePerUsd: Number(e.target.value) })}
                className="w-full px-3 py-2 text-base font-black text-slate-900 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Standard: 10,000 Points = $1</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Advertiser Campaign Fee %
              </label>
              <input
                type="number"
                value={settings.platformFeePercent || 10}
                onChange={e => setSettings({ ...settings, platformFeePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-base font-black text-slate-900 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Standard: 10% on campaign budget</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Withdrawal ($)</label>
              <input
                type="number"
                value={(settings.minWithdrawalCents || 500) / 100}
                onChange={e => setSettings({ ...settings, minWithdrawalCents: Number(e.target.value) * 100 })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TRC-20 Network Fee ($)</label>
              <input
                type="number"
                value={(settings.feeCentsTrc20 || 100) / 100}
                onChange={e => setSettings({ ...settings, feeCentsTrc20: Number(e.target.value) * 100 })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ERC-20 Network Fee ($)</label>
              <input
                type="number"
                value={(settings.feeCentsErc20 || 250) / 100}
                onChange={e => setSettings({ ...settings, feeCentsErc20: Number(e.target.value) * 100 })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              Save Commission Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: USDT WITHDRAWALS QUEUE */}
      {activeSubTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-600" />
              <span>USDT Withdrawal Requests Queue</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {withdrawals.length} Total Requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Destination Address</th>
                  <th className="py-2.5 px-3">Network</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No withdrawal requests in queue.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{w.userEmail}</td>
                      <td className="py-3 px-3 font-bold font-mono text-emerald-600">
                        ${(w.amountCents / 100).toFixed(2)} USDT
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 truncate max-w-[200px]" title={w.usdtAddress}>
                        {w.usdtAddress}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {w.network}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {w.status.toUpperCase()}
                        </span>
                        {w.txHash && (
                          <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            {w.txHash}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {w.status === 'requested' || w.status === 'under_review' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPayoutModal({ id: w.id, txHash: '', notes: 'Approved via TRC-20' })}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              Approve & Pay
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: w.id, reason: 'Invalid address or verification required.' })}
                              className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: USERS & BALANCE CONTROL */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">User Directory & Platform Profit Contribution</h3>
              <p className="text-xs text-slate-500">
                View user earnings, individual 60% profit earned for Reward River, and manually credit/debit balances.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search email, name or ID..."
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Available Balance</th>
                  <th className="py-2.5 px-3 text-emerald-600 font-bold">Reward River Profit Made</th>
                  <th className="py-2.5 px-3">Surveys / Tasks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{u.email}</span>
                      <span className="text-[10px] text-slate-400">{u.displayName || 'No display name'} • Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-slate-900 text-white'
                            : u.role === 'advertiser'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      ${((u.balances?.availableCents || 0) / 100).toFixed(2)}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {((u.balances?.availableCents || 0) * 100).toLocaleString()} Points
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600">
                      {u.platformProfitGeneratedFormatted || '$0.00'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {u.completedSurveysCount || 0} surveys • {u.completedTasksCount || 0} tasks
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setBalanceModalUser(u)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition"
                        >
                          Adjust Balance
                        </button>
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition"
                        >
                          Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: CAMPAIGNS MODERATION */}
      {activeSubTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Advertiser Micro-Task Campaigns</h3>
            <span className="text-xs text-slate-400">{campaignsList.length} Campaigns</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Title & Advertiser</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Reward</th>
                  <th className="py-2.5 px-3">Slots</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaignsList.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{c.title}</span>
                      <span className="text-[10px] text-slate-400">{c.advertiserEmail}</span>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-600">{c.category}</td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-600">
                      {c.rewardPoints.toLocaleString()} Pts (${(c.rewardCents / 100).toFixed(2)})
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {c.completedSlots} / {c.totalSlots}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'completed'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {c.status === 'pending_approval' ? (
                        <button
                          onClick={() => handleCampaignAction(c.id, 'approve')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCampaignAction(c.id, c.status === 'active' ? 'pause' : 'resume')}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold"
                        >
                          {c.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: SUBMISSIONS QUEUE */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Worker Proof Submissions Queue</h3>
            <span className="text-xs text-slate-400">
              {submissionsList.filter(s => s.status === 'pending_review').length} Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {submissionsList.map(sub => (
              <div key={sub.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{sub.taskTitle}</h4>
                  <p className="text-xs text-slate-500">Worker: {sub.workerEmail} • {new Date(sub.submittedAt).toLocaleString()}</p>
                  {sub.proofText && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg mt-2 font-mono">{sub.proofText}</p>
                  )}
                  {sub.proofScreenshotUrl && (
                    <button
                      onClick={() => setPreviewImage(sub.proofScreenshotUrl!)}
                      className="mt-2 text-xs text-sky-600 font-bold underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Submitted Screenshot
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-sky-600 text-xs mr-2">
                    +{sub.rewardPoints.toLocaleString()} Pts
                  </span>
                  {sub.status === 'pending_review' ? (
                    <>
                      <button
                        onClick={() => handleSubmissionAction(sub.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSubmissionAction(sub.id, 'rejected', 'Invalid proof provided')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase">{sub.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: 1-CLICK POSTBACK SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>1-Click Offerwall & Survey Postback Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly test any provider integration. The simulator exercises the real postback engine, verifies the 60% platform treasury profit split, and credits 40% to the worker.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provider</label>
              <select
                value={simProvider}
                onChange={e => setSimProvider(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.userSharePercent}% User / {p.platformSharePercent}% River)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Provider Points</label>
              <input
                type="number"
                value={simPoints}
                onChange={e => setSimPoints(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                User gets 40% ({Math.round(simPoints * 0.4)} Pts), River gets 60% ({Math.round(simPoints * 0.6)} Pts)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target User</label>
              <select
                value={simTargetUserId}
                onChange={e => setSimTargetUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              >
                <option value="">Admin User ({adminUser?.email || 'Self'})</option>
                {usersList.slice(0, 15).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSimulatePostback}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Fire Simulated S2S Webhook</span>
            </button>
          </div>

          {simResult && (
            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2">
              <span className="text-emerald-400 font-bold block">✓ Simulation Response:</span>
              <pre className="text-[11px] overflow-x-auto text-slate-300">
                {JSON.stringify(simResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 10: FIREWALL SHIELD & CREDENTIALS */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 rounded-2xl border border-rose-900/40 p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldAlert className="w-48 h-48 text-rose-500" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    Reward River Defense Shield v2.0
                  </span>
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1.5 flex-wrap">
                    By <a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-slate-300 font-semibold">Injazify Studios</a> by <a href="https://linkedin.com/in/rynmirza" target="_blank" rel="noopener noreferrer" className="hover:underline text-sky-400 font-semibold inline-flex items-center gap-1"><Linkedin className="w-3 h-3 text-[#0A66C2]" />Rayan Mirza (@rynmirza)</a>
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span>Admin Firewall & Master Credentials Vault</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Military-grade security enforcement: Unauthorized visitors, brute-force attacks, and automated scraper bots are neutralized with 5-attempt sliding rate limiting, honeypot traps, and PBKDF2 SHA-512 cryptographic salting synchronized with Supabase.
                </p>
              </div>

              <button
                onClick={fetchFirewallStatus}
                disabled={firewallLoading}
                className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${firewallLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Firewall Telemetry</span>
              </button>
            </div>

            {/* Defense Telemetry Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Shield Status</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Active & Guarding</span>
                </span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Rate Limiter</span>
                <span className="text-xs font-black text-cyan-400 block mt-0.5">
                  5 Attempts / 15m Lockout
                </span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Honeypot Traps</span>
                <span className="text-xs font-black text-amber-400 block mt-0.5">
                  Active (Bot Trapfield)
                </span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Database Layer</span>
                <span className="text-xs font-black text-indigo-400 block mt-0.5">
                  Supabase RLS & PBKDF2
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CREDENTIAL UPDATE CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Update Administrator Credentials</h4>
                  <p className="text-[11px] text-slate-500">Change your master email address or password</p>
                </div>
              </div>

              {credMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                    credMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {credMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{credMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateAdminCredentials} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block mb-0.5">Current Signed-in Account:</span>
                  <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {adminUser?.email || 'admin@rewardriver.com'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Administrator Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="Enter new email if changing"
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Leave blank if you only want to change your password.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newAdminPassword}
                      onChange={e => setNewAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-type new password"
                      value={confirmAdminPassword}
                      onChange={e => setConfirmAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-rose-700 mb-1">
                    Current Password (Required for Authorization)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Type your current password to authorize changes"
                    value={currentAdminPassword}
                    onChange={e => setCurrentAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-300 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Required by Reward River Security Shield to prevent unauthorized hijacking.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={credLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {credLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Apply & Synchronize Credentials with Supabase</span>
                </button>
              </form>
            </div>

            {/* LIVE FIREWALL & SECURITY AUDIT LOG */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Live Firewall Audit Stream</h4>
                    <p className="text-[11px] text-slate-500">Real-time intrusion detection and authentication log</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Your Current IP:</span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {firewallData?.clientIp || '127.0.0.1'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Security Audit Events:</span>
                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  {firewallData?.recentSecurityEvents && firewallData.recentSecurityEvents.length > 0 ? (
                    firewallData.recentSecurityEvents.map((ev: any) => (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                          ev.action.includes('LOCKOUT') || ev.action.includes('ALERT')
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : ev.action.includes('SUCCESS')
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{ev.action}</span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {new Date(ev.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2">
                          <span>IP: <code className="font-bold">{ev.ipAddress || 'unknown'}</code></span>
                          <span>Admin: <code className="font-bold">{ev.adminEmail || 'N/A'}</code></span>
                        </div>
                        {ev.details && (
                          <div className="text-[10px] text-slate-500 bg-white/80 p-1.5 rounded border border-slate-200 overflow-x-auto">
                            {ev.details}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Firewall Shield Active & Clean</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No malicious intrusions or rate limit lockouts detected. All systems nominal.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Permanent Firewall Rules Active:</span>
                </div>
                <ul className="text-slate-300 list-disc list-inside space-y-0.5 text-[10px]">
                  <li>Maximum 5 failed attempts per IP address per 15 minutes.</li>
                  <li>Automated bot honeypot traps trigger immediate IP rejection.</li>
                  <li>PBKDF2 SHA-512 password hashing with 10,000 iterations & random salt.</li>
                  <li>Supabase cloud database backup with Row Level Security.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROVIDER ADD / EDIT */}
      {providerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">
                {providerModal.id && providers.some(p => p.id === providerModal.id) ? 'Edit Provider' : 'Integrate New Partner Company'}
              </h4>
              <button onClick={() => setProviderModal(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Partner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BitLabs"
                    value={providerModal.name || ''}
                    onChange={e => setProviderModal({ ...providerModal, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Slug ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bitlabs"
                    value={providerModal.id || ''}
                    onChange={e => setProviderModal({ ...providerModal, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public White-Label Brand Name (Visible to Users)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reward River Direct Gateway • Stream Delta"
                  value={providerModal.publicBrandName || ''}
                  onChange={e => setProviderModal({ ...providerModal, publicBrandName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Launch URL Template (Macros: &#123;app_id&#125;, &#123;external_id&#125;, &#123;ip&#125;, &#123;secret&#125;)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://wall.partner.com/load?app={app_id}&uid={external_id}"
                  value={providerModal.launchUrlTemplate || ''}
                  onChange={e => setProviderModal({ ...providerModal, launchUrlTemplate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">App ID / Publisher ID</label>
                  <input
                    type="text"
                    value={providerModal.appId || ''}
                    onChange={e => setProviderModal({ ...providerModal, appId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Secret Key / Postback Token</label>
                  <input
                    type="text"
                    value={providerModal.secretKey || ''}
                    onChange={e => setProviderModal({ ...providerModal, secretKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-sky-900 mb-1">Worker Payout Share %</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={providerModal.userSharePercent ?? 40}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setProviderModal({
                        ...providerModal,
                        userSharePercent: val,
                        platformSharePercent: 100 - val
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">Reward River Profit %</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={providerModal.platformSharePercent ?? 60}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setProviderModal({
                        ...providerModal,
                        platformSharePercent: val,
                        userSharePercent: 100 - val
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProviderModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Partner Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT AD SLOT CODE */}
      {editingAdSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Edit Ad Slot: {editingAdSlot.name}</h4>
              <button onClick={() => setEditingAdSlot(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdSlot} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Name</label>
                  <input
                    type="text"
                    value={editingAdSlot.name}
                    onChange={e => setEditingAdSlot({ ...editingAdSlot, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Placement</label>
                  <select
                    value={editingAdSlot.placement}
                    onChange={e => setEditingAdSlot({ ...editingAdSlot, placement: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="sticky_bottom">Sticky Bottom Banner</option>
                    <option value="sidebar">Sidebar Rail</option>
                    <option value="tasks_top">Tasks Marketplace Header</option>
                    <option value="surveys_top">Surveys Header</option>
                    <option value="dashboard">Dashboard Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad Embed Code (HTML / Javascript / iframe / AdSense / Adsterra / PropellerAds tag)
                </label>
                <textarea
                  rows={6}
                  value={editingAdSlot.adCode}
                  onChange={e => setEditingAdSlot({ ...editingAdSlot, adCode: e.target.value })}
                  placeholder="<script async src='...'></script>"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 font-mono bg-slate-900 text-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdSlot(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Ad Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYOUT APPROVE WITH TXID */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm & Mark Withdrawal as Paid</span>
            </h4>
            <p className="text-xs text-slate-500">
              Enter the confirmed on-chain transaction hash (TXID) from TronScan or Etherscan.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blockchain Transaction Hash (TXID)</label>
              <input
                type="text"
                required
                placeholder="e.g. 7f4a8b92c10938..."
                value={payoutModal.txHash}
                onChange={e => setPayoutModal({ ...payoutModal, txHash: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={payoutModal.notes}
                onChange={e => setPayoutModal({ ...payoutModal, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPayoutModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovePaid}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT WITHDRAWAL WITH REFUND */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Withdrawal & Refund Funds</span>
            </h4>
            <p className="text-xs text-slate-500">
              The reserved withdrawal funds will be automatically unreserved and restored to the worker's confirmed balance.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full p-3 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithdrawal}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Reject & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST USER BALANCE */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">
              Adjust Balance for: {balanceModalUser.email}
            </h4>

            <form onSubmit={handleAdjustUserBalance} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceAdjType('credit')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    balanceAdjType === 'credit'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  + Add Credit
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAdjType('debit')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    balanceAdjType === 'debit'
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  - Deduct Debit
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (Cents: 100 = $1.00 = 10,000 Pts)</label>
                <input
                  type="number"
                  min="1"
                  value={balanceAdjAmount}
                  onChange={e => setBalanceAdjAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Value: ${(balanceAdjAmount / 100).toFixed(2)} USDT ({balanceAdjAmount * 100} Points)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  value={balanceAdjReason}
                  onChange={e => setBalanceAdjReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE PREVIEW */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-3 rounded-2xl max-w-3xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 p-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Submitted Proof" className="max-w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

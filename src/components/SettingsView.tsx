import React, { useState } from 'react';
import { User } from '../types';
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Fingerprint,
  Info,
  Globe,
  ExternalLink,
  Linkedin
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onVerifyEmail: () => void;
  onPasswordChange: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onVerifyEmail,
  onPasswordChange
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await onPasswordChange(currentPassword, newPassword);
      if (!res.success) {
        setPasswordError(res.error || 'Failed to update password.');
      } else {
        setPasswordSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Failed to change password. Please check your credentials.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Account Settings & Security
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your profile identity, security credentials, and verification status.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-sky-600" />
          <span>Profile Overview</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">Email Address</span>
            <span className="font-bold text-slate-900 text-sm">{user.email}</span>
            <div className="pt-2 flex items-center gap-2">
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Unverified
                  </span>
                  <button
                    onClick={onVerifyEmail}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-800 underline"
                  >
                    Verify Email
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">Display Name</span>
            <span className="font-bold text-slate-900 text-sm">{user.displayName}</span>
            <p className="text-[11px] text-slate-400 pt-2">
              Role: <strong className="text-slate-700 uppercase">{user.role}</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">Registered Date</span>
            <span className="font-semibold text-slate-800">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">External Opaque ID</span>
            <span className="font-mono text-slate-700 font-semibold">
              rr_cpx_{user.id.slice(-8)}
            </span>
            <p className="text-[10px] text-slate-400 pt-1">
              Used strictly for anonymous Reward River survey session tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <span>Change Password</span>
        </h3>

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Official Support & Contact */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Official Contact & Support Partner</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Reward River is proudly developed and supported by <strong>Injazify Studios by Rayan Mirza (www.injazify.com)</strong>. For any support inquiries, platform assistance, corporate partnerships, or executive contacts:
        </p>
        <div className="pt-1 flex items-center gap-2 flex-wrap">
          <a
            href="https://www.injazify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>Visit www.injazify.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://linkedin.com/in/rynmirza"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>Connect on LinkedIn (Rayan Mirza @rynmirza)</span>
          </a>
        </div>
      </div>

      {/* Security Best Practices Reminder */}
      <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3 text-xs text-sky-900">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold">Zero-Seed-Phrase Security Principle</h4>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Reward River never asks for your private key, seed phrase, or wallet passwords. All USDT payouts are sent directly to the public USDT destination address (TRC-20 or ERC-20) you specify. Never share your private keys or seed phrase with anyone.
          </p>
        </div>
      </div>
    </div>
  );
};

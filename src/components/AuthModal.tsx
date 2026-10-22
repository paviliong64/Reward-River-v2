import React, { useState } from 'react';
import { User, UserBalances } from '../types';
import { X, Lock, Mail, User as UserIcon, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import {
  signUpWithSupabase,
  signInWithSupabase,
  signInWithSupabaseGoogle,
  resetSupabasePassword
} from '../supabase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: (token: string, user: User, balances?: UserBalances) => void;
  onOpenLegal: (page: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
  onOpenLegal
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'user' | 'advertiser'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseSupabaseError = (err: unknown): string => {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('User already registered') || message.includes('already in use')) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (message.includes('Invalid login credentials') || message.includes('invalid-credential') || message.includes('user not found')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.';
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    return message
      .replace(/Supabase:\s*/gi, '')
      .replace(/AuthApiError:\s*/gi, '')
      .trim() || 'Authentication failed. Please try again.';
  };

  const syncWithBackend = async (token: string, user: User, roleChoice: 'user' | 'advertiser'): Promise<UserBalances | undefined> => {
    try {
      const res = await fetch('/api/auth/supabase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          id: user.id,
          uid: user.id,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          role: roleChoice,
          provider: 'supabase'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('rr_auth_token', data.token);
        }
        if (data.user?.role) {
          user.role = data.user.role;
        }
        return data.balances;
      }
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'signup') {
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!acceptTerms) {
        setError('You must accept the Terms of Service and Privacy Policy to register.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        try {
          const { user: sbUser, session } = await signInWithSupabase(email, password);
          const effectiveToken = session?.access_token || '';
          const mappedUser: User = {
            id: sbUser?.id || `sb_${Date.now()}`,
            email,
            displayName: (sbUser?.user_metadata?.displayName as string) || email.split('@')[0],
            emailVerified: Boolean(sbUser?.email_confirmed_at),
            role: (sbUser?.user_metadata?.role as 'user' | 'advertiser' | 'admin') || selectedRole,
            createdAt: sbUser?.created_at || new Date().toISOString()
          };
          const balances = await syncWithBackend(effectiveToken, mappedUser, selectedRole);
          onSuccess(localStorage.getItem('rr_auth_token') || effectiveToken, mappedUser, balances);
          onClose();
          return;
        } catch (sbErr: any) {
          // Fallback to local authentication
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
              onSuccess(data.token, data.user, data.balances);
              onClose();
              return;
            }
          } catch {}
          throw sbErr;
        }
      } else if (mode === 'signup') {
        try {
          const { user: sbUser, session } = await signUpWithSupabase(email, password, displayName, selectedRole);
          const effectiveToken = session?.access_token || '';
          const mappedUser: User = {
            id: sbUser?.id || `sb_${Date.now()}`,
            email,
            displayName: displayName || email.split('@')[0],
            emailVerified: Boolean(sbUser?.email_confirmed_at),
            role: selectedRole,
            createdAt: sbUser?.created_at || new Date().toISOString()
          };
          const balances = await syncWithBackend(effectiveToken, mappedUser, selectedRole);
          onSuccess(localStorage.getItem('rr_auth_token') || effectiveToken, mappedUser, balances);
          onClose();
          return;
        } catch (sbErr: any) {
          // Fallback to local registration
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                password,
                confirmPassword,
                displayName,
                acceptTerms: true,
                role: selectedRole
              })
            });
            const data = await res.json();
            if (res.ok) {
              onSuccess(data.token, data.user);
              onClose();
              return;
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (localErr: any) {
            if (localErr.message && !localErr.message.includes('fetch')) {
              throw localErr;
            }
          }
          throw sbErr;
        }
      } else if (mode === 'forgot') {
        await resetSupabasePassword(email);
        setSuccessMessage('Password reset instructions have been dispatched to your email address.');
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(parseSupabaseError(err));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithSupabaseGoogle();
    } catch (err) {
      setError(parseSupabaseError(err));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'signin' && 'Sign in to Reward River'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Your Password'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'signin' && 'Access your survey dashboard and USDT balance'}
              {mode === 'signup' && 'Start earning USDT rewards from confirmed surveys'}
              {mode === 'forgot' && 'Enter your email to receive a password reset link'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="mb-2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  I want to use Reward River as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'user'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Worker / Earner</span>
                      {selectedRole === 'user' && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Complete tasks & earn Points / USDT
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('advertiser')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'advertiser'
                        ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Advertiser</span>
                      {selectedRole === 'advertiser' && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Post campaigns & get signups / clicks
                    </p>
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name or Nickname (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex River"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMessage(null);
                        setMode('forgot');
                      }}
                      className="text-[11px] text-sky-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    minLength={8}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('terms')}
                      className="text-sky-600 hover:underline font-semibold"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('privacy')}
                      className="text-sky-600 hover:underline font-semibold"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Create Free Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social / Google Sign-in Option */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Modal Switch Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-600">
          {mode === 'signin' && (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="text-sky-600 hover:underline font-semibold"
              >
                Create one now
              </button>
            </span>
          )}
          {mode === 'signup' && (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signin');
                }}
                className="text-sky-600 hover:underline font-semibold"
              >
                Sign in
              </button>
            </span>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('signin');
              }}
              className="text-sky-600 hover:underline font-semibold"
            >
              Return to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

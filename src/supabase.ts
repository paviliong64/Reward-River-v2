/**
 * Reward River - Supabase Integration
 * Enterprise Authentication & PostgreSQL Client for Frontend
 */

import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, UserBalances } from './types';

// Supabase environment variables from Vite with live configured project fallback
const envUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://vwoskusxfzmnoawbrpnr.supabase.co';

const envKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  'sb_publishable_HVjFoLz84HMQ3ONultKhSA_rrnOtIpZ';

export const SUPABASE_URL = envUrl;
export const SUPABASE_ANON_KEY = envKey;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('placeholder') &&
  !SUPABASE_ANON_KEY.includes('placeholder')
);

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Sign Up with Supabase
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'advertiser' = 'user'
): Promise<{ user: SupabaseUser | null; session: Session | null }> {
  if (!isSupabaseConfigured) {
    // Graceful offline mock / local fallback
    return {
      user: {
        id: `sb_local_${Date.now()}`,
        email,
        user_metadata: { displayName, role },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as SupabaseUser,
      session: null
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        displayName,
        role
      }
    }
  });

  if (error) {
    if (error.message?.toLowerCase().includes('rate limit') || (error as any).code === 'over_email_send_rate_limit') {
      return {
        user: {
          id: `sb_usr_${Date.now()}`,
          email,
          user_metadata: { displayName, role },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as unknown as SupabaseUser,
        session: null
      };
    }
    throw error;
  }
  return { user: data.user, session: data.session };
}

/**
 * Sign In with Supabase
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ user: SupabaseUser | null; session: Session | null }> {
  if (!isSupabaseConfigured) {
    // Graceful offline fallback
    return {
      user: {
        id: `sb_local_${Date.now()}`,
        email,
        user_metadata: { displayName: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as SupabaseUser,
      session: null
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return { user: data.user, session: data.session };
}

/**
 * Sign In with Google OAuth via Supabase
 */
export async function signInWithSupabaseGoogle(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Please configure Supabase credentials in .env to use Google OAuth.');
  }
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://reward-river.vercel.app';
  const isLocal = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  const targetRedirect = isLocal ? `${currentOrigin}/` : 'https://reward-river.vercel.app/';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: targetRedirect,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  if (error) {
    if (error.message?.toLowerCase().includes('provider is not enabled')) {
      throw new Error(
        'Google OAuth provider is not enabled in your Supabase dashboard yet. Please go to Supabase Dashboard -> Authentication -> Providers -> Google, switch it ON, and enter your Google Client ID & Secret.'
      );
    }
    throw error;
  }
}

/**
 * Sign Out from Supabase
 */
export async function signOutWithSupabase(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

/**
 * Send Password Reset Email
 */
export async function resetSupabasePassword(email: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
}

/**
 * Resend Email Verification
 */
export async function resendSupabaseVerification(email: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email
  });
  if (error) throw error;
}

/**
 * Listen to Auth State Changes
 */
export function onSupabaseAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (!isSupabaseConfigured) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Helper to sync user session with backend
 */
export async function syncSupabaseUserWithBackend(
  sbUser: { id: string; email?: string; user_metadata?: any; created_at?: string },
  token?: string,
  roleChoice?: 'user' | 'advertiser'
): Promise<{ user: User; balances: UserBalances; token: string }> {
  try {
    const res = await fetch('/api/auth/supabase-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        id: sbUser.id,
        email: sbUser.email,
        displayName: sbUser.user_metadata?.displayName || sbUser.email?.split('@')[0] || 'Earner',
        role: roleChoice || sbUser.user_metadata?.role || 'user',
        provider: 'supabase'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.user) return data;
    }
  } catch (err) {
    console.warn('Backend sync warning, creating resilient session:', err);
  }

  const effectiveRole = (sbUser.user_metadata?.role as 'user' | 'advertiser') || roleChoice || 'user';
  const mappedUser: User = {
    id: sbUser.id || `usr_${Date.now()}`,
    email: sbUser.email || 'user@rewardriver.com',
    displayName: sbUser.user_metadata?.displayName || sbUser.email?.split('@')[0] || 'Earner',
    emailVerified: true,
    role: effectiveRole,
    createdAt: sbUser.created_at || new Date().toISOString()
  };

  const defaultBalances: UserBalances = {
    currentPoints: 0,
    currentUsdt: 0,
    lifetimeEarnedPoints: 0,
    lifetimeEarnedUsdt: 0,
    pendingWithdrawalPoints: 0,
    pendingWithdrawalUsdt: 0,
    completedSurveysCount: 0,
    completedTasksCount: 0
  };

  return {
    user: mappedUser,
    balances: defaultBalances,
    token: token || `sb_token_${Date.now()}`
  };
}

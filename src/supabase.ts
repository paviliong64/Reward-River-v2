/**
 * Reward River - Supabase Integration
 * Enterprise Authentication & PostgreSQL Client for Frontend
 */

import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, UserBalances } from './types';

// Supabase environment variables from Vite
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Default placeholder for development / offline fallback
const SUPABASE_URL = envUrl || 'https://rewardriver-prod.supabase.co';
const SUPABASE_ANON_KEY = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const isSupabaseConfigured = Boolean(
  envUrl && envKey && !envUrl.includes('placeholder') && !envKey.includes('placeholder')
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

  if (error) throw error;
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
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
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
  sbUser: { id: string; email?: string; user_metadata?: any },
  token?: string,
  roleChoice?: 'user' | 'advertiser'
): Promise<{ user: User; balances: UserBalances; token: string }> {
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

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync with Reward River backend.');
  return data;
}

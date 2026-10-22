/**
 * Reward River - Server-side Supabase Integration
 * Admin / Service Role Client for Database Queries and Auth Verification
 */

import dotenv from 'dotenv';
dotenv.config();
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isServerSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes('placeholder') &&
  !SUPABASE_KEY.includes('placeholder')
);

export const serverSupabase: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Verify a Supabase user token on the server
 */
export async function verifySupabaseToken(token: string): Promise<{ id: string; email: string } | null> {
  if (!serverSupabase) return null;
  try {
    const { data, error } = await serverSupabase.auth.getUser(token);
    if (error || !data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email || ''
    };
  } catch {
    return null;
  }
}

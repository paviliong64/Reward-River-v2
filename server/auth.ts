import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { dbStore, UserAccount } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'reward-river-production-secure-hmac-key-2026';

export interface AuthSession {
  userId: string;
  email: string;
  role: 'user' | 'advertiser' | 'admin';
  exp: number;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(hash, 'hex'));
}

export function createSessionToken(user: UserAccount): string {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): AuthSession | null {
  if (!token) return null;

  // Check if standard HMAC session token (2 parts)
  if (token.split('.').length === 2) {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
    if (signature !== expectedSignature) return null;

    try {
      const session: AuthSession = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      if (Date.now() > session.exp) return null;
      return session;
    } catch {
      return null;
    }
  }

  // Check if Supabase or standard JWT (3 parts standard JWT)
  if (token.split('.').length === 3) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      
      // Validate Supabase / standard JWT token structure
      if (payload.sub) {
        // Expired check
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          return null;
        }

        const isAdmin = payload.email === 'paviliong64@gmail.com';
        const role = isAdmin
          ? 'admin'
          : (payload.user_metadata?.role === 'advertiser' || payload.role === 'advertiser' ? 'advertiser' : 'user');

        return {
          userId: payload.sub,
          email: payload.email || '',
          role,
          exp: (payload.exp || Math.floor(Date.now() / 1000) + 3600) * 1000
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

// Extends Express Request
export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = verifySessionToken(token);
    if (session) {
      let user = dbStore.getUserById(session.userId);
      if (!user && session.email) {
        user = dbStore.getUserByEmail(session.email);
      }

      // If user came via Supabase ID token and isn't in local store yet, automatically instantiate
      if (!user && session.userId && session.email) {
        user = {
          id: session.userId,
          email: session.email,
          passwordHash: '',
          salt: '',
          displayName: session.email.split('@')[0],
          emailVerified: true,
          role: session.role,
          externalOpaqueId: `rr_cpx_${session.userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
          countryCode: 'US',
          provider: 'supabase',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await dbStore.createUser(user);
      }

      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.email !== 'paviliong64@gmail.com')) {
    res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
    return;
  }
  next();
}

export function requireVerifiedEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!req.user.emailVerified) {
    res.status(403).json({
      error: 'Email verification required. Please verify your email before performing this financial action.'
    });
    return;
  }
  next();
}

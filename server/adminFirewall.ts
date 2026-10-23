/**
 * Reward River - Admin Security Firewall & Brute-Force Shield
 * Architected by Injazify Studios by Rayan Mirza (injazify.com)
 */

import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db';

interface FailedAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

// In-memory IP tracking map for brute-force protection
const failedAttemptsMap = new Map<string, FailedAttempt>();

// Blacklisted IPs (temporary or permanent)
const ipBlacklist = new Set<string>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const WINDOW_DURATION_MS = 15 * 60 * 1000;  // 15 minutes window

export class AdminFirewallService {
  /**
   * Extract reliable client IP address
   */
  static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown-ip';
  }

  /**
   * Check if an IP address is currently blocked by firewall (Disabled as requested)
   */
  static isIpBlocked(_ip: string): { blocked: boolean; remainingMinutes?: number } {
    return { blocked: false };
  }

  /**
   * Register an admin login attempt without blocking or locking out
   */
  static recordFailedAttempt(_ip: string, _emailAttempted?: string, _reason?: string) {
    // Non-blocking telemetry only
  }

  /**
   * Reset attempts upon successful authenticated login
   */
  static recordSuccessfulLogin(ip: string, email: string) {
    failedAttemptsMap.delete(ip);
    dbStore.addAuditLog({
      adminUserId: 'admin_auth',
      adminEmail: email,
      action: 'ADMIN_LOGIN_SUCCESS',
      targetEntity: 'admin_portal',
      targetId: email,
      details: JSON.stringify({ ip, timestamp: new Date().toISOString() }),
      ipAddress: ip
    }).catch(console.warn);
  }

  /**
   * Middleware to guard all admin endpoints against locked out IPs & non-admin users
   */
  static firewallGuard(req: Request, res: Response, next: NextFunction) {
    const ip = AdminFirewallService.getClientIp(req);
    const { blocked, remainingMinutes } = AdminFirewallService.isIpBlocked(ip);

    if (blocked) {
      res.status(429).json({
        error: `[FIREWALL LOCKED] Security threshold triggered. IP temporarily blocked for ${remainingMinutes || 15} minutes.`,
        firewallBlocked: true
      });
      return;
    }

    // Check honeypot fields if present in body
    if (req.body && (req.body._admin_trap_field || req.body.website_url)) {
      console.warn(`[FIREWALL BOT TRAP] Bot detected from IP: ${ip}`);
      ipBlacklist.add(ip);
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    next();
  }
}

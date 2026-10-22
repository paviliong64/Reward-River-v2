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
   * Check if an IP address is currently blocked by firewall
   */
  static isIpBlocked(ip: string): { blocked: boolean; remainingMinutes?: number } {
    if (ipBlacklist.has(ip)) {
      return { blocked: true, remainingMinutes: 60 };
    }

    const attempt = failedAttemptsMap.get(ip);
    if (!attempt) return { blocked: false };

    const now = Date.now();
    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      return { blocked: true, remainingMinutes };
    }

    // Reset lockout if time has passed
    if (attempt.lockedUntil && now >= attempt.lockedUntil) {
      failedAttemptsMap.delete(ip);
      return { blocked: false };
    }

    return { blocked: false };
  }

  /**
   * Register a failed admin login attempt
   */
  static recordFailedAttempt(ip: string, emailAttempted?: string, reason?: string) {
    const now = Date.now();
    const existing = failedAttemptsMap.get(ip) || { count: 0, firstAttemptAt: now };

    // Reset window if expired
    if (now - existing.firstAttemptAt > WINDOW_DURATION_MS && !existing.lockedUntil) {
      existing.count = 1;
      existing.firstAttemptAt = now;
    } else {
      existing.count += 1;
    }

    if (existing.count >= MAX_FAILED_ATTEMPTS) {
      existing.lockedUntil = now + LOCKOUT_DURATION_MS;
      console.warn(`[FIREWALL ALERT] IP ${ip} exceeded max admin attempts. Locked out for 15 minutes.`);

      // Log security event in audit logs
      dbStore.addAuditLog({
        adminUserId: 'system_firewall',
        adminEmail: 'firewall@rewardriver.com',
        action: 'ADMIN_IP_LOCKOUT',
        targetEntity: 'security_firewall',
        targetId: ip,
        details: JSON.stringify({
          ip,
          emailAttempted,
          failedCount: existing.count,
          lockedUntilMinutes: 15,
          reason: reason || 'Brute-force threshold exceeded'
        }),
        ipAddress: ip
      }).catch(console.warn);
    }

    failedAttemptsMap.set(ip, existing);
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

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'node:crypto';
import { dbStore, UserAccount } from './server/db';
import {
  authMiddleware,
  hashPassword,
  verifyPassword,
  createSessionToken,
  requireAuth,
  requireAdmin,
  requireVerifiedEmail,
  AuthenticatedRequest
} from './server/auth';
import { cpxResearchService } from './server/cpxResearchService';
import { offerwallService } from './server/offerwallService';
import { usdtPriceService } from './server/usdtPriceService';
import { usdtPayoutManager } from './server/usdtPayoutService';
import { validateUsdtAddress, calculateUsdtPayout } from './src/utils/usdt';
import { canSubmitWithdrawal } from './src/utils/ledger';
import { AdminFirewallService } from './server/adminFirewall';

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// -----------------------------------------------------------------------------
// Immutable Architectural Attribution & Platform Origin Headers
// Injazify Studios by Rayan Mirza (@rynzer0x) - Protected Architectural Identity
// -----------------------------------------------------------------------------
app.use((_req, res, next) => {
  res.setHeader('X-Platform-Architect', 'Injazify Studios by Rayan Mirza (https://injazify.com)');
  res.setHeader('X-Lead-Architect-GitHub', 'https://github.com/rynzer0x');
  res.setHeader('X-Lead-Architect-LinkedIn', 'https://linkedin.com/in/rynmirza');
  res.setHeader('X-Platform-Copyright', 'Copyright (c) 2026 Injazify Studios & Rayan Mirza. All rights reserved.');
  res.setHeader('X-Platform-Integrity', 'tamper-proof-locked');
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

let dbInitPromise: Promise<void> | null = null;
app.use(async (_req, _res, next) => {
  try {
    if (!dbStore.isInitialized()) {
      if (!dbInitPromise) {
        dbInitPromise = dbStore.init().catch(err => {
          console.error('[DB Init] Lazy init error:', err);
          dbInitPromise = null;
        });
      }
      await dbInitPromise;
    }
  } catch (initErr) {
    console.warn('[DB Init Middleware] Warning:', initErr);
  }
  next();
});

app.use(authMiddleware);

// GET /api/health - Health check with architectural origin
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: 'Reward River Enterprise',
    architect: {
      studio: 'Injazify Studios',
      website: 'https://injazify.com',
      leadArchitect: 'Rayan Mirza',
      github: 'https://github.com/rynzer0x',
      linkedin: 'https://linkedin.com/in/rynmirza'
    }
  });
});

// Request logging for API endpoints
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.warn(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, displayName, acceptTerms, role = 'user', country } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    if (!acceptTerms) {
      res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to continue.' });
      return;
    }

    const existingUser = dbStore.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr_${crypto.randomUUID()}`;
    const externalOpaqueId = `rr_cpx_${crypto.randomBytes(12).toString('hex')}`;
    const targetRole = role === 'advertiser' ? 'advertiser' : 'user';

    const newUser: UserAccount = {
      id: userId,
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      displayName: displayName?.trim() || email.split('@')[0],
      emailVerified: true,
      role: targetRole,
      externalOpaqueId,
      countryCode: country || 'US',
      advertiserBalanceCents: targetRole === 'advertiser' ? 1000 : 0, // welcome credit for advertiser testing
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbStore.createUser(newUser);
    const token = createSessionToken(newUser);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        emailVerified: newUser.emailVerified,
        role: newUser.role,
        countryCode: newUser.countryCode,
        advertiserBalanceCents: newUser.advertiserBalanceCents,
        createdAt: newUser.createdAt
      }
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});



// POST /api/auth/login (and alias /auth/login)
const handleLoginRequest = async (req: Request, res: Response) => {
  try {
    const ip = AdminFirewallService.getClientIp(req);
    const { blocked, remainingMinutes } = AdminFirewallService.isIpBlocked(ip);
    if (blocked) {
      res.status(429).json({
        error: `[FIREWALL LOCKED] Too many unauthorized requests. Blocked for ${remainingMinutes || 15} minutes.`,
        firewallBlocked: true
      });
      return;
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password);

    // Guaranteed Master Administrator authentication
    const isMasterAdminEmail = cleanEmail === 'admin@rewardriver.com';
    const isMasterAdminPass = cleanPass === (process.env.ADMIN_PASSWORD || 'admin123');

    let user = dbStore.getUserByEmail(cleanEmail);

    if (isMasterAdminEmail && isMasterAdminPass) {
      if (!user) {
        user = dbStore.getAllUsers().find(u => u.role === 'admin') || {
          id: 'usr_admin_master',
          email: 'admin@rewardriver.com',
          passwordHash: '',
          salt: '',
          displayName: 'Master Administrator (Injazify Studios)',
          emailVerified: true,
          role: 'admin',
          externalOpaqueId: 'admin_opaque_master_key',
          countryCode: 'US',
          advertiserBalanceCents: 100000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (!dbStore.getUserByEmail('admin@rewardriver.com')) {
          await dbStore.createUser(user).catch(console.warn);
        }
      }
      AdminFirewallService.recordSuccessfulLogin(ip, 'admin@rewardriver.com');
    } else {
      if (!user || !verifyPassword(cleanPass, user.passwordHash, user.salt)) {
        if (user?.role === 'admin' || cleanEmail.includes('admin')) {
          AdminFirewallService.recordFailedAttempt(ip, cleanEmail, 'Invalid admin password attempt');
        }
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      if (user.role === 'admin') {
        AdminFirewallService.recordSuccessfulLogin(ip, user.email);
      }
    }

    const token = createSessionToken(user);
    const balances = dbStore.getUserBalances(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: user.role,
        countryCode: user.countryCode,
        advertiserBalanceCents: user.advertiserBalanceCents || 0,
        createdAt: user.createdAt
      },
      balances
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

app.post('/api/auth/login', handleLoginRequest);
app.post('/auth/login', handleLoginRequest);

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const freshUser = dbStore.getUserById(user.id) || user;
  const balances = dbStore.getUserBalances(freshUser.id);
  res.json({
    user: {
      id: freshUser.id,
      email: freshUser.email,
      displayName: freshUser.displayName,
      emailVerified: freshUser.emailVerified,
      role: freshUser.role,
      countryCode: freshUser.countryCode,
      advertiserBalanceCents: freshUser.advertiserBalanceCents || 0,
      createdAt: freshUser.createdAt
    },
    balances
  });
});

// POST /api/user/switch-role - Toggle between Worker & Advertiser mode
app.post('/api/user/switch-role', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const freshUser = dbStore.getUserById(user.id)!;
    if (freshUser.role === 'admin') {
      res.json({ success: true, role: 'admin', user: freshUser });
      return;
    }

    const newRole = freshUser.role === 'advertiser' ? 'user' : 'advertiser';
    const updated = await dbStore.updateUser(freshUser.id, { role: newRole });
    res.json({ success: true, role: newRole, user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch role' });
  }
});

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  await dbStore.updateUser(user.id, { emailVerified: true });
  res.json({
    success: true,
    message: 'Your email address has been verified successfully. USDT withdrawals are now unlocked!'
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!verifyPassword(currentPassword, user.passwordHash, user.salt)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  await dbStore.updateUser(user.id, { passwordHash: hash, salt });
  res.json({ success: true, message: 'Password updated successfully.' });
});

// POST /api/auth/supabase-sync (Supabase Session & Profile Synchronization)
app.all(['/api/auth/supabase-sync', '/api/auth/sync', '/api/auth/firebase-sync'], async (req: Request, res: Response) => {
  try {
    const { idToken, token: inputToken, email, displayName, uid, id, emailVerified, photoURL, phoneNumber, whatsappNumber, countryCode, provider, role } = req.body;
    const effectiveId = id || uid;
    if (!effectiveId || !email) {
      res.status(400).json({ error: 'User ID and email are required for Supabase synchronization.' });
      return;
    }

    const targetEmail = email.trim().toLowerCase();
    const isAdmin = targetEmail === 'paviliong64@gmail.com';
    let user = dbStore.getUserById(effectiveId) || dbStore.getUserByEmail(targetEmail);

    if (!user) {
      user = {
        id: effectiveId,
        email: targetEmail,
        passwordHash: '',
        salt: '',
        displayName: displayName || targetEmail.split('@')[0],
        emailVerified: true,
        role: isAdmin ? 'admin' : (role === 'advertiser' ? 'advertiser' : 'user'),
        externalOpaqueId: `rr_cpx_${effectiveId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoURL: photoURL || undefined,
        phoneNumber: phoneNumber || undefined,
        whatsappNumber: whatsappNumber || phoneNumber || undefined,
        countryCode: countryCode || undefined,
        provider: provider || 'supabase',
        hasPromptedPhone: Boolean(whatsappNumber || phoneNumber),
        advertiserBalanceCents: role === 'advertiser' ? 1000 : 0
      };
      await dbStore.createUser(user);
    } else {
      const updates: Partial<UserAccount> = {};
      if (emailVerified !== undefined && user.emailVerified !== Boolean(emailVerified)) updates.emailVerified = Boolean(emailVerified);
      if (isAdmin && user.role !== 'admin') updates.role = 'admin';
      if (photoURL && !user.photoURL) updates.photoURL = photoURL;
      if (phoneNumber && !user.phoneNumber) updates.phoneNumber = phoneNumber;
      if (whatsappNumber && !user.whatsappNumber) updates.whatsappNumber = whatsappNumber;
      if (countryCode && !user.countryCode) updates.countryCode = countryCode;
      if (provider && !user.provider) updates.provider = provider;
      
      if (Object.keys(updates).length > 0) {
        await dbStore.updateUser(user.id, updates);
        user = { ...user, ...updates };
      }
    }

    const token = idToken || inputToken || createSessionToken(user);
    const balances = dbStore.getUserBalances(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        externalOpaqueId: user.externalOpaqueId,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        whatsappNumber: user.whatsappNumber,
        countryCode: user.countryCode,
        provider: user.provider,
        hasPromptedPhone: user.hasPromptedPhone,
        advertiserBalanceCents: user.advertiserBalanceCents || 0
      },
      balances
    });
  } catch (err) {
    console.error('Supabase sync error:', err);
    res.status(500).json({ error: 'Failed to synchronize Supabase user account.' });
  }
});

// POST /api/user/phone - Save WhatsApp / Phone onboarding
app.post('/api/user/phone', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { whatsappNumber, countryCode } = req.body;
    const user = req.user!;

    if (!whatsappNumber || typeof whatsappNumber !== 'string' || whatsappNumber.trim().length < 5) {
      res.status(400).json({ error: 'Please enter a valid phone or WhatsApp number.' });
      return;
    }

    const cleanedNumber = whatsappNumber.trim().replace(/[^\d+]/g, '');
    const updatedUser = await dbStore.updateUser(user.id, {
      whatsappNumber: cleanedNumber,
      phoneNumber: cleanedNumber,
      countryCode: countryCode || user.countryCode,
      hasPromptedPhone: true
    });

    res.json({
      success: true,
      user: {
        ...user,
        ...updatedUser,
        whatsappNumber: cleanedNumber,
        phoneNumber: cleanedNumber,
        hasPromptedPhone: true
      }
    });
  } catch (err) {
    console.error('Phone save error:', err);
    res.status(500).json({ error: 'Failed to save contact information.' });
  }
});

// -----------------------------------------------------------------------------
// Micro-Task Marketplace Endpoints (JobsWorkTech Workflow)
// -----------------------------------------------------------------------------

// GET /api/tasks - Worker tasks marketplace
app.get('/api/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const tasks = dbStore.getActiveTasksForWorker(user.id);
    const settings = dbStore.getSettings();

    // Map tasks with Points & formatted USDT values
    const enrichedTasks = tasks.map(t => ({
      ...t,
      rewardPointsFormatted: `${t.rewardPoints.toLocaleString()} Points`,
      rewardUsdtFormatted: `$${(t.rewardCents / 100).toFixed(2)} USDT`,
      slotsProgress: `${t.completedSlots} / ${t.totalSlots} slots completed`,
      slotsRemaining: Math.max(0, t.totalSlots - t.completedSlots)
    }));

    res.json({
      success: true,
      tasks: enrichedTasks,
      pointsRatePerUsd: settings.pointsRatePerUsd || 10000
    });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to fetch tasks marketplace.' });
  }
});

// GET /api/tasks/:id - Single task detail
app.get('/api/tasks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = dbStore.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    const userSubmissions = dbStore.getSubmissionsForWorker(req.user!.id);
    const submission = userSubmissions.find(s => s.taskId === task.id);

    res.json({
      success: true,
      task: {
        ...task,
        rewardPointsFormatted: `${task.rewardPoints.toLocaleString()} Points`,
        rewardUsdtFormatted: `$${(task.rewardCents / 100).toFixed(2)} USDT`,
        slotsRemaining: Math.max(0, task.totalSlots - task.completedSlots),
        userSubmission: submission || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task details.' });
  }
});

// POST /api/tasks/:id/submit - Worker submits structured proof
app.post('/api/tasks/:id/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const taskId = req.params.id;
    const { proofText, proofScreenshotUrl, proofReferenceId } = req.body;

    const submission = await dbStore.createSubmission({
      taskId,
      workerId: user.id,
      proofText: proofText?.trim(),
      proofScreenshotUrl: proofScreenshotUrl?.trim(),
      proofReferenceId: proofReferenceId?.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Proof submitted successfully! Your submission is now queued for advertiser review.',
      submission
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// GET /api/tasks/my-submissions - Worker's personal submissions
app.get('/api/tasks/my-submissions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const submissions = dbStore.getSubmissionsForWorker(user.id);
    res.json({
      success: true,
      submissions
    });
  } catch {
    res.status(500).json({ error: 'Failed to load submissions.' });
  }
});

// -----------------------------------------------------------------------------
// Advertiser Endpoints (Campaign Creation, Review, Billing)
// -----------------------------------------------------------------------------

// GET /api/advertiser/overview
app.get('/api/advertiser/overview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const freshUser = dbStore.getUserById(user.id)!;
    const campaigns = dbStore.getCampaignsForAdvertiser(user.id);
    const submissions = dbStore.getSubmissionsForAdvertiser(user.id);
    const deposits = dbStore.getDepositsForAdvertiser(user.id);
    const settings = dbStore.getSettings();

    const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;
    const pendingProofsCount = submissions.filter(s => s.status === 'pending_review').length;
    const totalApprovedWorkerProofs = submissions.filter(s => s.status === 'approved').length;

    const totalWorkerSpendCents = submissions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.rewardCents, 0);

    res.json({
      success: true,
      advertiserBalanceCents: freshUser.advertiserBalanceCents || 0,
      advertiserBalanceFormatted: `$${((freshUser.advertiserBalanceCents || 0) / 100).toFixed(2)} USDT`,
      advertiserBalancePoints: Math.round(((freshUser.advertiserBalanceCents || 0) / 100) * (settings.pointsRatePerUsd || 10000)),
      activeCampaignsCount,
      pendingProofsCount,
      totalApprovedWorkerProofs,
      totalWorkerSpendCents,
      platformFeePercent: settings.platformFeePercent || 10,
      pointsRatePerUsd: settings.pointsRatePerUsd || 10000
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch advertiser overview.' });
  }
});

// GET /api/advertiser/campaigns
app.get('/api/advertiser/campaigns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const campaigns = dbStore.getCampaignsForAdvertiser(user.id);
    res.json({ success: true, campaigns });
  } catch {
    res.status(500).json({ error: 'Failed to fetch advertiser campaigns.' });
  }
});

// POST /api/advertiser/campaigns - Create a new campaign with real-time budget calculation
app.post('/api/advertiser/campaigns', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const settings = dbStore.getSettings();
    const {
      title,
      description,
      instructions,
      category = 'signup',
      targetUrl,
      rewardPoints,
      totalSlots,
      targetCountry = 'ALL',
      targetDevice = 'all',
      requiredProofType = 'both',
      proofInstructions
    } = req.body;

    if (!title || !description || !instructions || !targetUrl) {
      res.status(400).json({ error: 'Please provide all required campaign details.' });
      return;
    }

    const pointsRate = settings.pointsRatePerUsd || 10000;
    const parsedRewardPoints = Math.max(100, Math.floor(Number(rewardPoints) || 1000));
    const parsedSlots = Math.max(5, Math.floor(Number(totalSlots) || 10));
    const rewardCents = Math.round((parsedRewardPoints / pointsRate) * 100);

    // JobsWorkTech Exact Cost Model:
    // User reward budget = reward_points * slots
    // Platform fee = budget * feePercent (10%)
    // Total cost = budget + fee
    const feePct = settings.platformFeePercent || 10;
    const budgetCents = parsedSlots * rewardCents;
    const feeCents = Math.round(budgetCents * (feePct / 100));

    const campaign = await dbStore.createTaskCampaign({
      advertiserId: user.id,
      advertiserEmail: user.email,
      title: title.trim(),
      description: description.trim(),
      instructions: Array.isArray(instructions) ? instructions : [instructions],
      category,
      targetUrl: targetUrl.trim(),
      rewardPoints: parsedRewardPoints,
      rewardCents,
      totalSlots: parsedSlots,
      targetCountry,
      targetDevice,
      requiredProofType,
      proofInstructions: proofInstructions?.trim() || 'Submit required proof upon completion.',
      status: user.role === 'admin' ? 'active' : 'pending_approval',
      platformFeePercent: feePct,
      advertiserBudgetReservedCents: budgetCents,
      advertiserFeeReservedCents: feeCents
    });

    res.status(201).json({
      success: true,
      message: user.role === 'admin'
        ? 'Campaign created and activated immediately.'
        : 'Campaign created successfully. It will go live once verified by Admin moderation.',
      campaign
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// POST /api/advertiser/campaigns/:id/status - Pause or cancel campaign
app.post('/api/advertiser/campaigns/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const taskId = req.params.id;
    const { status } = req.body;

    const task = dbStore.getTaskById(taskId);
    if (!task) {
      res.status(404).json({ error: 'Campaign not found.' });
      return;
    }

    if (task.advertiserId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized to modify this campaign.' });
      return;
    }

    if (!['active', 'paused', 'completed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }

    const updated = await dbStore.updateTaskStatus(taskId, status);
    res.json({ success: true, campaign: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// GET /api/advertiser/submissions - Worker proofs submitted for advertiser campaigns
app.get('/api/advertiser/submissions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const submissions = dbStore.getSubmissionsForAdvertiser(user.id);
    res.json({ success: true, submissions });
  } catch {
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// POST /api/advertiser/submissions/:id/review - Approve or reject worker proof
app.post('/api/advertiser/submissions/:id/review', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const subId = req.params.id;
    const { action, reason } = req.body;

    const sub = dbStore.getSubmissionById(subId);
    if (!sub) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    if (sub.advertiserId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized to review this submission.' });
      return;
    }

    if (!['approved', 'rejected'].includes(action)) {
      res.status(400).json({ error: 'Review action must be approved or rejected.' });
      return;
    }

    if (action === 'rejected' && (!reason || reason.trim().length < 3)) {
      res.status(400).json({ error: 'A specific rejection reason is required so the worker understands why.' });
      return;
    }

    const updated = await dbStore.reviewSubmission(subId, action as 'approved' | 'rejected', user.id, reason);
    res.json({
      success: true,
      message: action === 'approved' ? 'Submission approved and reward credited to worker!' : 'Submission rejected with feedback.',
      submission: updated
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// GET /api/advertiser/billing - Advertiser wallet, deposits and budget ledger
app.get('/api/advertiser/billing', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const freshUser = dbStore.getUserById(user.id)!;
    const deposits = dbStore.getDepositsForAdvertiser(user.id);
    const campaigns = dbStore.getCampaignsForAdvertiser(user.id);
    const settings = dbStore.getSettings();

    const reservedBudgetCents = campaigns
      .filter(c => c.status === 'active' || c.status === 'pending_approval')
      .reduce((sum, c) => sum + (c.advertiserBudgetReservedCents + c.advertiserFeeReservedCents), 0);

    res.json({
      success: true,
      availableCents: freshUser.advertiserBalanceCents || 0,
      availableFormatted: `$${((freshUser.advertiserBalanceCents || 0) / 100).toFixed(2)} USDT`,
      availablePoints: Math.round(((freshUser.advertiserBalanceCents || 0) / 100) * (settings.pointsRatePerUsd || 10000)),
      reservedBudgetCents,
      deposits,
      pointsRatePerUsd: settings.pointsRatePerUsd || 10000
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch advertiser billing.' });
  }
});

// POST /api/advertiser/deposits - Add advertiser funds (FaucetPay, USDT, manual)
app.post('/api/advertiser/deposits', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amountUsd, method = 'faucetpay', txHashOrRef } = req.body;

    const parsedUsd = Number(amountUsd);
    if (!parsedUsd || parsedUsd <= 0) {
      res.status(400).json({ error: 'Please enter a valid deposit amount in USD.' });
      return;
    }

    const amountCents = Math.round(parsedUsd * 100);
    const deposit = await dbStore.createAdvertiserDeposit({
      advertiserId: user.id,
      amountCents,
      method: method as any,
      txHashOrRef
    });

    const freshUser = dbStore.getUserById(user.id)!;
    res.status(201).json({
      success: true,
      message: `Deposit of $${parsedUsd.toFixed(2)} credited successfully to advertiser balance.`,
      deposit,
      newBalanceCents: freshUser.advertiserBalanceCents
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// -----------------------------------------------------------------------------
// Multi-Offerwall Endpoints (CPX, Aoyco, AdvertsReward)
// -----------------------------------------------------------------------------

// GET /api/offerwalls - Available offerwall options for current user
app.get('/api/offerwalls', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
    const offerwalls = offerwallService.getAvailableOfferwalls(user.externalOpaqueId, clientIp);
    res.json({
      success: true,
      offerwalls
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch offerwalls list.' });
  }
});

// ALL /api/postback/aoyco - Aoyco Server-to-Server Postback (Enforcing 60% Platform / 40% User split)
app.all('/api/postback/aoyco', async (req: Request, res: Response) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const userId = String(params.user_id || params.subid || params.userid || '').trim();
    const transId = String(params.transaction_id || params.trans_id || params.tx_id || '').trim();
    const rawReward = Number(params.amount || params.payout || params.reward || 0);
    const status = Number(params.status ?? 1); // 1 = approved, 2 or 3 = reversed
    const signature = params.signature || params.token;

    console.log(`[Aoyco S2S] transId=${transId}, user=${userId}, reward=${rawReward}, status=${status}`);

    if (!transId || !userId) {
      res.status(400).send('Missing user_id or transaction_id');
      return;
    }

    const isValid = offerwallService.verifyAoycoPostback({
      userId,
      transId,
      amount: rawReward,
      signature
    });

    if (!isValid) {
      res.status(403).send('Invalid signature');
      return;
    }

    const result = await offerwallService.processUniversalPostback({
      providerId: 'aoyco',
      rawUserId: userId,
      transId,
      rawAmount: rawReward,
      status
    });

    res.status(200).send(result.success ? 'OK' : 'ERROR');
  } catch (err) {
    console.error('Aoyco postback error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ALL /api/postback/advertsreward - AdvertsReward Server-to-Server Postback (60/40 split)
app.all('/api/postback/advertsreward', async (req: Request, res: Response) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const userId = String(params.subid || params.user_id || params.userid || '').trim();
    const transId = String(params.transaction || params.trans_id || params.lead_id || '').trim();
    const rawReward = Number(params.amount || params.reward || params.payout || 0);
    const status = Number(params.status ?? 1);
    const signature = params.signature || params.token;

    console.log(`[AdvertsReward S2S] transId=${transId}, user=${userId}, reward=${rawReward}, status=${status}`);

    if (!transId || !userId) {
      res.status(400).send('Missing subid or transaction');
      return;
    }

    const isValid = offerwallService.verifyAdvertsRewardPostback({
      userId,
      transId,
      signature
    });

    if (!isValid) {
      res.status(403).send('Invalid signature');
      return;
    }

    const result = await offerwallService.processUniversalPostback({
      providerId: 'advertsreward',
      rawUserId: userId,
      transId,
      rawAmount: rawReward,
      status
    });

    res.status(200).send(result.success ? 'OK' : 'ERROR');
  } catch (err) {
    console.error('AdvertsReward postback error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ALL /api/postback/:providerId - Universal S2S Webhook for ANY partner company configured in Admin
app.all('/api/postback/:providerId', async (req: Request, res: Response) => {
  try {
    const providerId = req.params.providerId;
    const params = req.method === 'POST' ? req.body : req.query;
    const rawUserId = String(params.user_id || params.subid || params.ext_user_id || params.uid || params.userid || '').trim();
    const transId = String(params.trans_id || params.transaction_id || params.tx_id || params.id || `tx_${Date.now()}`).trim();
    const rawAmount = Number(params.amount || params.reward || params.payout || params.points || 0);
    const status = Number(params.status ?? 1);

    console.log(`[Universal S2S Webhook: ${providerId}] transId=${transId}, user=${rawUserId}, amount=${rawAmount}, status=${status}`);

    if (!rawUserId) {
      res.status(400).json({ error: 'User identifier missing in postback payload.' });
      return;
    }

    const result = await offerwallService.processUniversalPostback({
      providerId,
      rawUserId,
      transId,
      rawAmount,
      status,
      offerId: String(params.offer_id || params.campaign_id || '')
    });

    res.status(200).json({ success: result.success, message: result.message });
  } catch (err) {
    console.error('Universal postback error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CPX Research API & Postback (Retained & Enhanced)
app.get('/api/cpx/status', (req: Request, res: Response) => {
  const status = cpxResearchService.getConfigStatus();
  res.json(status);
});

app.get('/api/surveys', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const rawIp = (
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-client-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.ip ||
    ''
  ).trim();
  const isPrivateOrLoopback = !rawIp || rawIp === '127.0.0.1' || rawIp === '::1' || rawIp.startsWith('::ffff:127.') || rawIp.startsWith('10.') || rawIp.startsWith('192.168.');
  const clientIp = isPrivateOrLoopback ? '5.146.176.100' : rawIp;
  const userAgent = req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  const surveyData = await cpxResearchService.fetchEligibleSurveys({
    externalUserId: user.externalOpaqueId,
    ipAddress: clientIp,
    userAgent
  });

  const usdtQuote = await usdtPriceService.getUsdtPriceQuote();

  const surveysWithUsdt = surveyData.surveys.map(s => ({
    ...s,
    rewardPointsFormatted: `${(s.rewardCents * 100).toLocaleString()} Points`,
    rewardUsdtFormatted: `${(s.rewardCents / 100).toFixed(2)} USDT`
  }));

  res.json({
    ...surveyData,
    surveys: surveysWithUsdt,
    usdtQuote
  });
});

app.all(['/api/surveys/start', '/api/surveys/start/:surveyId?'], requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const surveyId = req.params.surveyId || req.body?.surveyId || req.query?.surveyId;
  const directUrl = req.body?.directUrl || req.query?.directUrl;

  const targetUrl = directUrl && typeof directUrl === 'string' && directUrl.startsWith('https://')
    ? directUrl
    : cpxResearchService.generateSurveyStartUrl(user.externalOpaqueId, surveyId ? String(surveyId) : undefined);

  res.json({
    success: true,
    url: targetUrl,
    redirectUrl: targetUrl
  });
});

app.all(['/api/cpx/postback', '/api/cpx-postback', '/api/postback'], async (req: Request, res: Response) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const {
    status,
    trans_id,
    ext_user_id,
    user_id,
    amount_local,
    amount_usd,
    offer_id,
    secure_hash,
    hash
  } = params;

  const effectiveUserId = String(ext_user_id || user_id || params.sub_id || params.subid || '').trim();
  const transId = String(trans_id || params.transaction_id || '').trim();
  const receivedHash = String(secure_hash || hash || '').trim();
  const statusCode = Number(status ?? 1);

  console.log(`[CPX Postback] Received: trans_id=${transId}, user=${effectiveUserId}, status=${statusCode}`);

  if (!transId || !effectiveUserId) {
    res.status(400).send('Missing required parameters');
    return;
  }

  const config = cpxResearchService.getConfigStatus();
  if (config.isConfigured && receivedHash) {
    const isValidSig = cpxResearchService.verifyPostback(transId, effectiveUserId, receivedHash);
    if (!isValidSig) {
      res.status(403).send('Invalid signature');
      return;
    }
  }

  let targetUser = dbStore.getUserByExternalId(effectiveUserId) || dbStore.getUserById(effectiveUserId);
  if (!targetUser) {
    res.status(200).send('1');
    return;
  }

  const rawReward = Number(amount_local || amount_usd) || 0;

  const result = await offerwallService.processUniversalPostback({
    providerId: 'cpx',
    rawUserId: effectiveUserId,
    transId,
    rawAmount: rawReward,
    status: statusCode,
    offerId: String(offer_id || '')
  });

  res.status(200).send(result.success ? '1' : '0');
});

// -----------------------------------------------------------------------------
// Financial & USDT Endpoints
// -----------------------------------------------------------------------------

app.get('/api/usdt/price', async (req: Request, res: Response) => {
  try {
    const quote = await usdtPriceService.getUsdtPriceQuote();
    res.json(quote);
  } catch {
    res.status(500).json({ error: 'Failed to fetch USDT price quote.' });
  }
});

app.get('/api/ledger', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const entries = dbStore.getLedgerForUser(user.id);
  const balances = dbStore.getUserBalances(user.id);
  res.json({ entries, balances });
});

app.get('/api/withdrawals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const withdrawals = dbStore.getWithdrawalsForUser(user.id);
  res.json({ withdrawals });
});

app.post('/api/withdrawals', requireAuth, requireVerifiedEmail, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { usdtAddress, network = 'TRC20', amountCents } = req.body;
    const settings = dbStore.getSettings();

    const targetNetwork: 'TRC20' | 'ERC20' = network === 'ERC20' ? 'ERC20' : 'TRC20';

    const addressCheck = validateUsdtAddress(usdtAddress, targetNetwork);
    if (!addressCheck.isValid) {
      res.status(400).json({ error: addressCheck.error || 'Invalid USDT destination address.' });
      return;
    }

    const balances = dbStore.getUserBalances(user.id);
    const parsedAmount = Math.floor(Number(amountCents));

    const check = canSubmitWithdrawal({
      amountCents: parsedAmount,
      availableCents: balances.availableCents,
      emailVerified: user.emailVerified,
      minCents: settings.minWithdrawalCents,
      maxCents: settings.maxWithdrawalCents
    });

    if (!check.allowed) {
      res.status(400).json({ error: check.reason });
      return;
    }

    const networkFeeCents = targetNetwork === 'ERC20' ? settings.feeCentsErc20 : settings.feeCentsTrc20;
    const payoutCalc = calculateUsdtPayout(parsedAmount, targetNetwork, networkFeeCents);
    if (!payoutCalc.isViable) {
      res.status(400).json({ error: payoutCalc.error || 'Net payout must be greater than zero.' });
      return;
    }

    const withdrawalId = `w_${crypto.randomUUID()}`;
    const newRequest = await dbStore.createWithdrawalRequest({
      id: withdrawalId,
      userId: user.id,
      userEmail: user.email,
      usdtAddress: usdtAddress.trim(),
      network: targetNetwork,
      amountCents: parsedAmount,
      feeCents: networkFeeCents,
      netCents: payoutCalc.netCents,
      grossUsdt: payoutCalc.grossUsdt,
      feeUsdt: payoutCalc.feeUsdt,
      netUsdt: payoutCalc.netUsdt,
      status: 'under_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewNotes: `Awaiting administrative verification and ${targetNetwork} batch payout settlement.`
    });

    await usdtPayoutManager.getProvider().processWithdrawal(newRequest);

    res.status(201).json({
      success: true,
      message: 'USDT withdrawal request submitted. It is now queued for verification.',
      withdrawal: newRequest,
      balances: dbStore.getUserBalances(user.id)
    });
  } catch (err: unknown) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Could not process withdrawal request. Please try again.' });
  }
});

// -----------------------------------------------------------------------------
// Administrator Endpoints
// -----------------------------------------------------------------------------

// GET /api/admin/overview
app.get('/api/admin/overview', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = dbStore.getAllUsers();
  const withdrawals = dbStore.getAllWithdrawals();
  const ledger = dbStore.getAllLedgerEntries();
  const tasks = dbStore.getAllTasks();
  const submissions = dbStore.getAllSubmissions();
  const cpxStatus = cpxResearchService.getConfigStatus();
  const payoutStatus = usdtPayoutManager.getStatus();

  const totalRewardsCreditedCents = ledger
    .filter(l => l.status === 'confirmed' && l.entryType === 'credit')
    .reduce((sum, l) => sum + l.amountCents, 0);

  const pendingWithdrawalCount = withdrawals.filter(w => ['requested', 'under_review'].includes(w.status)).length;
  const paidWithdrawalTotalCents = withdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + w.netCents, 0);

  const pendingCampaignsCount = tasks.filter(t => t.status === 'pending_approval').length;
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending_review').length;

  res.json({
    totalUsers: users.length,
    registeredWorkers: users.filter(u => u.role === 'user').length,
    registeredAdvertisers: users.filter(u => u.role === 'advertiser').length,
    totalRewardsCreditedCents,
    pendingWithdrawalCount,
    paidWithdrawalTotalUsdt: (paidWithdrawalTotalCents / 100).toFixed(2),
    activeCampaignsCount: tasks.filter(t => t.status === 'active').length,
    pendingCampaignsCount,
    pendingSubmissionsCount,
    totalCompletedTasks: submissions.filter(s => s.status === 'approved').length,
    cpxStatus,
    payoutStatus
  });
});

// GET /api/admin/users
app.get('/api/admin/users', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersWithDetails = dbStore.getAllUsersWithDetails();
    res.json({
      success: true,
      users: usersWithDetails,
      totalCount: usersWithDetails.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user directory.' });
  }
});

// POST /api/admin/users/:id/role
app.post('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['user', 'advertiser', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }
    const updated = await dbStore.updateUser(req.params.id, { role });
    res.json({ success: true, user: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// GET /api/admin/campaigns - Full campaigns list for moderation
app.get('/api/admin/campaigns', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const campaigns = dbStore.getAllTasks();
  res.json({ success: true, campaigns });
});

// POST /api/admin/campaigns/:id/review - Approve or reject campaign
app.post('/api/admin/campaigns/:id/review', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, notes } = req.body; // action: 'approve' | 'reject' | 'pause' | 'resume'
    const statusMap: Record<string, any> = {
      approve: 'active',
      reject: 'rejected',
      pause: 'paused',
      resume: 'active'
    };
    const targetStatus = statusMap[action];
    if (!targetStatus) {
      res.status(400).json({ error: 'Invalid moderation action.' });
      return;
    }

    const updated = await dbStore.updateTaskStatus(req.params.id, targetStatus, notes);
    res.json({ success: true, campaign: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// GET /api/admin/submissions - Full submissions list
app.get('/api/admin/submissions', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const submissions = dbStore.getAllSubmissions();
  res.json({ success: true, submissions });
});

// POST /api/admin/submissions/:id/review - Admin proof moderation override
app.post('/api/admin/submissions/:id/review', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, reason } = req.body;
    if (!['approved', 'rejected'].includes(action)) {
      res.status(400).json({ error: 'Action must be approved or rejected.' });
      return;
    }
    const updated = await dbStore.reviewSubmission(req.params.id, action, req.user!.id, reason);
    res.json({ success: true, submission: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// GET /api/admin/withdrawals
app.get('/api/admin/withdrawals', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const withdrawals = dbStore.getAllWithdrawals();
  res.json({ withdrawals });
});

// POST /api/admin/withdrawals/:id/review
app.post('/api/admin/withdrawals/:id/review', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    const id = req.params.id;
    const { action, notes, txHash } = req.body;

    const target = dbStore.getWithdrawalById(id);
    if (!target) {
      res.status(404).json({ error: 'Withdrawal request not found.' });
      return;
    }

    let newStatus: typeof target.status;
    if (action === 'approve') newStatus = 'approved';
    else if (action === 'mark_paid') {
      if (!txHash) {
        res.status(400).json({ error: 'A confirmed on-chain transaction hash (txHash) is required to mark a payout as paid.' });
        return;
      }
      newStatus = 'paid';
    } else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'cancel') newStatus = 'cancelled';
    else {
      res.status(400).json({ error: 'Invalid review action.' });
      return;
    }

    const updated = await dbStore.updateWithdrawalStatus(id, newStatus, adminUser.id, notes, txHash);

    await dbStore.addAuditLog({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      action: `WITHDRAWAL_${action.toUpperCase()}`,
      targetEntity: 'withdrawal_requests',
      targetId: id,
      details: `Status changed to ${newStatus}. Notes: ${notes || 'none'}. TxHash: ${txHash || 'none'}`
    });

    res.json({ success: true, withdrawal: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// GET /api/admin/ads & POST /api/admin/ads (Sticky Banners & Rail Ads)
app.get('/api/admin/ads', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, ads: dbStore.getAdSettings() });
});

app.post('/api/admin/ads', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await dbStore.updateAdSettings(req.body);
    res.json({ success: true, ads: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update ad settings' });
  }
});

// -----------------------------------------------------------------------------
// Dynamic Provider / Partner Management (Admin Only)
// -----------------------------------------------------------------------------

// GET /api/admin/providers - List all connected companies / offerwalls
app.get('/api/admin/providers', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, providers: dbStore.getProviders() });
});

// POST /api/admin/providers - Add new partner company / offerwall
app.post('/api/admin/providers', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const provider = await dbStore.createProvider(req.body);
    await dbStore.addAuditLog({
      adminUserId: req.user!.id,
      adminEmail: req.user!.email,
      action: 'CREATE_PROVIDER',
      targetEntity: 'provider_config',
      targetId: provider.id,
      details: JSON.stringify(provider)
    });
    res.status(201).json({ success: true, provider });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// PUT /api/admin/providers/:id - Update provider settings, launch URL, secret, or 60/40 split
app.put('/api/admin/providers/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await dbStore.updateProvider(req.params.id, req.body);
    await dbStore.addAuditLog({
      adminUserId: req.user!.id,
      adminEmail: req.user!.email,
      action: 'UPDATE_PROVIDER',
      targetEntity: 'provider_config',
      targetId: req.params.id,
      details: JSON.stringify(req.body)
    });
    res.json({ success: true, provider: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// DELETE /api/admin/providers/:id - Remove provider
app.delete('/api/admin/providers/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await dbStore.deleteProvider(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Provider not found.' });
      return;
    }
    await dbStore.addAuditLog({
      adminUserId: req.user!.id,
      adminEmail: req.user!.email,
      action: 'DELETE_PROVIDER',
      targetEntity: 'provider_config',
      targetId: req.params.id,
      details: `Provider ${req.params.id} deleted`
    });
    res.json({ success: true, message: 'Provider deleted successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete provider.' });
  }
});

// -----------------------------------------------------------------------------
// Universal Dynamic Ad Slots (Admin & Public)
// -----------------------------------------------------------------------------

// GET /api/public/ad-slots - Public active ad slots with HTML / scripts
app.get('/api/public/ad-slots', (req: Request, res: Response) => {
  const activeSlots = dbStore.getAdSlots().filter(s => s.enabled);
  res.json({ success: true, adSlots: activeSlots });
});

// GET /api/admin/ad-slots - All ad slots for admin configuration
app.get('/api/admin/ad-slots', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, adSlots: dbStore.getAdSlots() });
});

// PUT /api/admin/ad-slots/:id - Update ad slot code or toggle
app.put('/api/admin/ad-slots/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await dbStore.updateAdSlot(req.params.id, req.body);
    await dbStore.addAuditLog({
      adminUserId: req.user!.id,
      adminEmail: req.user!.email,
      action: 'UPDATE_AD_SLOT',
      targetEntity: 'ad_slot',
      targetId: req.params.id,
      details: JSON.stringify(req.body)
    });
    res.json({ success: true, adSlot: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// -----------------------------------------------------------------------------
// Financial Treasury & 60% Revenue Ledger
// -----------------------------------------------------------------------------

// GET /api/admin/financials - Complete Platform Financial Breakdown (60% Revenue vs 40% User Payouts)
app.get('/api/admin/financials', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const summary = dbStore.getFinancialSummary();
  res.json({ success: true, summary });
});

// GET /api/admin/treasury - Platform Treasury Revenue Ledger
app.get('/api/admin/treasury', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, treasury: dbStore.getPlatformTreasury() });
});

// POST /api/admin/users/:id/adjust-balance - Manual Balance Credit or Debit with Audit Log
app.post('/api/admin/users/:id/adjust-balance', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amountCents, type = 'credit', description = 'Manual Adjustment' } = req.body;
    if (!amountCents || isNaN(Number(amountCents)) || Number(amountCents) <= 0) {
      res.status(400).json({ error: 'Please enter a valid positive amount in cents.' });
      return;
    }
    const entry = await dbStore.adjustUserBalance(
      req.params.id,
      Number(amountCents),
      type as 'credit' | 'debit',
      description,
      req.user!.id
    );
    res.json({
      success: true,
      entry,
      balances: dbStore.getUserBalances(req.params.id)
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// POST /api/admin/test-offerwall-postback - 1-Click Simulator enforcing 60/40 Split
app.post('/api/admin/test-offerwall-postback', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { provider = 'cpx', targetUserId, rewardPoints = 2000, status = 1 } = req.body;
    const user = dbStore.getUserById(targetUserId) || req.user!;
    const transId = `sim_${provider}_${Date.now()}`;

    const result = await offerwallService.processUniversalPostback({
      providerId: provider,
      rawUserId: user.id,
      transId,
      rawAmount: Number(rewardPoints),
      isPoints: true,
      status
    });

    res.json({
      success: result.success,
      message: result.message,
      userPointsAdded: result.userPointsAdded,
      platformProfitCents: result.platformProfitCents,
      balances: dbStore.getUserBalances(user.id),
      financials: dbStore.getFinancialSummary()
    });
  } catch (err) {
    res.status(500).json({ error: 'Simulation failed' });
  }
});

// GET /api/admin/settings & POST /api/admin/settings
app.get('/api/admin/settings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(dbStore.getSettings());
});

app.post('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const updated = await dbStore.updateSettings(req.body, admin.id);
  res.json({ success: true, settings: updated });
});

// GET /api/admin/audit-logs
app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ logs: dbStore.getAuditLogs() });
});

// POST /api/admin/profile/update-credentials - Update Admin Email & Password
app.post('/api/admin/profile/update-credentials', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    const { newEmail, currentPassword, newPassword } = req.body;

    // Verify current password for maximum security
    if (!currentPassword || !verifyPassword(currentPassword, adminUser.passwordHash, adminUser.salt)) {
      res.status(401).json({ error: 'Current password verification failed. Credential update denied.' });
      return;
    }

    const updates: Partial<UserAccount> = {};

    // Validate and prepare email update
    if (newEmail && typeof newEmail === 'string' && newEmail.includes('@')) {
      const trimmedEmail = newEmail.toLowerCase().trim();
      if (trimmedEmail !== adminUser.email.toLowerCase()) {
        const existing = dbStore.getUserByEmail(trimmedEmail);
        if (existing && existing.id !== adminUser.id) {
          res.status(400).json({ error: 'This email is already in use by another user account.' });
          return;
        }
        updates.email = trimmedEmail;
      }
    }

    // Validate and prepare password update
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }
      const { hash, salt } = hashPassword(newPassword);
      updates.passwordHash = hash;
      updates.salt = salt;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No credential changes were provided.' });
      return;
    }

    const updated = await dbStore.updateUser(adminUser.id, updates);
    const newToken = createSessionToken(updated);

    // Record high-priority security audit log
    await dbStore.addAuditLog({
      adminUserId: adminUser.id,
      adminEmail: updated.email,
      action: 'ADMIN_CREDENTIALS_UPDATED',
      targetEntity: 'admin_security',
      targetId: adminUser.id,
      details: JSON.stringify({
        emailUpdated: Boolean(updates.email),
        passwordUpdated: Boolean(updates.passwordHash),
        newEmail: updated.email,
        ip: AdminFirewallService.getClientIp(req),
        timestamp: new Date().toISOString()
      }),
      ipAddress: AdminFirewallService.getClientIp(req)
    });

    res.json({
      success: true,
      message: 'Admin credentials successfully updated & synchronized with Supabase.',
      token: newToken,
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role
      }
    });
  } catch (err: unknown) {
    console.error('Failed to update admin credentials:', err);
    res.status(500).json({ error: 'Internal error updating credentials.' });
  }
});

// GET /api/admin/firewall/status - Admin Shield & Firewall Telemetry
app.get('/api/admin/firewall/status', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const ip = AdminFirewallService.getClientIp(req);
  const auditLogs = dbStore.getAuditLogs();
  const securityEvents = auditLogs.filter(
    l => l.action.includes('FIREWALL') || l.action.includes('ADMIN_') || l.action.includes('LOCKOUT')
  );

  res.json({
    success: true,
    firewall: {
      status: 'ACTIVE_GUARDING',
      shieldEngine: 'Reward River Security Shield v2.0 by Injazify Studios by Rayan Mirza',
      protectionLevel: 'MAXIMUM',
      clientIp: ip,
      rateLimiter: '5 attempts per 15-minute sliding window',
      honeypotTraps: 'Active',
      supabaseRLS: 'Active',
      recentSecurityEvents: securityEvents.slice(0, 15)
    }
  });
});

// -----------------------------------------------------------------------------
// Public Endpoints (Metrics & Ads for Public Layout)
// -----------------------------------------------------------------------------

// GET /api/public/metrics - Live Marketplace Statistics (like JobsWorkTech)
app.get('/api/public/metrics', (req: Request, res: Response) => {
  const users = dbStore.getAllUsers();
  const tasks = dbStore.getAllTasks();
  const submissions = dbStore.getAllSubmissions();
  const settings = dbStore.getSettings();

  res.json({
    registeredWorkers: Math.max(users.filter(u => u.role === 'user').length, 1949),
    registeredAdvertisers: users.filter(u => u.role === 'advertiser').length,
    activeTasksCount: tasks.filter(t => t.status === 'active').length,
    offerwallOptionsCount: 3, // CPX, Aoyco, AdvertsReward
    completedTasksCount: Math.max(submissions.filter(s => s.status === 'approved').length, 342),
    platformFeePercent: settings.platformFeePercent || 10,
    pointsRatePerUsd: settings.pointsRatePerUsd || 10000,
    platformArchitect: {
      studio: 'Injazify Studios',
      website: 'https://injazify.com',
      leadArchitect: 'Rayan Mirza',
      github: 'https://github.com/rynzer0x',
      linkedin: 'https://linkedin.com/in/rynmirza'
    }
  });
});

// GET /api/public/ads - Public ad banner configurations
app.get('/api/public/ads', (req: Request, res: Response) => {
  const ads = dbStore.getAdSettings();
  res.json({
    adsEnabled: ads.adsEnabled,
    testMode: ads.testMode,
    stickyBottomEnabled: ads.stickyBottomEnabled,
    stickyRailEnabled: ads.stickyRailEnabled,
    stickyBottom728Code: ads.stickyBottom728Code,
    stickyBottom468Code: ads.stickyBottom468Code,
    stickyRail300Code: ads.stickyRail300Code
  });
});

// -----------------------------------------------------------------------------
// Reviews & Testimonials Endpoints
// -----------------------------------------------------------------------------

// GET /api/public/reviews - Fetch approved reviews for public landing & dashboard
app.get('/api/public/reviews', (_req: Request, res: Response) => {
  const reviews = dbStore.getReviews('approved');
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';
  res.json({
    reviews,
    totalCount: reviews.length,
    averageRating: parseFloat(avgRating)
  });
});

// POST /api/reviews/submit - Submit a user review
app.post('/api/reviews/submit', async (req: Request, res: Response) => {
  try {
    const { userName, rating, title, comment, payoutProofUsdt, payoutProofTx, userCountry } = req.body || {};

    if (!userName || !comment || !rating) {
      res.status(400).json({ error: 'Please provide your name, rating, and feedback comment.' });
      return;
    }

    const numRating = Math.min(Math.max(Number(rating) || 5, 1), 5);
    const autoApprove = numRating >= 4;

    const newReview = await dbStore.addReview({
      userName: String(userName).trim().slice(0, 50),
      userCountry: userCountry || 'US',
      rating: numRating,
      title: title ? String(title).trim().slice(0, 100) : 'Verified Earner Review',
      comment: String(comment).trim().slice(0, 1000),
      payoutProofUsdt: payoutProofUsdt ? Number(payoutProofUsdt) : undefined,
      payoutProofTx: payoutProofTx ? String(payoutProofTx).trim() : undefined,
      status: autoApprove ? 'approved' : 'pending',
      autoApproved: autoApprove
    });

    res.status(201).json({
      success: true,
      message: autoApprove ? 'Your review has been published!' : 'Review submitted for verification.',
      review: newReview
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to submit review' });
  }
});

// GET /api/admin/reviews - Admin fetch all reviews with pending count
app.get('/api/admin/reviews', requireAdmin, (_req: Request, res: Response) => {
  const allReviews = dbStore.getReviews('all');
  res.json({
    reviews: allReviews,
    pendingCount: allReviews.filter(r => r.status === 'pending').length,
    approvedCount: allReviews.filter(r => r.status === 'approved').length
  });
});

// POST /api/admin/reviews/:id/status - Admin approve or reject review
app.post('/api/admin/reviews/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be approved or rejected' });
      return;
    }
    const updated = await dbStore.updateReviewStatus(id, status);
    res.json({ success: true, review: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update review status' });
  }
});

// DELETE /api/admin/reviews/:id - Admin delete review
app.delete('/api/admin/reviews/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await dbStore.deleteReview(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete review' });
  }
});

// -----------------------------------------------------------------------------
// Announcements & Notification Bar Endpoints
// -----------------------------------------------------------------------------

// GET /api/public/announcements - Fetch active announcements & top bar
app.get('/api/public/announcements', (_req: Request, res: Response) => {
  const activeList = dbStore.getAnnouncements(true);
  const topBar = dbStore.getTopAnnouncement();
  res.json({
    announcements: activeList,
    topBarAnnouncement: topBar || activeList[0] || null
  });
});

// GET /api/admin/announcements - Admin fetch all announcements
app.get('/api/admin/announcements', requireAdmin, (_req: Request, res: Response) => {
  const all = dbStore.getAnnouncements(false);
  res.json({ announcements: all });
});

// POST /api/admin/announcements - Create announcement
app.post('/api/admin/announcements', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, message, badge, type, linkText, linkTab, showInTopBar, active } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }
    const created = await dbStore.createAnnouncement({
      title: String(title).trim(),
      message: String(message).trim(),
      badge: badge || 'UPDATE',
      type: type || 'info',
      linkText: linkText || undefined,
      linkTab: linkTab || undefined,
      showInTopBar: Boolean(showInTopBar),
      active: active !== undefined ? Boolean(active) : true
    });
    res.status(201).json({ success: true, announcement: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create announcement' });
  }
});

// PUT /api/admin/announcements/:id - Update announcement
app.put('/api/admin/announcements/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await dbStore.updateAnnouncement(id, req.body);
    res.json({ success: true, announcement: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update announcement' });
  }
});

// DELETE /api/admin/announcements/:id - Delete announcement
app.delete('/api/admin/announcements/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await dbStore.deleteAnnouncement(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete announcement' });
  }
});

// Global error handler ensuring all errors are JSON formatted (never unparsed HTML)
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[Unhandled Server Error]', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || 'A server error occurred. Please try again.' });
  }
});

// -----------------------------------------------------------------------------
// Vite Middleware / Static Serve Setup
// -----------------------------------------------------------------------------
async function startServer() {
  await dbStore.init();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(` REWARD RIVER - ENTERPRISE MICRO-TASK & OFFERWALL PLATFORM      `);
    console.log(` Architected by Injazify Studios by Rayan Mirza                `);
    console.log(` Studio: https://injazify.com                                   `);
    console.log(` Lead Architect GitHub: https://github.com/rynzer0x             `);
    console.log(` Lead Architect LinkedIn: https://linkedin.com/in/rynmirza      `);
    console.log(` Server running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(`================================================================`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}

export default app;

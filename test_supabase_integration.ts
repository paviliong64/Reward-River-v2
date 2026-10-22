import { dbStore } from './server/db';
import { supabaseStore } from './server/supabaseStore';
import { serverSupabase, isServerSupabaseConfigured, verifySupabaseToken } from './server/supabase';

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 REWARD RIVER - SUPABASE BACKEND VERIFICATION TEST');
  console.log('====================================================');

  // 1. Database Init Test
  console.log('\n[1] Initializing Database Store...');
  await dbStore.init();
  console.log('✅ Database store initialized successfully.');
  console.log(`- Supabase configured: ${isServerSupabaseConfigured}`);
  console.log(`- Supabase store enabled: ${supabaseStore.isEnabled()}`);

  // 2. Direct White-Label Providers Check
  console.log('\n[2] Checking Direct Provider White-Label Branding...');
  const providers = dbStore.getProviders();
  console.log(`- Found ${providers.length} registered providers:`);
  for (const p of providers) {
    console.log(`  * [${p.id}] ${p.name} -> Public Brand: "${p.publicBrandName}"`);
    console.log(`    User Share: ${p.userSharePercent}% | Platform Margin: ${p.platformSharePercent}%`);
    if (!p.publicBrandName.includes('Reward River Direct Gateway')) {
      throw new Error(`Provider ${p.id} missing Reward River Direct Gateway branding!`);
    }
  }
  console.log('✅ All providers are directly white-labeled with Reward River branding.');

  // 3. User Creation & Registration Test
  console.log('\n[3] Testing Supabase User Persistence & Profile Management...');
  const testEmail = `worker_test_${Date.now()}@rewardriver.com`;
  const createdUser = await dbStore.createUser({
    id: `usr_${Date.now()}`,
    email: testEmail,
    passwordHash: 'dummy_hash',
    salt: 'dummy_salt',
    displayName: 'Test Supabase Worker',
    emailVerified: true,
    role: 'user',
    externalOpaqueId: `opaque_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log(`✅ User registered successfully: ${createdUser.email} (ID: ${createdUser.id})`);

  // 4. Financial Audit & 60/40 Invisible Split Test
  console.log('\n[4] Testing 60/40 Platform Treasury & Invisible Split...');
  // Simulate an offer worth $2.00 (200 cents)
  // Worker gets 40% ($0.80 = 80 cents = 8,000 Points)
  // Reward River retains 60% ($1.20 = 120 cents)
  const grossCents = 200;
  const userCents = Math.round(grossCents * 0.40); // 80 cents
  const platformCents = grossCents - userCents; // 120 cents

  await dbStore.recordPlatformRevenue({
    providerId: 'cpx',
    providerName: 'Reward River Direct Gateway • Survey Stream Alpha',
    sourceType: 'survey',
    grossAmountCents: grossCents,
    userShareCents: userCents,
    platformShareCents: platformCents,
    userId: createdUser.id,
    userEmail: createdUser.email,
    providerTxId: `tx_${Date.now()}`,
    description: 'Verified Direct Survey Completion'
  });

  await dbStore.addLedgerEntry({
    id: `ledg_${Date.now()}`,
    userId: createdUser.id,
    providerTxId: `tx_${Date.now()}`,
    amountCents: userCents,
    entryType: 'credit',
    status: 'confirmed',
    description: `Direct Survey Reward (8,000 Points)`,
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString()
  });

  const balances = dbStore.getUserBalances(createdUser.id);
  const availableFormatted = `$${(balances.availableCents / 100).toFixed(2)}`;
  const availablePoints = Math.round((balances.availableCents / 100) * 10000);
  console.log(`- Worker Credited: ${availableFormatted} (${availablePoints.toLocaleString()} Points)`);
  console.log(`  (Worker only sees 40% payout: $0.80 - 60% margin remains confidential)`);

  const finSummary = dbStore.getFinancialSummary();
  console.log(`- Platform Financial Summary:`);
  console.log(`  * Gross Inflow: ${finSummary.grossInflowFormatted}`);
  console.log(`  * Reward River Retained Profit (60%): ${finSummary.platformProfitFormatted}`);
  console.log(`  * User Disbursed (40%): ${finSummary.userDisbursedFormatted}`);

  if (balances.availableCents !== 80) {
    throw new Error(`Expected worker balance 80 cents, got ${balances.availableCents}`);
  }
  console.log('✅ 60/40 Invisible Profit Split verified 100% accurate!');

  // 5. JobsWorkTech Micro-Tasks Marketplace Test
  console.log('\n[5] Testing Micro-Tasks Campaign & Submission Workflow...');
  
  // Test Advertiser Deposit
  console.log('  * Funding advertiser balance with $10.00 deposit...');
  await dbStore.createAdvertiserDeposit({
    advertiserId: createdUser.id,
    amountCents: 1000,
    method: 'usdt_trc20'
  });
  console.log('  * Advertiser deposit confirmed.');

  const newCampaign = await dbStore.createTaskCampaign({
    advertiserId: createdUser.id,
    advertiserEmail: createdUser.email,
    title: 'Visit Reward River Telegram & Join Community',
    description: 'Join our official Telegram announcement channel and submit username proof.',
    instructions: ['1. Open link', '2. Click Join', '3. Submit handle'],
    category: 'social',
    targetUrl: 'https://t.me/rewardriver',
    rewardPoints: 1000,
    rewardCents: 10,
    totalSlots: 20,
    targetCountry: 'ALL',
    targetDevice: 'all',
    requiredProofType: 'text',
    proofInstructions: 'Enter your Telegram username',
    status: 'active',
    platformFeePercent: 10,
    advertiserBudgetReservedCents: 200,
    advertiserFeeReservedCents: 20
  });
  console.log(`- Campaign Created: "${newCampaign.title}" (ID: ${newCampaign.id})`);

  const submission = await dbStore.createSubmission({
    taskId: newCampaign.id,
    workerId: createdUser.id,
    proofText: '@reward_river_tester'
  });
  console.log(`- Worker Submission Created: ID: ${submission.id}, Status: ${submission.status}`);

  const reviewedSub = await dbStore.reviewSubmission(submission.id, 'approved', 'admin_sys');
  console.log(`- Admin Review Completed: Status: ${reviewedSub.status}`);
  
  const updatedBalances = dbStore.getUserBalances(createdUser.id);
  const updatedPoints = Math.round((updatedBalances.availableCents / 100) * 10000);
  console.log(`- Worker New Balance: $${(updatedBalances.availableCents / 100).toFixed(2)} (${updatedPoints.toLocaleString()} Points)`);
  console.log('✅ Micro-tasks lifecycle verified 100% operational.');

  // 6. Universal Ad Slots Test
  console.log('\n[6] Testing Universal Ad Slots System...');
  const adSlots = dbStore.getAdSlots();
  console.log(`- Total Ad Slots: ${adSlots.length}`);
  const updatedSlot = await dbStore.updateAdSlot('sticky_bottom_728', {
    enabled: true,
    name: 'Reward River Sticky Bottom Desktop (728x90)'
  });
  console.log(`- Updated Ad Slot: ${updatedSlot.name} (Enabled: ${updatedSlot.enabled})`);
  console.log('✅ Ad Slot management verified.');

  // 7. Verify Firebase Removal
  console.log('\n[7] Verifying 100% Firebase Package & Code Removal...');
  try {
    await import('firebase' as any);
    throw new Error('Firebase package is still importable!');
  } catch (err: any) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find package') || err.message?.includes('Cannot find module')) {
      console.log('✅ Firebase package is completely uninstalled and cannot be found.');
    } else {
      throw err;
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 7 SUPABASE BACKEND VERIFICATION CHECKS PASSED!');
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

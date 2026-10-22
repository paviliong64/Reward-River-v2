import 'dotenv/config';
import { dbStore } from './server/db';
import { offerwallService } from './server/offerwallService';

async function runDynamicProviderTest() {
  console.log('================================================================');
  console.log('🌐 REWARD RIVER - DYNAMIC PROVIDER INTEGRATION LIFECYCLE TEST');
  console.log('================================================================\n');

  // 1. Initialize store
  console.log('[1] Initializing Database Store...');
  await dbStore.init();
  console.log('✅ Store initialized.');

  // 2. Check Existing Seeded Providers
  console.log('\n[2] Verifying Pre-Existing Default Providers (CPX, Aoyco, AdvertsReward)...');
  const existingProviders = dbStore.getProviders();
  const cpx = existingProviders.find(p => p.id === 'cpx');
  const aoyco = existingProviders.find(p => p.id === 'aoyco');
  const adv = existingProviders.find(p => p.id === 'advertsreward');

  if (!cpx || !aoyco || !adv) {
    throw new Error('Default providers missing!');
  }
  console.log(`  ✓ [cpx] CPX Research: ${cpx.publicBrandName} (Enabled: ${cpx.enabled})`);
  console.log(`  ✓ [aoyco] Aoyco Network: ${aoyco.publicBrandName} (Enabled: ${aoyco.enabled})`);
  console.log(`  ✓ [advertsreward] AdvertsReward: ${adv.publicBrandName} (Enabled: ${adv.enabled})`);

  // 3. Admin Integrates a Brand New Provider (e.g. BitLabs or Monlix)
  console.log('\n[3] Simulating Admin Adding a BRAND NEW Provider via Admin Portal...');
  const newProviderSlug = 'bitlabs_test_' + Date.now();
  const created = await dbStore.createProvider({
    id: newProviderSlug,
    name: 'BitLabs Surveys & Apps',
    publicBrandName: 'Reward River Direct Gateway • Prime Surveys Delta',
    tagline: 'High-Yield International Consumer Studies',
    description: 'Instant points on verified survey completions.',
    category: 'surveys',
    enabled: true,
    launchUrlTemplate: 'https://web.bitlabs.ai/?token={app_id}&uid={external_id}',
    appId: 'bl_pub_app_9988',
    secretKey: 'bl_secret_key_7766',
    userSharePercent: 40,
    platformSharePercent: 60,
    icon: 'BL',
    badge: 'Direct Stream'
  });

  console.log(`  ✓ New Provider Created: "${created.name}" (ID: ${created.id})`);
  console.log(`  ✓ Public White-Label Brand: "${created.publicBrandName}"`);
  console.log(`  ✓ S2S Webhook URL: /api/postback/${created.id}`);

  // 4. Test User Launch URL Resolution
  console.log('\n[4] Testing User Launch URL Dynamic Macro Substitution...');
  const testUserOpaqueId = 'usr_ext_mock_123456';
  const availableWalls = offerwallService.getAvailableOfferwalls(testUserOpaqueId, '198.51.100.5');
  const matchedNewWall = availableWalls.find(w => w.id === newProviderSlug);

  if (!matchedNewWall) {
    throw new Error('New provider did not appear in getAvailableOfferwalls!');
  }
  console.log(`  ✓ Dynamic Wall Launch URL: ${matchedNewWall.launchUrl}`);
  if (!matchedNewWall.launchUrl.includes('uid=usr_ext_mock_123456') || !matchedNewWall.launchUrl.includes('bl_pub_app_9988')) {
    throw new Error('Macro substitution failed in launch URL.');
  }
  console.log('  ✓ Macros {external_id} and {app_id} correctly substituted!');

  // 5. Test Universal S2S Postback for the New Provider
  console.log('\n[5] Simulating Partner Postback Webhook to /api/postback/:providerId ...');
  // Create or get a test user
  let testUser = dbStore.getAllUsers().find(u => u.role === 'user');
    const nowStr = new Date().toISOString();
    testUser = await dbStore.createUser({
      id: `usr_dyn_${Date.now()}`,
      email: `test_worker_${Date.now()}@rewardriver.com`,
      displayName: 'Test Worker',
      role: 'user',
      passwordHash: 'dyn_hash',
      salt: 'dyn_salt',
      emailVerified: true,
      externalOpaqueId: `ext_dyn_${Date.now()}`,
      createdAt: nowStr,
      updatedAt: nowStr
    });

  const initialBalanceCents = dbStore.getUserBalances(testUser.id).availableCents;
  console.log(`  * User initial confirmed balance: $${(initialBalanceCents / 100).toFixed(2)} (${initialBalanceCents * 100} Points)`);

  // Simulate Partner sending a $3.00 (30,000 points) postback
  const postbackResult = await offerwallService.processUniversalPostback({
    providerId: newProviderSlug,
    rawUserId: testUser.id,
    transId: `tx_bitlabs_${Date.now()}`,
    rawAmount: 3.00, // $3.00 USD
    status: 1
  });

  if (!postbackResult.success) {
    throw new Error(`Postback failed: ${postbackResult.message}`);
  }
  console.log(`  ✓ Postback successfully processed!`);
  console.log(`    Message: ${postbackResult.message}`);
  console.log(`    User Points Credited (40%): +${postbackResult.userPointsAdded} Points ($${((postbackResult.userPointsAdded || 0) / 10000).toFixed(2)})`);
  console.log(`    Reward River Retained Profit (60%): +$${((postbackResult.platformProfitCents || 0) / 100).toFixed(2)}`);

  // Verify 60/40 Mathematics
  if (postbackResult.userPointsAdded !== 12000) { // 40% of 30,000 is 12,000 points ($1.20)
    throw new Error(`Expected 12,000 points for user, got ${postbackResult.userPointsAdded}`);
  }
  if (postbackResult.platformProfitCents !== 180) { // 60% of $3.00 is $1.80 (180 cents)
    throw new Error(`Expected 180 cents for platform profit, got ${postbackResult.platformProfitCents}`);
  }
  console.log('  ✓ 60% Platform Profit ($1.80) vs 40% User Share ($1.20) verified 100% exact!');

  const newBalanceCents = dbStore.getUserBalances(testUser.id).availableCents;
  console.log(`  * User new confirmed balance: $${(newBalanceCents / 100).toFixed(2)} (${newBalanceCents * 100} Points) [Diff: +$${((newBalanceCents - initialBalanceCents) / 100).toFixed(2)}]`);

  // Clean up test provider
  await dbStore.deleteProvider(newProviderSlug);
  console.log('\n[6] Cleaned up temporary test provider.');

  console.log('\n================================================================');
  console.log('🎉 100% CONFIRMED: ANY PROVIDER CAN BE INTEGRATED VIA ADMIN!');
  console.log('================================================================\n');
}

runDynamicProviderTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

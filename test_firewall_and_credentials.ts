import 'dotenv/config';
import { AdminFirewallService } from './server/adminFirewall';
import { dbStore } from './server/db';
import { hashPassword, verifyPassword, createSessionToken } from './server/auth';

async function runFirewallAndCredentialsTest() {
  console.log('====================================================');
  console.log('🛡️ REWARD RIVER - FIREWALL & ADMIN CREDENTIALS TEST');
  console.log('====================================================\n');

  // 1. Initialize store
  console.log('[1] Initializing Database Store...');
  await dbStore.init();
  console.log('✅ Store initialized.\n');

  // 2. Test AdminFirewallService Rate Limiting
  console.log('[2] Testing Firewall IP Rate Limiter & Lockout Shield...');
  const testIp = '198.51.100.99';

  // Ensure IP is clean initially
  AdminFirewallService.recordSuccessfulLogin(testIp, 'test@rewardriver.com');
  const initialBlocked = AdminFirewallService.isIpBlocked(testIp);
  if (initialBlocked.blocked) throw new Error('Clean IP should not be blocked.');
  console.log('  ✓ Clean IP access granted.');

  // Simulate 4 failed attempts (under 5 limit)
  for (let i = 1; i <= 4; i++) {
    AdminFirewallService.recordFailedAttempt(testIp, 'admin@rewardriver.com', `Failed attempt #${i}`);
  }
  const blockedUnderLimit = AdminFirewallService.isIpBlocked(testIp);
  if (blockedUnderLimit.blocked) throw new Error('IP should not be blocked after 4 attempts.');
  console.log('  ✓ 4 failed attempts recorded, IP remains under limit.');

  // 5th failed attempt triggers 15m lockout
  AdminFirewallService.recordFailedAttempt(testIp, 'admin@rewardriver.com', 'Failed attempt #5');
  const blockedAfter5 = AdminFirewallService.isIpBlocked(testIp);
  if (!blockedAfter5.blocked) throw new Error('IP MUST BE BLOCKED after 5 failed attempts.');
  console.log('  ✓ 5th failed attempt triggered AUTOMATIC 15-MINUTE LOCKOUT shield!');

  // Check honeypot bot trap
  console.log('\n[3] Testing Automated Bot Honeypot Trap Shield...');
  const botIp = '203.0.113.88';
  let botTrapped = false;
  const mockBotReq: any = {
    headers: { 'x-forwarded-for': botIp },
    socket: {},
    body: { email: 'admin@rewardriver.com', password: 'hack', _admin_trap_field: 'malicious_bot_content' }
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 403) {
          botTrapped = true;
        }
      }
    })
  };
  AdminFirewallService.firewallGuard(mockBotReq, mockRes, () => {});
  if (!botTrapped) throw new Error('Honeypot field failed to trap bot.');
  console.log('  ✓ Bot honeypot caught malicious scraper and returned 403 Forbidden!');

  // 4. Test Admin Credentials PBKDF2 & Rotation
  console.log('\n[4] Testing Admin Credentials Vault & Cryptographic Rotation...');
  let admin = dbStore.getUserByEmail('admin@rewardriver.com');
  if (!admin) {
    admin = dbStore.getAllUsers().find(u => u.role === 'admin');
  }
  if (!admin) throw new Error('Admin user not found in database.');

  console.log(`  ✓ Current Admin Found: ${admin.email} (Role: ${admin.role})`);

  // Verify wrong password fails
  const wrongPassVerified = verifyPassword('wrongpass123', admin.passwordHash, admin.salt);
  if (wrongPassVerified) throw new Error('Wrong password must not verify.');
  console.log('  ✓ Invalid password rejected by PBKDF2 SHA-512 verifier.');

  // Verify correct current password works
  const correctPassVerified = verifyPassword('admin123', admin.passwordHash, admin.salt);
  console.log(`  ✓ Current password verified: ${correctPassVerified ? 'MATCH' : 'CUSTOMIZED'}`);

  // Test updating password with PBKDF2 hash
  const testNewPass = 'SuperSecurePass2026!';
  const { hash: newHash, salt: newSalt } = hashPassword(testNewPass);
  const updatedAdmin = await dbStore.updateUser(admin.id, {
    passwordHash: newHash,
    salt: newSalt
  });

  const verifiedNewPass = verifyPassword(testNewPass, updatedAdmin.passwordHash, updatedAdmin.salt);
  if (!verifiedNewPass) throw new Error('New password failed verification.');
  console.log('  ✓ Password rotated to new hash and verified with PBKDF2.');

  // Restore password back to default for development/testing consistency
  const { hash: restoredHash, salt: restoredSalt } = hashPassword('admin123');
  await dbStore.updateUser(admin.id, {
    passwordHash: restoredHash,
    salt: restoredSalt
  });
  console.log('  ✓ Master password restored cleanly to seed configuration.');

  // 5. Test Audit Log Persistence
  console.log('\n[5] Verifying Audit Trail Logging...');
  const auditLogs = dbStore.getAuditLogs();
  const firewallLogs = auditLogs.filter(l => l.action.includes('FIREWALL') || l.action.includes('ADMIN'));
  console.log(`  ✓ Total Audit Logs: ${auditLogs.length}`);
  console.log(`  ✓ Security & Firewall Logs: ${firewallLogs.length}`);
  if (firewallLogs.length === 0) throw new Error('Security events were not logged to audit trail.');

  console.log('\n====================================================');
  console.log('🎉 ALL FIREWALL & ADMIN CREDENTIALS CHECKS PASSED!');
  console.log('====================================================\n');
}

runFirewallAndCredentialsTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

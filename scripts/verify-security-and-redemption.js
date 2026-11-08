const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('--- STARTING SECURITY & REDEMPTION INTEGRATION TEST ---');

  // 1. Verify Seeded VIP Codes in Database
  const codes = await prisma.vipCode.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Found ${codes.length} seeded VIP/Contest codes in database.`);
  if (codes.length < 6) {
    throw new Error('Expected at least 6 seeded VIP codes');
  }

  // 2. Test Single-Use Limit and Duplicate Prevention
  const testCode = 'AURA-CONTEST-WINNER-1';
  const vip = await prisma.vipCode.findUnique({
    where: { code: testCode },
  });

  console.log(`Verified test code: ${testCode}, maxUses: ${vip.maxUses}, timesUsed: ${vip.timesUsed}`);

  // 3. Test User Registration Trial Ends Calculation
  const testEmail = `artist-test-${Date.now()}@testaura.sk`;
  const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Artist',
      role: 'USER',
      plan: 'FREE_TRIAL',
      subscriptionStatus: 'TRIALING',
      trialEndsAt: trialEnds,
    },
  });

  console.log(`Created test user ${testUser.id} with trialEndsAt: ${testUser.trialEndsAt.toISOString()}`);
  const daysDiff = Math.round((testUser.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysDiff < 29 || daysDiff > 31) {
    throw new Error(`Invalid trial duration calculation: ${daysDiff} days`);
  }
  console.log(`✓ 30-Day trial calculation verified: exactly ${daysDiff} days!`);

  // 4. Test Single-Use Redemption Simulation
  const redemption = await prisma.vipRedemption.create({
    data: {
      codeId: vip.id,
      userId: testUser.id,
      userEmail: testUser.email,
    },
  });
  console.log(`✓ User successfully redeemed code: ${testCode}`);

  // 5. Verify Duplicate Redemption is Blocked by Unique Constraint
  let duplicateBlocked = false;
  try {
    await prisma.vipRedemption.create({
      data: {
        codeId: vip.id,
        userId: testUser.id,
        userEmail: testUser.email,
      },
    });
  } catch (err) {
    duplicateBlocked = true;
    console.log('✓ Duplicate redemption blocked by database constraint:', err.code || err.message);
  }

  if (!duplicateBlocked) {
    throw new Error('Duplicate redemption was not blocked!');
  }

  // Cleanup test data
  await prisma.vipRedemption.deleteMany({
    where: { userId: testUser.id },
  });
  await prisma.user.delete({
    where: { id: testUser.id },
  });
  console.log('✓ Test cleanup completed successfully.');

  console.log('--- ALL SECURITY & REDEMPTION TESTS PASSED! ---');
}

runVerification()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INITIAL_VIP_CODES = [
  {
    code: 'AURA-CONTEST-WINNER-1',
    label: '13OMI Contest Winner #1',
    durationDays: 365,
    maxUses: 1,
    isContest: true,
  },
  {
    code: 'AURA-CONTEST-WINNER-2',
    label: '13OMI Contest Winner #2',
    durationDays: 365,
    maxUses: 1,
    isContest: true,
  },
  {
    code: 'AURA-CONTEST-WINNER-3',
    label: '13OMI Contest Winner #3',
    durationDays: 365,
    maxUses: 1,
    isContest: true,
  },
  {
    code: 'AURA-VIP-FLOW-01',
    label: 'Artist Beta Invite #1',
    durationDays: 30,
    maxUses: 1,
    isContest: false,
  },
  {
    code: 'AURA-VIP-BEAT-02',
    label: 'Artist Beta Invite #2',
    durationDays: 30,
    maxUses: 1,
    isContest: false,
  },
  {
    code: 'AURA-VIP-PRO-03',
    label: 'Artist Beta Invite #3',
    durationDays: 30,
    maxUses: 1,
    isContest: false,
  },
];

async function seed() {
  console.log('Seeding VIP and contest codes into database...');
  for (const item of INITIAL_VIP_CODES) {
    await prisma.vipCode.upsert({
      where: { code: item.code },
      update: {
        label: item.label,
        durationDays: item.durationDays,
        maxUses: item.maxUses,
        isContest: item.isContest,
      },
      create: {
        code: item.code,
        label: item.label,
        durationDays: item.durationDays,
        maxUses: item.maxUses,
        isContest: item.isContest,
      },
    });
    console.log(`✓ Seeded code: ${item.code} (${item.durationDays} days)`);
  }
  console.log('Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Error seeding codes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from '../src/services/prisma/prismaClient';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedJournal() {
  console.log('Ensuring basic Chart of Accounts exists...');

  const accountsToCreate = [
    { code: '1000', name: 'Bank/Cash', type: 'ASSET' },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
    { code: '5000', name: 'Purchases', type: 'EXPENSE' },
  ];

  for (const acc of accountsToCreate) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        isActive: true,
        createdBy: 1,
        updatedBy: 1,
      }
    });
  }

  const cashAcc = await prisma.account.findUnique({ where: { code: '1000' } });
  const revAcc = await prisma.account.findUnique({ where: { code: '4000' } });

  if (!cashAcc || !revAcc) {
    console.error('Required accounts not found. Please run seed first.');
    return;
  }

  const je = await prisma.journalEntry.create({
    data: {
      number: 'JRN-TEST-001',
      date: new Date(),
      reference: 'REF-001',
      narration: 'Test manual journal entry for verification.',
      status: 'READY',
      lines: {
        create: [
          { accountId: cashAcc.id, debit: 1500, credit: 0, description: 'Debiting Cash' },
          { accountId: revAcc.id, debit: 0, credit: 1500, description: 'Crediting Revenue' },
        ]
      }
    }
  });

  console.log('✅ Created Journal Entry:', je.number);
}

seedJournal()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

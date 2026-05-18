import { PrismaClient, BankTransactionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const bankAccount = await prisma.bankAccount.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      name: 'Main Operating Account',
      bankName: 'CIMB Bank',
      accountNumber: '8001234567',
      currency: 'RM',
      balance: 1500,
      accountId: 1n, // Linked to Bank/Cash account
      createdBy: 1n,
      updatedBy: 1n,
    }
  });

  console.log('Bank Account setup complete:', bankAccount.name);

  const timestamp = Date.now();
  // Add some Journal Entries (Ledger side)
  const je1 = await prisma.journalEntry.create({
    data: {
      number: `JE-MATCH-${timestamp}-001`,
      date: new Date('2026-04-01'),
      narration: 'Consultancy Fees Received',
      status: 'READY',
      createdBy: 1n,
      updatedBy: 1n,
      lines: {
        create: [
          { accountId: 1n, debit: 1000, credit: 0, description: 'Bank Deposit', createdBy: 1n, updatedBy: 1n },
          { accountId: 4n, debit: 0, credit: 1000, description: 'Service Revenue', createdBy: 1n, updatedBy: 1n },
        ]
      }
    }
  });

  const je2 = await prisma.journalEntry.create({
    data: {
      number: `JE-MATCH-${timestamp}-002`,
      date: new Date('2026-04-02'),
      narration: 'Office Rent Payment',
      status: 'READY',
      createdBy: 1n,
      updatedBy: 1n,
      lines: {
        create: [
          { accountId: 1n, debit: 0, credit: 500, description: 'Bank Withdrawal', createdBy: 1n, updatedBy: 1n },
          { accountId: 5n, debit: 500, credit: 0, description: 'Rent Expense', createdBy: 1n, updatedBy: 1n },
        ]
      }
    }
  });

  console.log('Journal Entries created for matching.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

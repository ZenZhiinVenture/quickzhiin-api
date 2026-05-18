import { tenantPrismaManager } from './src/services/prisma/tenantClient';
import { reportingService } from '../src/services/account/report';

async function testTrialBalance() {
    console.log('--- Starting Trial Balance Report Verification ---');

    const tenantId = 1; // Assuming tenant 1 exists
    const tenantDb = await tenantPrismaManager.getClient(tenantId);

    // 1. Setup Data
    const date = new Date('2026-03-31');

    console.log('1. Setting up Transactional Data...');

    // Find Accounts (Bank/Cash, Sales Revenue, Misc Expense)
    const bankAcc = await tenantDb.account.findFirst({ where: { name: 'Bank/Cash' } });
    const revAcc = await tenantDb.account.findFirst({ where: { name: 'Sales Revenue' } });
    const expAcc = await tenantDb.account.findFirst({ where: { type: 'EXPENSE' } });

    if (!bankAcc || !revAcc || !expAcc) {
        console.error('❌ Required accounts not found. Please ensure seeder has run.');
        process.exit(1);
    }

    // Clear existing entries for these accounts in the test range to avoid noise
    await tenantDb.journalEntryLine.deleteMany({
        where: {
            accountId: { in: [bankAcc.id, revAcc.id, expAcc.id] },
            journalEntry: { date: { gte: new Date('2026-01-01') } }
        }
    });

    // A. Create Transaction 1: Capital Input (RM 5000 Debit Bank / RM 5000 Credit Sales/Equity placeholder)
    await tenantDb.journalEntry.create({
        data: {
            number: `TB-JE1-${Date.now()}`,
            date: new Date('2026-03-01'),
            status: 'READY',
            lines: {
                create: [
                    { accountId: bankAcc.id, debit: 5000, credit: 0, description: 'Initial Capital' },
                    { accountId: revAcc.id, debit: 0, credit: 5000, description: 'Initial Capital' }
                ]
            }
        }
    });

    // B. Create Transaction 2: Expense (RM 500 Debit Expense / RM 500 Credit Bank)
    await tenantDb.journalEntry.create({
        data: {
            number: `TB-JE2-${Date.now()}`,
            date: new Date('2026-03-15'),
            status: 'READY',
            lines: {
                create: [
                    { accountId: expAcc.id, debit: 500, credit: 0, description: 'Office Supplies' },
                    { accountId: bankAcc.id, debit: 0, credit: 500, description: 'Office Supplies' }
                ]
            }
        }
    });

    console.log('✅ Created Transactions (Total Balancing: RM 5000)');

    // 2. Run Report
    console.log('2. Generating Trial Balance...');
    const report = await reportingService.getTrialBalance(tenantDb, date);

    // 3. Verify Equality
    console.log(`--- Trial Balance Check (As of ${report.date}) ---`);
    console.log(`   Total Debit:  RM ${report.totalDebit}`);
    console.log(`   Total Credit: RM ${report.totalCredit}`);
    console.log(`   Is Balanced:  ${report.isBalanced}`);

    const success =
        report.totalDebit === report.totalCredit &&
        report.isBalanced === true;

    if (success) {
        console.log('✅ Trial Balance Integrity Verified!');
    } else {
        console.error('❌ Trial Balance Logic Failed! Debits must equal Credits.');
    }

    console.log('--- Trial Balance Verification Complete ---');
}

testTrialBalance()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

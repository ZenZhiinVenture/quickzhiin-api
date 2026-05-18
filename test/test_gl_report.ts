import { tenantPrismaManager } from './src/services/prisma/tenantClient';
import { reportingService } from '../src/services/account/report';

async function testGLReport() {
    console.log('--- Starting General Ledger Report Verification ---');

    const tenantId = 1; // Assuming tenant 1 exists from previous tests or seeding
    const tenantDb = await tenantPrismaManager.getClient(tenantId);

    // 1. Setup Dates
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-31');
    const preDate = new Date('2026-02-15');

    console.log('1. Setting up Transactional Data...');

    // Find Accounts (Bank/Cash and Sales Revenue)
    const cashAcc = await tenantDb.account.findFirst({ where: { name: 'Bank/Cash' } });
    const revAcc = await tenantDb.account.findFirst({ where: { name: 'Sales Revenue' } });

    if (!cashAcc || !revAcc) {
        console.error('❌ Required accounts not found. Please ensure seeder has run.');
        process.exit(1);
    }

    // Clear existing entries for these accounts in the test range to avoid noise
    await tenantDb.journalEntryLine.deleteMany({
        where: {
            accountId: { in: [cashAcc.id, revAcc.id] },
            journalEntry: { date: { gte: new Date('2026-01-01') } }
        }
    });

    // A. Create Opening Transaction (Pre-range)
    const jeOpening = await tenantDb.journalEntry.create({
        data: {
            number: `GL-OPEN-${Date.now()}`,
            date: preDate,
            status: 'READY',
            lines: {
                create: [
                    { accountId: cashAcc.id, debit: 1000, credit: 0, description: 'Initial Capital' },
                    { accountId: revAcc.id, debit: 0, credit: 1000, description: 'Initial Capital' }
                ]
            }
        }
    });
    console.log('✅ Created Opening Transaction (RM 1000 Cash)');

    // B. Create Transaction In-range
    const jeInRange = await tenantDb.journalEntry.create({
        data: {
            number: `GL-RANGE-${Date.now()}`,
            date: new Date('2026-03-15'),
            status: 'READY',
            lines: {
                create: [
                    { accountId: cashAcc.id, debit: 0, credit: 200, description: 'Misc Expense' },
                    { accountId: revAcc.id, debit: 200, credit: 0, description: 'Misc Adjustment' }
                ]
            }
        }
    });
    console.log('✅ Created Period Transaction (RM 200 Cash Credit)');

    // 2. Run Report
    console.log('2. Generating General Ledger Report...');
    const report = await reportingService.getGeneralLedger(tenantDb, startDate, endDate);

    // 3. Verify Cash Account
    const cashReport = report.accounts.find((a: any) => a.code === cashAcc.code);

    if (!cashReport) {
        console.error('❌ Cash account not found in report!');
    } else {
        console.log(`--- Cash Account (Type: ${cashReport.type}) ---`);
        console.log(`   Opening Balance: RM ${cashReport.openingBalance}`);
        console.log(`   Total Debit: RM ${cashReport.totalDebit}`);
        console.log(`   Total Credit: RM ${cashReport.totalCredit}`);
        console.log(`   Closing Balance: RM ${cashReport.closingBalance}`);

        const success =
            cashReport.openingBalance === 1000 &&
            cashReport.totalCredit === 200 &&
            cashReport.closingBalance === 800;

        if (success) {
            console.log('✅ Cash Account GL Logic Verified!');
        } else {
            console.error('❌ Cash Account GL Logic Failed!');
        }
    }

    console.log('--- GL Report Verification Complete ---');
}

testGLReport()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

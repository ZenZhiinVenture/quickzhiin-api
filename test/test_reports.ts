import { tenantPrismaManager } from './src/services/prisma/tenantClient';
import { autoJournal } from '../src/services/account/autoJournal';
import { reportingService } from '../src/services/account/report';

async function verifyReports() {
  console.log('--- Starting Accounting Report Verification ---');
  const tenantDb = await tenantPrismaManager.getClient(1);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Setup Data: 1 Invoice (RM 1000) and 1 Bill (RM 400)
  console.log('1. Setting up Transactional Data...');

  const customer = await tenantDb.user.findFirst();
  if (!customer) throw new Error('No user found');

  const invNum = `REP-INV-${Date.now()}`;
  const invoice = await tenantDb.invoice.create({
    data: {
      number: invNum,
      date: now,
      customerId: customer.id,
      currency: 'MYR',
      subtotal: 1000,
      total: 1000,
      status: 'READY'
    }
  });
  await autoJournal.syncInvoiceJournal(tenantDb, invoice, 1);
  console.log(`✅ Created Invoice: ${invNum} (RM 1000 Revenue)`);

  const billNum = `REP-BIL-${Date.now()}`;
  const bill = await tenantDb.bill.create({
    data: {
      number: billNum,
      date: now,
      customerId: customer.id,
      subtotal: 400,
      total: 400,
      status: 'READY'
    }
  });
  await autoJournal.syncBillJournal(tenantDb, bill, 1);
  console.log(`✅ Created Bill: ${billNum} (RM 400 Expense)`);

  // 2. Test Profit & Loss
  console.log('2. Verifying Profit & Loss Report...');
  const pl = await reportingService.getProfitAndLoss(tenantDb, startOfMonth, now);

  console.log(`   - Total Revenue: RM ${pl.totalRevenue}`);
  console.log(`   - Total Expenses: RM ${pl.totalExpenses}`);
  console.log(`   - Net Profit: RM ${pl.netProfit}`);

  if (pl.netProfit === 600) {
    console.log('✅ P&L Logic Verified: RM 600 Net Profit matches expected (1000 - 400)');
  } else {
    console.error(`❌ P&L Logic Failed: Expected 600, got ${pl.netProfit}`);
  }

  // 3. Test Balance Sheet
  console.log('3. Verifying Balance Sheet Report...');
  const bs = await reportingService.getBalanceSheet(tenantDb, now);

  console.log(`   - Total Assets: RM ${bs.totalAssets}`);
  console.log(`   - Total Liabilities: RM ${bs.totalLiabilities}`);
  console.log(`   - Total Equity: RM ${bs.totalEquity}`);
  console.log(`   - Current Year Earnings (Retained): RM ${bs.currentYearEarnings}`);
  console.log(`   - Balanced: IT IS ${bs.isBalanced ? 'BALANCED' : 'UNBALANCED'}`);

  if (bs.isBalanced) {
    console.log('✅ Balance Sheet Verified: Assets = Liabilities + Equity');
  } else {
    console.error('❌ Balance Sheet Error: The fundamental accounting equation is broken!');
  }

  // Cleanup
  await tenantDb.invoice.delete({ where: { id: invoice.id } });
  await tenantDb.bill.delete({ where: { id: bill.id } });
  console.log('--- Report Verification Complete ---');
}

verifyReports().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

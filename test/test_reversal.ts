import { tenantPrismaManager } from './src/services/prisma/tenantClient';
import { autoJournal } from '../src/services/account/autoJournal';
import { deleteInvoice } from '../src/services/invoice/delete';

async function runTest() {
  console.log('--- Starting Reversal Integration Test ---');
  const tenantDb = await tenantPrismaManager.getClient(1);

  // 1. Setup simulated invoice directly via DB
  console.log('1. Setting up Test Invoice and GL Entry...');
  const testNumber = `TEST-${Date.now()}`;

  const customer = await tenantDb.user.findFirst();
  if (!customer) {
    console.log('No user found to attach invoice to. Aborting test.');
    process.exit(1);
  }

  // Bypass the 1-to-1 schema bug currently in Invoice for the test
  const existingInvoice = await tenantDb.invoice.findUnique({ where: { customerId: customer.id } });
  if (existingInvoice) {
    console.log('Cleaning up existing invoice on this user due to unique schema constraint...');
    await deleteInvoice(tenantDb, existingInvoice.id);
  }

  const invoice = await tenantDb.invoice.create({
    data: {
      number: testNumber,
      date: new Date(),
      customerId: customer.id,
      currency: 'MYR',
      subtotal: 1000,
      tax: 100,
      total: 1100,
      status: 'DRAFT',
      createdBy: BigInt(1),
      updatedBy: BigInt(1),
    }
  });

  console.log(`- Created Invoice ID: ${invoice.id} (${testNumber})`);

  // 2. Sync Journal
  await autoJournal.syncInvoiceJournal(tenantDb, invoice, 1);

  // Verify Journal Exists
  let journal = await tenantDb.journalEntry.findUnique({
    where: { number: `JRN-INV-${testNumber}` }
  });
  console.log(`- Synced Journal ID: ${journal?.id} is Active: ${journal?.isActive}`);

  // 3. Test Deletion / Reversal Logic
  console.log('2. Triggering Invoice Deletion Feature...');
  await deleteInvoice(tenantDb, invoice.id);

  // 4. Verify Final State (Phantom Balance Check)
  const deletedInvoice = await tenantDb.invoice.findUnique({ where: { id: invoice.id } });
  const deletedJournal = await tenantDb.journalEntry.findUnique({ where: { number: `JRN-INV-${testNumber}` } });

  if (!deletedInvoice && !deletedJournal) {
    console.log('✅ SUCCESS: Both Invoice and deeply nested Journal Entry were completely purged from the ledger!');
  } else {
    console.error('❌ FAILED: Phantom records persisted.');
    if (deletedInvoice) console.error('Invoice still exists!');
    if (deletedJournal) console.error('Journal entry still exists!');
  }
}

runTest().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

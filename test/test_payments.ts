import { tenantPrismaManager } from './src/services/prisma/tenantClient';
import { autoJournal } from '../src/services/account/autoJournal';
import { recordInvoicePayment } from '../src/services/payment/recordPayment';

async function verifyPayments() {
  console.log('--- Starting Payment & Schema Verification ---');
  const tenantDb = await tenantPrismaManager.getClient(1);

  // 1. Setup a Test Customer
  const customer = await tenantDb.user.findFirst();
  if (!customer) {
    console.log('No user found. Aborting.');
    return;
  }

  console.log(`1. Testing Multi-Invoice Support for Customer: ${customer.email}`);

  // Create first invoice
  const inv1Num = `INV-M1-${Date.now()}`;
  const inv1 = await tenantDb.invoice.create({
    data: {
      number: inv1Num,
      date: new Date(),
      customerId: customer.id,
      currency: 'MYR',
      subtotal: 500,
      total: 500,
      status: 'DRAFT',
    }
  });
  console.log(`✅ Invoice 1 Created: ${inv1.number}`);

  // Create second invoice for SAME customer (Should no longer fail)
  const inv2Num = `INV-M2-${Date.now()}`;
  const inv2 = await tenantDb.invoice.create({
    data: {
      number: inv2Num,
      date: new Date(),
      customerId: customer.id,
      currency: 'MYR',
      subtotal: 750,
      total: 750,
      status: 'DRAFT',
    }
  });
  console.log(`✅ Invoice 2 Created: ${inv2.number} (Multi-Invoice Success)`);

  // 2. Test Recording Payment
  console.log('2. Testing Payment Recording and Journaling...');

  // Get a payment method
  let method = await tenantDb.paymentMethod.findFirst();
  if (!method) {
    method = await tenantDb.paymentMethod.create({
      data: { code: 'BNK', name: 'Bank Transfer', isActive: true }
    });
  }

  const payment = await recordInvoicePayment(tenantDb, inv1.id, {
    amount: 500,
    methodId: method.id,
    paidAt: new Date(),
  }, BigInt(1));

  console.log(`✅ Payment Recorded: ID ${payment.id} for RM ${payment.amount}`);

  // 3. Verify Journal Entries
  const journalNum = `JRN-PAY-INV-${payment.id}`;
  const journal = await tenantDb.journalEntry.findUnique({
    where: { number: journalNum },
    include: { lines: { include: { account: true } } }
  });

  if (journal) {
    console.log(`✅ Journal Entry Found: ${journal.number}`);
    journal.lines.forEach((line: any) => {
      console.log(`   - [${line.account.code}] ${line.account.name}: Debit ${line.debit}, Credit ${line.credit}`);
    });

    const isBalanced = journal.lines.reduce((acc: number, line: any) => acc + Number(line.debit) - Number(line.credit), 0) === 0;
    if (isBalanced) {
      console.log('✅ Journal is Balanced (0.00 difference)');
    } else {
      console.error('❌ Journal is UNBALANCED!');
    }
  } else {
    console.error('❌ Journal Entry NOT found for payment!');
  }

  // Cleanup
  await tenantDb.invoice.delete({ where: { id: inv1.id } });
  await tenantDb.invoice.delete({ where: { id: inv2.id } });
  console.log('--- Verification Complete ---');
}

verifyPayments().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

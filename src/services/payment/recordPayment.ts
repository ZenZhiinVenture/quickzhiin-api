import { autoJournal } from '../account/autoJournal';
import { prisma } from '../prisma/prismaClient';

export interface PaymentInput {
  amount: number;
  methodId: number | bigint;
  paidAt: Date | string;
}

/**
 * Record a payment for an Invoice and sync to General Ledger
 */
export async function recordInvoicePayment(prisma: any, invoiceId: number | bigint, paymentData: PaymentInput, userId: number | bigint) {
  const invoiceIdBigInt = BigInt(invoiceId);
  const methodIdBigInt = BigInt(paymentData.methodId);

  return await prisma.$transaction(async (prisma: any) => {
    // 1. Fetch invoice to ensure it exists and get its number
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceIdBigInt },
    });

    if (!invoice) {
        throw new Error('Invoice not found');
    }

    // 2. Create the InvoicePayment record
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId: invoiceIdBigInt,
        amount: paymentData.amount,
        methodId: methodIdBigInt,
        paidAt: new Date(paymentData.paidAt),
        createdBy: BigInt(userId),
        updatedBy: BigInt(userId),
      }
    });

    // 3. Update Invoice Status
    // For now, we assume full payment as per implementation plan
    await prisma.invoice.update({
      where: { id: invoiceIdBigInt },
      data: { status: 'PAID' }
    });

    // 4. Sync to General Ledger
    await autoJournal.syncInvoicePaymentJournal(prisma, payment, invoice, userId);

    return payment;
  });
}

/**
 * Record a payment for a Bill and sync to General Ledger
 */
export async function recordBillPayment(prisma: any, billId: number | bigint, paymentData: PaymentInput, userId: number | bigint) {
  const billIdBigInt = BigInt(billId);
  const methodIdBigInt = BigInt(paymentData.methodId);

  return await prisma.$transaction(async (prisma: any) => {
    // 1. Fetch bill
    const bill = await prisma.bill.findUnique({
      where: { id: billIdBigInt },
    });

    if (!bill) {
        throw new Error('Bill not found');
    }

    // 2. Create the BillPayment record
    const payment = await prisma.billPayment.create({
      data: {
        billId: billIdBigInt,
        amount: paymentData.amount,
        methodId: methodIdBigInt,
        paidAt: new Date(paymentData.paidAt),
        createdBy: BigInt(userId),
        updatedBy: BigInt(userId),
      }
    });

    // 3. Update Bill Status
    await prisma.bill.update({
      where: { id: billIdBigInt },
      data: { status: 'PAID' }
    });

    // 4. Sync to General Ledger
    await autoJournal.syncBillPaymentJournal(prisma, payment, bill, userId);

    return payment;
  });
}

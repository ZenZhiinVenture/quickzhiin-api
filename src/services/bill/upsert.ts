import { autoJournal } from '../account/autoJournal';
import { prisma } from '../prisma/prismaClient';
import { calculateMalaysianRounding } from '../../utils/rounding';
import { Prisma } from '@prisma/client';

export interface BillLineInput {
  productName: string;
  description?: string;
  classificationCode: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface BillInput {
  customerId: number; // For Bills, this is effectively the Supplier/Vendor ID
  currency: string;
  date: Date;
  dueDate?: Date;
  notes?: string;
  paymentTerms?: string;
  billingAddress?: string;
  shippingAddress?: string;
  lines: BillLineInput[];
}

export async function upsertBill(
  billData: BillInput,
  createdBy: number = 1
) {
  // Basic validation
  if (!billData.customerId || !billData.currency || !billData.date || !billData.lines?.length) {
    throw new Error('Missing required bill fields');
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let total = 0;

  const lines = billData.lines.map((line) => {
    const lineDiscount = line.discount || 0;
    const lineTax = line.tax || 0;
    const lineTotal = (line.unitPrice * line.quantity) - lineDiscount + lineTax;
    subtotal += line.unitPrice * line.quantity;
    totalTax += lineTax;
    totalDiscount += lineDiscount;
    total += lineTotal;
    return {
      productName: line.productName,
      description: line.description ?? '',
      classificationCode: line.classificationCode,
      quantity: BigInt(line.quantity),
      unitPrice: line.unitPrice,
      discount: lineDiscount,
      tax: lineTax,
      total: lineTotal,
      createdBy,
      updatedBy: createdBy,
    };
  });

  // Apply rounding for Cash Transactions
  let rounding = 0;
  const isCash = billData.paymentTerms?.toLowerCase() === 'cash' || billData.paymentTerms?.toLowerCase() === 'cod';
  if (isCash) {
    rounding = calculateMalaysianRounding(total);
    total = Number((total + rounding).toFixed(2));
  }

  // Generate bill number
  const lastBill = await prisma.bill.findFirst({
    orderBy: { id: 'desc' },
    select: { number: true },
  });
  const nextNumber = lastBill ? (parseInt(lastBill.number.replace('BIL-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
  const billNumber = `BIL-${nextNumber}`;

  // Create bill and lines in a transaction
  const createdBill = await prisma.$transaction(async (tx) => {
    const bill = await prisma.bill.create({
      data: {
        number: billNumber,
        date: billData.date,
        contactId: BigInt(billData.customerId),
        subtotal: new Prisma.Decimal(subtotal).toString(),
        tax: new Prisma.Decimal(totalTax).toString(),
        discount: new Prisma.Decimal(totalDiscount).toString(),
        rounding: new Prisma.Decimal(rounding).toString(),
        total: new Prisma.Decimal(total).toString(),
        notes: billData.notes,
        billingAddress: billData.billingAddress,
        shippingAddress: billData.shippingAddress,
        status: 'READY',
        createdBy: BigInt(createdBy),
        updatedBy: BigInt(createdBy),
        billLines: {
          create: lines,
        },
      },
      include: {
        billLines: true,
        contact: true,
      },
    });

    // Automated Accounting Sync
    await autoJournal.syncBillJournal(prisma, bill, createdBy);

    return bill;
  });

  return createdBill;
}

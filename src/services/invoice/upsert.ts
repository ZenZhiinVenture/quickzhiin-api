import { autoJournal } from '../account/autoJournal';
import { prisma } from '../prisma/prismaClient';
import { calculateMalaysianRounding } from '../../utils/rounding';
import { Prisma } from '@prisma/client';

export interface InvoiceLineInput {
  productId?: string | number | bigint;
  productName: string;
  description?: string;
  classificationCode?: string;
  msicCode?: string;
  msicDescription?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface InvoiceInput {
  contactId: string | number | bigint;
  currency: string;
  date: string | Date;
  dueDate?: string | Date;
  notes?: string;
  paymentTerms?: string;
  billingAddress?: string;
  shippingAddress?: string;
  lines: InvoiceLineInput[];
}

export async function upsertInvoice(
  invoiceData: InvoiceInput,
  createdBy: bigint = BigInt(1)
) {
  // Basic validation
  if (!invoiceData.contactId || !invoiceData.currency || !invoiceData.date || !invoiceData.lines?.length) {
    throw new Error('Missing required invoice fields');
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let total = 0;

  const lines = invoiceData.lines.map((line) => {
    const lineDiscount = line.discount || 0;
    const lineTax = line.tax || 0;
    const lineTotal = (line.unitPrice * line.quantity) - lineDiscount + lineTax;
    subtotal += line.unitPrice * line.quantity;
    totalTax += lineTax;
    totalDiscount += lineDiscount;
    total += lineTotal;
    return {
      productId: line.productId ? BigInt(line.productId) : undefined,
      productName: line.productName,
      description: line.description ?? '',
      classificationCode: line.classificationCode || '',
      msicCode: line.msicCode,
      msicDescription: line.msicDescription,
      quantity: line.quantity,
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
  const isCash = invoiceData.paymentTerms?.toLowerCase() === 'cash' || invoiceData.paymentTerms?.toLowerCase() === 'cod';
  if (isCash) {
    rounding = calculateMalaysianRounding(total);
    total = Number((total + rounding).toFixed(2));
  }

  // Generate invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { id: 'desc' },
    select: { number: true },
  });
  const nextNumber = lastInvoice ? (parseInt(lastInvoice.number, 10) + 1).toString().padStart(6, '0') : '000001';

  // Create invoice and lines in a transaction
  const createdInvoice = await prisma.$transaction(async (tx) => {
    const data = {
      number: nextNumber,
      date: new Date(invoiceData.date),
      contactId: BigInt(invoiceData.contactId),
      currency: invoiceData.currency,
      subtotal: new Prisma.Decimal(subtotal).toString(),
      tax: new Prisma.Decimal(totalTax).toString(),
      discount: new Prisma.Decimal(totalDiscount).toString(),
      rounding: new Prisma.Decimal(rounding).toString(),
      total: new Prisma.Decimal(total).toString(),
      notes: invoiceData.notes,
      paymentTerms: invoiceData.paymentTerms,
      dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
      billingAddress: invoiceData.billingAddress,
      shippingAddress: invoiceData.shippingAddress,
      createdBy,
      updatedBy: createdBy,
      invoiceLines: {
        create: lines,
      },
    };

    const invoice = await tx.invoice.create({
      data,
      include: {
        invoiceLines: true,
        contact: true,
      },
    });

    // Automated Accounting Sync
    await autoJournal.syncInvoiceJournal(tx, invoice as any, createdBy);

    return invoice;
  });

  return createdInvoice;
}
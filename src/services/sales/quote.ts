import { prisma } from '../prisma/prismaClient';
import { TransactionStatusType, Prisma } from '@prisma/client';

export interface SalesQuoteLineInput {
  productId?: bigint;
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

export interface SalesQuoteInput {
  contactId: bigint;
  currency: string;
  date: Date;
  expiryDate?: Date;
  notes?: string;
  terms?: string;
  billingAddress?: string;
  shippingAddress?: string;
  lines: SalesQuoteLineInput[];
}

export const salesQuoteService = {
  /**
   * Create a new sales quote.
   */
  async create(data: SalesQuoteInput, createdBy: bigint) {
    // 1. Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let total = 0;

    const lines = data.lines.map((line) => {
      const lineDiscount = line.discount || 0;
      const lineTax = line.tax || 0;
      const lineTotal = (line.unitPrice * line.quantity) - lineDiscount + lineTax;

      subtotal += line.unitPrice * line.quantity;
      totalTax += lineTax;
      totalDiscount += lineDiscount;
      total += lineTotal;

      return {
        productId: line.productId ? BigInt(line.productId) : undefined,
        productName: line.productName || '',
        description: line.description,
        classificationCode: line.classificationCode,
        msicCode: line.msicCode,
        msicDescription: line.msicDescription,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: lineDiscount,
        tax: lineTax,
        total: lineTotal,
      };
    });

    // 2. Generate Quote Number
    const lastQuote = await prisma.salesQuote.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const nextNumber = lastQuote ? (parseInt(lastQuote.number.replace('QT-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
    const quoteNumber = `QT-${nextNumber}`;

    // 3. Create Quote and Lines in a transaction
    return await prisma.$transaction(async (tx) => {
      return await tx.salesQuote.create({
        data: {
          number: quoteNumber,
          date: new Date(data.date),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          contactId: BigInt(data.contactId),
          currency: data.currency,
          subtotal,
          tax: totalTax,
          discount: totalDiscount,
          total,
          notes: data.notes,
          terms: data.terms,
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress,
          status: TransactionStatusType.DRAFT,
          createdBy,
          updatedBy: createdBy,
          quoteLines: {
            create: lines,
          },
        },
        include: {
          quoteLines: true,
          contact: true,
        },
      });
    });
  },

  /**
   * Get quote details by ID.
   */
  async getDetails(id: bigint) {
    return await prisma.salesQuote.findUnique({
      where: { id },
      include: {
        quoteLines: {
          include: {
            product: true,
          },
        },
        contact: true,
      },
    });
  },

  /**
   * List all active sales quotes.
   */
  async list() {
    return await prisma.salesQuote.findMany({
      where: { isActive: true },
      include: {
        contact: true,
      },
      orderBy: { date: 'desc' },
    });
  },

  /**
   * Convert a Quote to a Sales Order
   */
  async convertToOrder(quoteId: bigint, createdBy: bigint) {
    const quote = await this.getDetails(quoteId);
    if (!quote) throw new Error('Quote not found');
    if (quote.status === TransactionStatusType.READY) throw new Error('Quote already converted');

    return await prisma.$transaction(async (tx) => {
      // 1. Update Quote Status
      await tx.salesQuote.update({
        where: { id: quoteId },
        data: { status: TransactionStatusType.READY }
      });

      // 2. Generate Order Number
      const lastOrder = await tx.salesOrder.findFirst({
        orderBy: { id: 'desc' },
        select: { number: true },
      });
      const nextNumber = lastOrder ? (parseInt(lastOrder.number.replace('SO-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
      const orderNumber = `SO-${nextNumber}`;

      // 3. Create Sales Order
      return await tx.salesOrder.create({
        data: {
          number: orderNumber,
          date: new Date(),
          contactId: quote.contactId,
          currency: quote.currency,
          subtotal: quote.subtotal,
          tax: quote.tax,
          discount: quote.discount,
          total: quote.total,
          notes: quote.notes,
          terms: quote.terms,
          billingAddress: quote.billingAddress,
          shippingAddress: quote.shippingAddress,
          status: TransactionStatusType.DRAFT,
          quoteId: quote.id,
          createdBy,
          updatedBy: createdBy,
          orderLines: {
            create: quote.quoteLines.map((line: any) => ({
              productId: line.productId ? BigInt(line.productId) : undefined,
              productName: line.productName,
              description: line.description,
              classificationCode: line.classificationCode,
              msicCode: line.msicCode,
              msicDescription: line.msicDescription,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discount: line.discount,
              tax: line.tax,
              total: line.total,
            }))
          }
        }
      });
    });
  },

  /**
   * Convert a Quote to an Invoice
   */
  async convertToInvoice(quoteId: bigint, createdBy: bigint) {
    const quote = await this.getDetails(quoteId);
    if (!quote) throw new Error('Quote not found');

    return await prisma.$transaction(async (tx) => {
      // 1. Update Quote Status
      await tx.salesQuote.update({
        where: { id: quoteId },
        data: { status: TransactionStatusType.READY }
      });

      // 2. Generate Invoice Number
      const lastInvoice = await tx.invoice.findFirst({
        orderBy: { id: 'desc' },
        select: { number: true },
      });
      const nextNumber = lastInvoice ? (parseInt(lastInvoice.number, 10) + 1).toString().padStart(6, '0') : '000001';

      // 3. Create Invoice
      return await tx.invoice.create({
        data: {
          number: nextNumber,
          date: new Date(),
          contactId: quote.contactId,
          currency: quote.currency,
          subtotal: quote.subtotal,
          tax: quote.tax,
          discount: quote.discount,
          total: quote.total,
          notes: quote.notes,
          status: TransactionStatusType.DRAFT,
          billingAddress: quote.billingAddress,
          shippingAddress: quote.shippingAddress,
          createdBy,
          updatedBy: createdBy,
          invoiceLines: {
            create: quote.quoteLines.map((line: any) => ({
              productId: line.productId ? BigInt(line.productId) : undefined,
              productName: line.productName,
              description: line.description || '',
              classificationCode: line.classificationCode || '000',
              msicCode: line.msicCode,
              msicDescription: line.msicDescription,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discount: line.discount,
              tax: line.tax,
              total: line.total,
              createdBy,
              updatedBy: createdBy
            }))
          }
        }
      });
    });
  }
};

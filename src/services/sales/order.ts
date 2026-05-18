import { prisma } from '../prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';

export interface SalesOrderLineInput {
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

export interface SalesOrderInput {
  contactId: string | number | bigint;
  currency: string;
  date: string | Date;
  expectedDate?: string | Date;
  notes?: string;
  terms?: string;
  billingAddress?: string;
  shippingAddress?: string;
  quoteId?: string | number | bigint;
  lines: SalesOrderLineInput[];
}

export const salesOrderService = {
  /**
   * Create a new sales order.
   */
  async create(data: SalesOrderInput, createdBy: bigint) {
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
        productName: line.productName,
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

    // 2. Generate Order Number
    const lastOrder = await prisma.salesOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const nextNumber = lastOrder ? (parseInt(lastOrder.number.replace('SO-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
    const orderNumber = `SO-${nextNumber}`;

    // 3. Create Order and Lines in a transaction
    return await prisma.$transaction(async (tx) => {
      // If converting from a quote, update quote status
      if (data.quoteId) {
        await tx.salesQuote.update({
          where: { id: BigInt(data.quoteId) },
          data: { status: TransactionStatusType.READY },
        });
      }

      return await tx.salesOrder.create({
        data: {
          number: orderNumber,
          date: new Date(data.date),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
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
          quoteId: data.quoteId ? BigInt(data.quoteId) : undefined,
          createdBy,
          updatedBy: createdBy,
          orderLines: {
            create: lines,
          },
        },
        include: {
          orderLines: true,
          contact: true,
        },
      });
    });
  },

  /**
   * Get order details by ID.
   */
  async getDetails(id: bigint) {
    return await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        orderLines: {
          include: {
            product: true,
          },
        },
        contact: true,
        deliveryOrders: {
          include: {
            deliveryLines: true,
          },
        },
      },
    });
  },

  /**
   * List all active sales orders.
   */
  async list() {
    return await prisma.salesOrder.findMany({
      where: { isActive: true },
      include: {
        contact: true,
      },
      orderBy: { date: 'desc' },
    });
  },
};

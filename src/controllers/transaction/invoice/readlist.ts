import { Request, Response } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { paginatedQuery } from 'src/helpers/paginatedQuery';
import logger from 'src/utils/logger';

export default async function getInvoiceList(req: Request, res: Response) {
  try {
    const select = {
      id: true,
      number: true,
      date: true,
      total: true,
      status: true,
      dueDate: true,
      contact: {
        select: {
          legalname: true,
        }
      },
      _count: {
        select: {
          invoicePayments: true,
          invoiceCreditNote: true,
        }
      }
    };

    const invoices = await paginatedQuery(prisma.invoice, req, select);

    // Map through the results to inject the `isDeletable` flag for the frontend UI
    if (invoices.items && Array.isArray(invoices.items)) {
      invoices.items = invoices.items.map((invoice: any) => ({
        ...invoice,
        isDeletable:
          invoice.status === 'DRAFT' &&
          invoice._count?.invoicePayments === 0 &&
          invoice._count?.invoiceCreditNote === 0
      }));
    }

    return res.status(200).json({
      message: 'Invoices retrieved successfully',
      data: invoices,
    });
  } catch (err) {
    logger.error('Error fetching invoices', { error: err });
    return res.status(500).json({
      message: (err as Error).message,
    });
  }
}

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
      }
    };

    const invoices = await paginatedQuery(prisma.invoice, req, select);

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

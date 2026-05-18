import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';

export default async function getInvoiceDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing invoice ID' });

    const invoice = await prisma.invoice.findUnique({
      where: { id: BigInt(id) },
      include: {
        invoiceLines: true,
        contact: true,
      },
    });

    if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: invoice,
    });
  } catch (err: any) {
    console.error('Error fetching invoice details:', err);
    return res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}

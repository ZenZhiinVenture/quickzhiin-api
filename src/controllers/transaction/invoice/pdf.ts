import { Request, Response, NextFunction } from 'express';
import { pdfGeneratorService } from '../../../services/pdf/invoice-generator';
import logger from '../../../utils/logger';

export default async function getInvoicePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = BigInt(req.params.id);
    const pdfBuffer = await pdfGeneratorService.generateInvoicePdf(invoiceId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('Error generating PDF:', error);
    if (error.message === 'Invoice not found') {
      res.status(404).json({ message: 'Invoice not found' });
    } else {
      next(error);
    }
  }
}

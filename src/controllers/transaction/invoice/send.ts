import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../prisma/prismaClient';
import { emailService } from '../../../services/email/emailer';
import logger from '../../../utils/logger';

export default async function sendInvoiceEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = BigInt(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { contact: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.contact.email) {
      return res.status(400).json({ message: 'Customer does not have an email address' });
    }

    await emailService.sendInvoiceEmail(invoiceId, invoice.contact.email, invoice.number);

    res.status(200).json({ status: 'success', message: 'Email sent successfully' });
  } catch (error: any) {
    logger.error('Error sending email:', error);
    next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { emailService } from '../../../services/email/emailer';
import logger from '../../../utils/logger';

export default async function sendInvoiceEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = BigInt(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contact: {
          include: {
            contact_persons: {
              where: { isPrimary: true }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const primaryEmail = invoice.contact.contact_persons?.[0]?.email;

    if (!primaryEmail) {
      return res.status(400).json({ message: 'Customer does not have a primary email address' });
    }

    await emailService.sendInvoiceEmail(invoiceId, primaryEmail, invoice.number);

    return res.status(200).json({ status: 'success', message: 'Email sent successfully' });
  } catch (error: any) {
    logger.error('Error sending email:', error);
    return next(error);
  }
}

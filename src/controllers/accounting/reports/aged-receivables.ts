import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

export const getAgedReceivables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only fetch invoices that are approved or partially paid (exclude Draft, Void, Paid)
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['READY', 'PENDING'] }
      },
      include: {
        contact: {
          select: { id: true, legalname: true }
        },
        invoicePayments: true,
        invoiceCreditNote: true,
      }
    });

    const now = new Date();
    
    // Grouping structure: Record<contactId, { contactName, buckets: { current, 1_30, 31_60, 61_90, 90_plus, total } }>
    const reportData: Record<string, any> = {};
    let grandTotal = 0;

    for (const invoice of invoices) {
      // Calculate amount paid/credited
      const totalPaid = invoice.invoicePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const totalCredited = invoice.invoiceCreditNote ? Number(invoice.invoiceCreditNote.amount) : 0;
      
      const outstandingBalance = Number(invoice.total) - totalPaid - totalCredited;
      if (outstandingBalance <= 0) continue; // Skip fully paid just in case

      const contactIdStr = invoice.contactId.toString();
      if (!reportData[contactIdStr]) {
        reportData[contactIdStr] = {
          contactId: contactIdStr,
          contactName: invoice.contact.legalname,
          current: 0,
          days_1_30: 0,
          days_31_60: 0,
          days_61_90: 0,
          days_90_plus: 0,
          total: 0
        };
      }

      // Determine age bucket based on dueDate (or fallback to issue date)
      const targetDate = invoice.dueDate || invoice.date;
      const diffTime = now.getTime() - targetDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        reportData[contactIdStr].current += outstandingBalance;
      } else if (diffDays <= 30) {
        reportData[contactIdStr].days_1_30 += outstandingBalance;
      } else if (diffDays <= 60) {
        reportData[contactIdStr].days_31_60 += outstandingBalance;
      } else if (diffDays <= 90) {
        reportData[contactIdStr].days_61_90 += outstandingBalance;
      } else {
        reportData[contactIdStr].days_90_plus += outstandingBalance;
      }

      reportData[contactIdStr].total += outstandingBalance;
      grandTotal += outstandingBalance;
    }

    const dataArray = Object.values(reportData);

    return res.status(200).json({
      status: 'success',
      data: {
        items: dataArray,
        grandTotal
      }
    });
  } catch (error: any) {
    logger.error('Error generating Aged Receivables report:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate report' });
  }
};

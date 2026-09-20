import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

export const getSST02Report = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current year if no dates provided
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const dateFilter = {
      gte: start,
      lte: end
    };

    // 1. Fetch Sales (Output Tax)
    const invoices = await prisma.invoice.findMany({
      where: {
        date: dateFilter,
        status: { in: ['READY', 'PAID'] }
      }
    });

    // Calculate total taxable sales and total output tax
    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);
    const totalOutputTax = invoices.reduce((sum, inv) => sum + Number(inv.tax || 0), 0);
    const totalSalesIncludingTax = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    // 2. Fetch Purchases (Input Tax)
    const bills = await prisma.bill.findMany({
      where: {
        date: dateFilter,
        status: { in: ['READY', 'PAID'] }
      }
    });

    const totalPurchases = bills.reduce((sum, bill) => sum + Number(bill.subtotal || 0), 0);
    const totalInputTax = bills.reduce((sum, bill) => sum + Number(bill.tax || 0), 0);
    const totalPurchasesIncludingTax = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

    // Net Tax Payable
    const netTaxPayable = totalOutputTax - totalInputTax;

    return res.status(200).json({
      status: 'success',
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        sales: {
          taxableAmount: totalSales,
          taxAmount: totalOutputTax,
          totalAmount: totalSalesIncludingTax
        },
        purchases: {
          taxableAmount: totalPurchases,
          taxAmount: totalInputTax,
          totalAmount: totalPurchasesIncludingTax
        },
        summary: {
          netTaxPayable
        }
      }
    });
  } catch (error: any) {
    logger.error('Error generating SST-02 report:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate SST-02 report' });
  }
};

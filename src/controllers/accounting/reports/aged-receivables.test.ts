import { getAgedReceivables } from './aged-receivables';
import { prisma } from '../../../services/prisma/prismaClient';
import { Request, Response } from 'express';

// Mock the prisma client
jest.mock('../../../services/prisma/prismaClient', () => ({
  prisma: {
    invoice: {
      findMany: jest.fn()
    }
  }
}));

describe('Aged Receivables Report', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate aged receivables correctly into buckets', async () => {
    const now = new Date();
    
    // Create an invoice due 10 days ago (1-30 days bucket)
    const invoice10DaysLate = {
      id: BigInt(1),
      contactId: BigInt(100),
      total: 1000,
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      contact: { id: BigInt(100), legalname: 'Tech Corp' },
      invoicePayments: [{ amount: 200 }], // 800 outstanding
      invoiceCreditNote: null
    };

    // Create an invoice due 45 days ago (31-60 days bucket)
    const invoice45DaysLate = {
      id: BigInt(2),
      contactId: BigInt(101),
      total: 5000,
      dueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      contact: { id: BigInt(101), legalname: 'Global Supply' },
      invoicePayments: [], 
      invoiceCreditNote: { amount: 500 } // 4500 outstanding
    };

    // Create an invoice due tomorrow (Current bucket)
    const invoiceCurrent = {
      id: BigInt(3),
      contactId: BigInt(100), // Same contact as first invoice
      total: 2000,
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      contact: { id: BigInt(100), legalname: 'Tech Corp' },
      invoicePayments: [],
      invoiceCreditNote: null // 2000 outstanding
    };

    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      invoice10DaysLate,
      invoice45DaysLate,
      invoiceCurrent
    ]);

    await getAgedReceivables(
      mockRequest as Request, 
      mockResponse as Response, 
      jest.fn()
    );

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['READY', 'PENDING'] } },
      include: {
        contact: { select: { id: true, legalname: true } },
        invoicePayments: true,
        invoiceCreditNote: true,
      }
    });

    // Check response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            contactId: '100',
            contactName: 'Tech Corp',
            current: 2000,
            days_1_30: 800,
            days_31_60: 0,
            days_61_90: 0,
            days_90_plus: 0,
            total: 2800
          }),
          expect.objectContaining({
            contactId: '101',
            contactName: 'Global Supply',
            current: 0,
            days_1_30: 0,
            days_31_60: 4500,
            days_61_90: 0,
            days_90_plus: 0,
            total: 4500
          })
        ]),
        grandTotal: 7300 // 2800 + 4500
      }
    });
  });
});

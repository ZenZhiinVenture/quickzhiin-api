import { getAgedPayables } from './aged-payables';
import { prisma } from '../../../services/prisma/prismaClient';
import { Request, Response } from 'express';

jest.mock('../../../services/prisma/prismaClient', () => ({
  prisma: {
    bill: {
      findMany: jest.fn()
    }
  }
}));

describe('Aged Payables Report', () => {
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

  it('should calculate aged payables correctly into buckets', async () => {
    const now = new Date();
    
    // Create a bill due 10 days ago (1-30 days bucket)
    const bill10DaysLate = {
      id: BigInt(1),
      contactId: BigInt(100),
      total: 1000,
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      contact: { id: BigInt(100), legalname: 'Tech Corp' },
      payments: [{ amount: 200 }], // 800 outstanding
      billCreditNote: null
    };

    (prisma.bill.findMany as jest.Mock).mockResolvedValue([
      bill10DaysLate
    ]);

    await getAgedPayables(
      mockRequest as Request, 
      mockResponse as Response, 
      jest.fn()
    );

    expect(prisma.bill.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['READY', 'PENDING'] } },
      include: {
        contact: { select: { id: true, legalname: true } },
        payments: true,
        billCreditNote: true,
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
            current: 0,
            days_1_30: 800,
            total: 800
          })
        ]),
        grandTotal: 800
      }
    });
  });
});

import createBillTransaction from './create';
import { prisma } from '../../../services/prisma/prismaClient';
import { autoJournal } from '../../../services/account/autoJournal';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../../services/prisma/prismaClient', () => ({
  prisma: {
    $transaction: jest.fn(),
    bill: {
      findFirst: jest.fn(),
      create: jest.fn(),
    }
  }
}));

jest.mock('../../../services/account/autoJournal', () => ({
  autoJournal: {
    syncBillJournal: jest.fn(),
  }
}));

describe('Bill Create Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: { id: 1 },
      body: {}
    } as any;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and correctly call prisma.$transaction on success', async () => {
    mockRequest.body = {
      customerId: 1, // This is contactId in the schema
      currency: 'MYR',
      date: new Date().toISOString(),
      lines: [
        {
          productName: 'Test Bill Product',
          classificationCode: 'EXP-001',
          quantity: 1,
          unitPrice: 100
        }
      ]
    };

    (prisma.bill.findFirst as jest.Mock).mockResolvedValue({ number: 'BIL-000001' });
    
    // In upsertBill, it calls prisma.bill.create and passes prisma to autoJournal
    const mockBill = { id: 1, number: 'BIL-000002' };
    (prisma.bill.create as jest.Mock).mockResolvedValue(mockBill);
    
    // Mock the transaction call to just execute the callback
    const mockTx = {};
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    await createBillTransaction(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.bill.create).toHaveBeenCalled();
    expect(autoJournal.syncBillJournal).toHaveBeenCalledWith(prisma, mockBill, 1);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      message: 'Bill created and posted to ledger successfully',
      data: expect.any(Object)
    }));
  });

  it('should handle validation (empty lines) and return 500', async () => {
    mockRequest.body = {
      customerId: 1,
      currency: 'MYR',
      date: new Date().toISOString(),
      lines: [] // Empty lines array
    };

    await createBillTransaction(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Missing required bill fields'
    }));
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

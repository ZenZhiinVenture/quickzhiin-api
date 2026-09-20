import createInvoice from './create';
import { prisma } from '../../../services/prisma/prismaClient';
import { autoJournal } from '../../../services/account/autoJournal';
import { Request, Response, NextFunction } from 'express';
import logger from '../../../utils/logger';

jest.mock('../../../services/prisma/prismaClient', () => ({
  prisma: {
    $transaction: jest.fn(),
    invoice: {
      findFirst: jest.fn(),
    }
  }
}));

jest.mock('../../../services/account/autoJournal', () => ({
  autoJournal: {
    syncInvoiceJournal: jest.fn(),
  }
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
  }
}));

describe('Invoice Create Controller', () => {
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
      contactId: '1',
      currency: 'MYR',
      date: new Date().toISOString(),
      lines: [
        {
          productName: 'Test Product',
          quantity: 1,
          unitPrice: 100
        }
      ]
    };

    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({ number: '000001' });
    
    // Mock the transaction call
    const mockTx = {
      invoice: {
        create: jest.fn().mockResolvedValue({ id: 1, number: '000002' })
      }
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    await createInvoice(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockTx.invoice.create).toHaveBeenCalled();
    expect(autoJournal.syncInvoiceJournal).toHaveBeenCalledWith(mockTx, { id: 1, number: '000002' }, BigInt(1));
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      message: 'Invoice created successfully',
      data: expect.any(Object)
    }));
  });

  it('should handle validation (empty lines) and return 500', async () => {
    mockRequest.body = {
      contactId: '1',
      currency: 'MYR',
      date: new Date().toISOString(),
      lines: [] // Empty lines array
    };

    await createInvoice(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(logger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Missing required invoice fields'
    }));
    // Note: The controller returns after res.status(500).json(), so next(err) is unreachable.
  });
});

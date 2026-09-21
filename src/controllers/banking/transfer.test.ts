import { list, getById, create } from './transfer';
import { prisma } from '../../services/prisma/prismaClient';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    bankTransaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Banking Transfer Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
    };
    (mockRequest as any).user = { id: 1 };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all active bank transfers', async () => {
      const mockTransfers = [
        { id: BigInt(1), amount: 1000, reference: 'TRF-001' },
      ];
      (prisma.bankTransaction.findMany as jest.Mock).mockResolvedValue(mockTransfers);

      await list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { items: mockTransfers },
      });
    });
  });

  describe('getById', () => {
    it('should return 404 if transfer does not exist', async () => {
      mockRequest.params = { id: '999' };
      (prisma.bankTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      await getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Transfer not found' });
    });
  });

  describe('create', () => {
    it('should create withdrawal and deposit in a transaction', async () => {
      mockRequest.body = {
        fromBankAccountId: 1,
        toBankAccountId: 2,
        amount: 500,
        date: '2025-03-01',
        description: 'Internal transfer',
      };

      const mockWithdrawal = { id: BigInt(10), amount: 500 };
      const mockDeposit = { id: BigInt(11), amount: 500 };
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockWithdrawal, mockDeposit]);

      await create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { withdrawal: mockWithdrawal, deposit: mockDeposit },
      });
    });
  });
});

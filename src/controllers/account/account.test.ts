import listAccounts from './list';
import createAccount from './create';
import { prisma } from '../../services/prisma/prismaClient';
import upsertAccount from '../../services/account/upsert';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../services/account/upsert', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Chart of Accounts Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAccounts', () => {
    it('should return all active accounts ordered by code', async () => {
      const mockAccounts = [
        { id: BigInt(1), code: '1000', name: 'Cash', type: 'ASSET' },
        { id: BigInt(2), code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
      ];
      (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      await listAccounts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Accounts retrieved successfully',
        accounts: mockAccounts,
      });
    });
  });

  describe('createAccount', () => {
    it('should call upsertAccount and return 200 with created account', async () => {
      mockRequest.body = { code: '1010', name: 'Petty Cash', type: 'ASSET' };
      (mockRequest as any).user = { id: 99 };

      const mockAccountResult = { id: 5, code: '1010', name: 'Petty Cash', type: 'ASSET' };
      (upsertAccount as jest.Mock).mockResolvedValue(mockAccountResult);

      await createAccount(mockRequest as Request, mockResponse as Response, mockNext);

      expect(upsertAccount).toHaveBeenCalledWith(
        { code: '1010', name: 'Petty Cash', type: 'ASSET' },
        99,
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Account Created Successfully',
        account: mockAccountResult,
      });
    });
  });
});

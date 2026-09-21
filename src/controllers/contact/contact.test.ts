import deleteContact from './delete';
import getContactList from './list';
import { prisma } from '../../services/prisma/prismaClient';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    contact: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../helpers/paginatedQuery', () => ({
  paginatedQuery: jest.fn().mockResolvedValue({
    records: [
      { id: 1, legalname: 'Acme Corp', isCustomer: true, isSupplier: false },
    ],
    totalRecords: 1,
    page: 1,
    pageSize: 10,
  }),
}));

describe('Contact CRUD Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
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

  describe('deleteContact', () => {
    it('should delete contact and return 200 message', async () => {
      mockRequest.params = { id: '42' };
      (prisma.contact.delete as jest.Mock).mockResolvedValue({ id: 42 });

      await deleteContact(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Delete Contact Successfully.',
      });
    });

    it('should return 500 when database error occurs', async () => {
      mockRequest.params = { id: '999' };
      (prisma.contact.delete as jest.Mock).mockRejectedValue(new Error('Record not found'));

      await deleteContact(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Record not found',
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getContactList', () => {
    it('should return paginated contacts list', async () => {
      await getContactList(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Contacts retrieved successfully',
        data: expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({ legalname: 'Acme Corp' }),
          ]),
        }),
      });
    });
  });
});

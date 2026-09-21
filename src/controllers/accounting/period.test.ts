import { listPeriods, createPeriod, closePeriod, reopenPeriod, deletePeriod } from './period';
import { guardClosedPeriod } from '../../middlewares/closedPeriod';
import { prisma } from '../../services/prisma/prismaClient';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    accountingPeriod: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Accounting Period Controller & Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listPeriods', () => {
    it('should return all accounting periods ordered by startDate desc', async () => {
      const mockPeriods = [
        { id: BigInt(1), name: 'Jan 2025', status: 'CLOSED', startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31') },
        { id: BigInt(2), name: 'Feb 2025', status: 'OPEN', startDate: new Date('2025-02-01'), endDate: new Date('2025-02-28') },
      ];
      (prisma.accountingPeriod.findMany as jest.Mock).mockResolvedValue(mockPeriods);

      await listPeriods(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockPeriods,
      });
    });
  });

  describe('createPeriod', () => {
    it('should reject when name or dates are missing', async () => {
      mockRequest.body = { name: 'Q1' };

      await createPeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject when endDate is before startDate', async () => {
      mockRequest.body = {
        name: 'Invalid Period',
        startDate: '2025-02-01',
        endDate: '2025-01-01',
      };

      await createPeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject when period overlaps with existing open period', async () => {
      mockRequest.body = {
        name: 'Jan 2025 Duplicate',
        startDate: '2025-01-15',
        endDate: '2025-02-15',
      };
      (prisma.accountingPeriod.findFirst as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        name: 'Jan 2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      await createPeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });

    it('should create new period when valid', async () => {
      mockRequest.body = {
        name: 'March 2025',
        startDate: '2025-03-01',
        endDate: '2025-03-31',
        notes: 'Monthly close',
      };
      (prisma.accountingPeriod.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.accountingPeriod.create as jest.Mock).mockResolvedValue({
        id: BigInt(3),
        name: 'March 2025',
        status: 'OPEN',
      });

      await createPeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' })
      );
    });
  });

  describe('closePeriod & reopenPeriod', () => {
    it('should close an open period', async () => {
      mockRequest.params = { id: '1' };
      (mockRequest as any).user = { email: 'admin@quickzhiin.com' };
      (prisma.accountingPeriod.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        status: 'OPEN',
      });
      (prisma.accountingPeriod.update as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        status: 'CLOSED',
        closedBy: 'admin@quickzhiin.com',
      });

      await closePeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.accountingPeriod.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(1) },
          data: expect.objectContaining({ status: 'CLOSED' }),
        })
      );
    });

    it('should return 409 if period already closed', async () => {
      mockRequest.params = { id: '1' };
      (prisma.accountingPeriod.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        status: 'CLOSED',
      });

      await closePeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });

    it('should reopen a closed period', async () => {
      mockRequest.params = { id: '1' };
      (prisma.accountingPeriod.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        status: 'CLOSED',
      });
      (prisma.accountingPeriod.update as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        status: 'OPEN',
      });

      await reopenPeriod(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.accountingPeriod.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'OPEN', closedAt: null }),
        })
      );
    });
  });

  describe('guardClosedPeriod middleware', () => {
    it('should bypass GET requests without checking periods', async () => {
      mockRequest.method = 'GET';

      await guardClosedPeriod(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(prisma.accountingPeriod.findFirst).not.toHaveBeenCalled();
    });

    it('should block POST requests when transaction date falls in a closed period', async () => {
      mockRequest.method = 'POST';
      mockRequest.body = { date: '2025-01-15', narration: 'Test Entry' };
      (prisma.accountingPeriod.findFirst as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        name: 'January 2025',
        status: 'CLOSED',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      await guardClosedPeriod(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'PERIOD_CLOSED' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow POST requests when transaction date does not fall in a closed period', async () => {
      mockRequest.method = 'POST';
      mockRequest.body = { date: '2025-02-15', narration: 'Active Entry' };
      (prisma.accountingPeriod.findFirst as jest.Mock).mockResolvedValue(null);

      await guardClosedPeriod(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});

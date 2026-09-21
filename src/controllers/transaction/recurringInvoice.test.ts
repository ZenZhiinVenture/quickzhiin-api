import {
  listRecurringInvoices,
  getRecurringInvoice,
  createRecurringInvoice,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  deleteRecurringInvoice,
  processRecurringBatch,
} from './recurringInvoice';
import { calculateNextRunDate, processRecurringInvoices } from '../../services/recurring/process';
import { prisma } from '../../services/prisma/prismaClient';
import * as invoiceUpsertModule from '../../services/invoice/upsert';
import { Request, Response } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    recurringInvoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Recurring Invoices & Retainers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNextRunDate', () => {
    it('should correctly increment DAILY frequency by 1 day', () => {
      const base = new Date('2026-03-01T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'DAILY');
      expect(next.toISOString().split('T')[0]).toBe('2026-03-02');
    });

    it('should correctly increment WEEKLY frequency by 7 days', () => {
      const base = new Date('2026-03-01T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'WEEKLY');
      expect(next.toISOString().split('T')[0]).toBe('2026-03-08');
    });

    it('should correctly increment MONTHLY frequency by 1 month', () => {
      const base = new Date('2026-03-15T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'MONTHLY');
      expect(next.toISOString().split('T')[0]).toBe('2026-04-15');
    });

    it('should clamp MONTHLY to month-end if day overflows (e.g. Jan 31 -> Feb 28)', () => {
      const base = new Date('2026-01-31T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'MONTHLY');
      expect(next.toISOString().split('T')[0]).toBe('2026-02-28');
    });

    it('should correctly increment QUARTERLY frequency by 3 months', () => {
      const base = new Date('2026-01-10T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'QUARTERLY');
      expect(next.toISOString().split('T')[0]).toBe('2026-04-10');
    });

    it('should correctly increment BIANNUALLY frequency by 6 months', () => {
      const base = new Date('2026-01-10T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'BIANNUALLY');
      expect(next.toISOString().split('T')[0]).toBe('2026-07-10');
    });

    it('should correctly increment ANNUALLY frequency by 1 year', () => {
      const base = new Date('2026-05-20T00:00:00.000Z');
      const next = calculateNextRunDate(base, 'ANNUALLY');
      expect(next.toISOString().split('T')[0]).toBe('2027-05-20');
    });
  });

  describe('listRecurringInvoices', () => {
    it('should return list of recurring profiles', async () => {
      const mockData = [
        {
          id: BigInt(1),
          profileName: 'Monthly Retainer - Acme Corp',
          contact: { id: BigInt(10), legalname: 'Acme Corp', taxNo: 'C123456789' },
          frequency: 'MONTHLY',
          status: 'ACTIVE',
        },
      ];
      (prisma.recurringInvoice.findMany as jest.Mock).mockResolvedValue(mockData);

      await listRecurringInvoices(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockData,
      });
    });

    it('should apply status filter when specified', async () => {
      mockRequest.query = { status: 'PAUSED' };
      (prisma.recurringInvoice.findMany as jest.Mock).mockResolvedValue([]);

      await listRecurringInvoices(mockRequest as Request, mockResponse as Response);

      expect(prisma.recurringInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PAUSED' }),
        })
      );
    });
  });

  describe('createRecurringInvoice', () => {
    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = { profileName: 'Incomplete' };

      await createRecurringInvoice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should create profile successfully with initial nextRunDate equal to startDate', async () => {
      const profileInput = {
        profileName: 'Website SEO Retainer',
        contactId: 5,
        frequency: 'MONTHLY',
        startDate: '2026-04-01T00:00:00.000Z',
        currency: 'USD',
        exchangeRate: 4.45,
        lineItems: [
          { productName: 'Monthly SEO Retainer', quantity: 1, unitPrice: 1500 },
        ],
      };
      mockRequest.body = profileInput;

      const created = { id: BigInt(1), ...profileInput, status: 'ACTIVE' };
      (prisma.recurringInvoice.create as jest.Mock).mockResolvedValue(created);

      await createRecurringInvoice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(prisma.recurringInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            profileName: 'Website SEO Retainer',
            contactId: BigInt(5),
            frequency: 'MONTHLY',
            currency: 'USD',
            exchangeRate: 4.45,
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('pause and resume', () => {
    it('should pause recurring profile', async () => {
      mockRequest.params = { id: '1' };
      (prisma.recurringInvoice.update as jest.Mock).mockResolvedValue({ id: BigInt(1), status: 'PAUSED' });

      await pauseRecurringInvoice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.recurringInvoice.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'PAUSED' },
      });
    });

    it('should resume recurring profile', async () => {
      mockRequest.params = { id: '1' };
      (prisma.recurringInvoice.update as jest.Mock).mockResolvedValue({ id: BigInt(1), status: 'ACTIVE' });

      await resumeRecurringInvoice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.recurringInvoice.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'ACTIVE' },
      });
    });
  });

  describe('processRecurringInvoices', () => {
    it('should generate invoices for due profiles and advance nextRunDate', async () => {
      const mockProfile = {
        id: BigInt(1),
        profileName: 'Cloud Server Maintenance',
        contactId: BigInt(20),
        frequency: 'MONTHLY' as const,
        nextRunDate: new Date('2026-03-01T00:00:00.000Z'),
        currency: 'MYR',
        exchangeRate: 1.0,
        invoicesGenerated: 0,
        maxOccurrences: 12,
        lineItems: [{ productName: 'Maintenance', quantity: 1, unitPrice: 500 }],
        createdBy: BigInt(1),
      };

      const mockClient = {
        recurringInvoice: {
          findMany: jest.fn().mockResolvedValue([mockProfile]),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      const upsertSpy = jest.spyOn(invoiceUpsertModule, 'upsertInvoice').mockResolvedValue({
        id: BigInt(101),
        number: 'INV-000101',
      } as any);

      const result = await processRecurringInvoices(mockClient as any, new Date('2026-03-01T12:00:00.000Z'));

      expect(result.processedCount).toBe(1);
      expect(result.invoicesGenerated.length).toBe(1);
      expect(result.invoicesGenerated[0].invoiceNumber).toBe('INV-000101');
      expect(upsertSpy).toHaveBeenCalled();
      expect(mockClient.recurringInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(1) },
          data: expect.objectContaining({
            invoicesGenerated: 1,
            status: 'ACTIVE',
          }),
        })
      );

      upsertSpy.mockRestore();
    });

    it('should mark profile as COMPLETED when maxOccurrences is reached', async () => {
      const mockProfile = {
        id: BigInt(2),
        profileName: 'Short 3-Month Retainer',
        contactId: BigInt(20),
        frequency: 'MONTHLY' as const,
        nextRunDate: new Date('2026-03-01T00:00:00.000Z'),
        currency: 'MYR',
        exchangeRate: 1.0,
        invoicesGenerated: 2, // will reach 3
        maxOccurrences: 3,
        lineItems: [{ productName: 'Retainer', quantity: 1, unitPrice: 300 }],
      };

      const mockClient = {
        recurringInvoice: {
          findMany: jest.fn().mockResolvedValue([mockProfile]),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      const upsertSpy = jest.spyOn(invoiceUpsertModule, 'upsertInvoice').mockResolvedValue({
        id: BigInt(102),
        number: 'INV-000102',
      } as any);

      const result = await processRecurringInvoices(mockClient as any, new Date('2026-03-01T12:00:00.000Z'));

      expect(result.completedCount).toBe(1);
      expect(mockClient.recurringInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(2) },
          data: expect.objectContaining({
            invoicesGenerated: 3,
            status: 'COMPLETED',
          }),
        })
      );

      upsertSpy.mockRestore();
    });
  });
});

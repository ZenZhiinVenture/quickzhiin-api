import { importJournalEntries } from './import';
import { prisma } from '../../../services/prisma/prismaClient';
import { Request, Response } from 'express';

jest.mock('../../../services/prisma/prismaClient', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe('Journal Entry CSV Import Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if no file is uploaded', async () => {
    mockRequest.file = undefined;

    await importJournalEntries(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No file uploaded' })
    );
  });

  it('should reject entry if debits do not equal credits within the same reference', async () => {
    const csvContent = `reference,date,accountId,description,debit,credit
JE-001,2025-01-01,1,Unbalanced line 1,100,0
JE-001,2025-01-01,2,Unbalanced line 2,0,80`;

    mockRequest.file = {
      buffer: Buffer.from(csvContent),
    } as Express.Multer.File;

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        journalEntry: { create: jest.fn() },
      };
      return callback(mockTx);
    });

    await importJournalEntries(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        message: 'Import complete. Imported 0 journal entries.',
        errors: expect.arrayContaining([
          expect.stringContaining('Debit (100) and Credit (80) do not match'),
        ]),
      })
    );
  });

  it('should group rows by reference and import balanced multi-line entries', async () => {
    const csvContent = `reference,date,accountId,description,debit,credit
JE-001,2025-01-01,1,Line 1,500,0
JE-001,2025-01-01,2,Line 2,0,500`;

    mockRequest.file = {
      buffer: Buffer.from(csvContent),
    } as Express.Multer.File;

    const mockCreate = jest.fn().mockResolvedValue({ id: BigInt(100) });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        journalEntry: { create: mockCreate },
      };
      return callback(mockTx);
    });

    await importJournalEntries(mockRequest as Request, mockResponse as Response);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        referenceNumber: 'JE-001',
        date: expect.any(Date),
        description: 'Line 1',
        lines: {
          create: [
            { accountId: BigInt(1), description: 'Line 1', debit: 500, credit: 0 },
            { accountId: BigInt(2), description: 'Line 2', debit: 0, credit: 500 },
          ],
        },
      },
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        message: 'Import complete. Imported 1 journal entries.',
      })
    );
  });
});

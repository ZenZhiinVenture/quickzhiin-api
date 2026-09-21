import { importContacts } from './import';
import { prisma } from '../../services/prisma/prismaClient';
import { Request, Response } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe('Contact CSV Import Controller', () => {
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

  it('should return 400 if no file uploaded', async () => {
    mockRequest.file = undefined;

    await importContacts(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No file uploaded' })
    );
  });

  it('should validate required legalName and import valid contacts', async () => {
    const csvContent = `legalName,email,phone,isCustomer,isSupplier
Acme Corp,acme@example.com,0123456789,true,false
,missing@example.com,0111111111,false,true`;

    mockRequest.file = {
      buffer: Buffer.from(csvContent),
    } as Express.Multer.File;

    const mockCreate = jest.fn().mockResolvedValue({ id: BigInt(1) });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        contact: { create: mockCreate },
      };
      return callback(mockTx);
    });

    await importContacts(mockRequest as Request, mockResponse as Response);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        legalName: 'Acme Corp',
        email: 'acme@example.com',
        phone: '0123456789',
        isCustomer: true,
        isSupplier: false,
      },
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        message: 'Import complete. Imported 1 contacts.',
        errors: expect.arrayContaining([expect.stringContaining('legalName is required')]),
      })
    );
  });
});

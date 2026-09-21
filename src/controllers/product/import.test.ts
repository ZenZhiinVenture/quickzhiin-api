import { importProducts } from './import';
import { prisma } from '../../services/prisma/prismaClient';
import { Request, Response } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe('Product CSV Import Controller', () => {
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

    await importProducts(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No file uploaded' })
    );
  });

  it('should validate name and sku and import valid products', async () => {
    const csvContent = `name,sku,salePrice,purchasePrice,isInventory
Widget A,SKU-001,150.00,100.00,true
,SKU-002,50.00,30.00,false`;

    mockRequest.file = {
      buffer: Buffer.from(csvContent),
    } as Express.Multer.File;

    const mockCreate = jest.fn().mockResolvedValue({ id: BigInt(10) });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        product: { create: mockCreate },
      };
      return callback(mockTx);
    });

    await importProducts(mockRequest as Request, mockResponse as Response);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: 'Widget A',
        sku: 'SKU-001',
        salePrice: 150,
        purchasePrice: 100,
        isInventory: true,
        isActive: true,
      },
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        message: 'Import complete. Imported 1 products.',
        errors: expect.arrayContaining([expect.stringContaining('name and sku are required')]),
      })
    );
  });
});

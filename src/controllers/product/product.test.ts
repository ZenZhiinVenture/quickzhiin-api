import getProductList from './list';
import createProduct from './create';
import { prisma } from '../../services/prisma/prismaClient';
import upsertProduct from '../../services/product/upsert';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    product: {},
  },
}));

jest.mock('../../helpers/paginatedQuery', () => ({
  paginatedQuery: jest.fn().mockResolvedValue({
    records: [
      { id: 1, name: 'Sample Product', sku: 'SKU-100', salePrice: 99.99 },
    ],
    totalRecords: 1,
    page: 1,
    pageSize: 10,
  }),
}));

jest.mock('../../services/product/upsert', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Product Controller (List & Create)', () => {
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

  describe('getProductList', () => {
    it('should return paginated products successfully', async () => {
      await getProductList(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Read Success',
        products: expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU-100' }),
          ]),
        }),
      });
    });
  });

  describe('createProduct', () => {
    it('should call upsertProduct and return 200 on success', async () => {
      mockRequest.body = {
        product: { name: 'New Widget', sku: 'WID-01', salePrice: 200 },
      };
      (mockRequest as any).user = { id: 123 };

      const mockResult = { id: 10, name: 'New Widget', sku: 'WID-01' };
      (upsertProduct as jest.Mock).mockResolvedValue(mockResult);

      await createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(upsertProduct).toHaveBeenCalledWith(
        { name: 'New Widget', sku: 'WID-01', salePrice: 200 },
        123,
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Succefully',
        product: mockResult,
      });
    });
  });
});

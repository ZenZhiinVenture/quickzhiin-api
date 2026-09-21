import { createSalesOrder, getSalesOrderList, getSalesOrderDetails } from './order';
import { createSalesQuote, getSalesQuoteList, getSalesQuoteDetails } from './quote';
import { salesOrderService } from '../../services/sales/order';
import { salesQuoteService } from '../../services/sales/quote';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/sales/order', () => ({
  salesOrderService: {
    create: jest.fn(),
    list: jest.fn(),
    getDetails: jest.fn(),
  },
}));

jest.mock('../../services/sales/quote', () => ({
  salesQuoteService: {
    create: jest.fn(),
    list: jest.fn(),
    getDetails: jest.fn(),
  },
}));

describe('Sales Controllers (Orders & Quotes)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
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

  describe('Sales Orders', () => {
    it('should create sales order and return 201', async () => {
      mockRequest.body = { contactId: 10, total: 1200 };
      const mockCreatedOrder = { id: BigInt(1), number: 'SO-001', total: 1200 };
      (salesOrderService.create as jest.Mock).mockResolvedValue(mockCreatedOrder);

      await createSalesOrder(mockRequest as Request, mockResponse as Response, mockNext);

      expect(salesOrderService.create).toHaveBeenCalledWith(
        { contactId: 10, total: 1200 },
        BigInt(1)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCreatedOrder,
      });
    });

    it('should return 404 when sales order details not found', async () => {
      mockRequest.params = { id: '999' };
      (salesOrderService.getDetails as jest.Mock).mockResolvedValue(null);

      await getSalesOrderDetails(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Order not found' });
    });
  });

  describe('Sales Quotes', () => {
    it('should create sales quote and return 201', async () => {
      mockRequest.body = { contactId: 20, total: 2500 };
      const mockCreatedQuote = { id: BigInt(2), number: 'SQ-001', total: 2500 };
      (salesQuoteService.create as jest.Mock).mockResolvedValue(mockCreatedQuote);

      await createSalesQuote(mockRequest as Request, mockResponse as Response, mockNext);

      expect(salesQuoteService.create).toHaveBeenCalledWith(
        { contactId: 20, total: 2500 },
        BigInt(1)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCreatedQuote,
      });
    });

    it('should list sales quotes and return 200', async () => {
      const mockQuotes = [{ id: BigInt(2), number: 'SQ-001' }];
      (salesQuoteService.list as jest.Mock).mockResolvedValue(mockQuotes);

      await getSalesQuoteList(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { items: mockQuotes },
      });
    });
  });
});

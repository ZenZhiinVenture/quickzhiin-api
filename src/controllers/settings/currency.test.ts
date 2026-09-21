import {
  getCurrencySettings,
  setBaseCurrency,
  listExchangeRates,
  createExchangeRate,
  deleteExchangeRate,
  SUPPORTED_CURRENCIES,
} from './currency';
import { prisma } from '../../services/prisma/prismaClient';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/prisma/prismaClient', () => ({
  prisma: {
    setting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    exchangeRate: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Currency & Exchange Rate Controller', () => {
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

  describe('getCurrencySettings', () => {
    it('should return default base currency and supported currencies', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.exchangeRate.findMany as jest.Mock).mockResolvedValue([
        { id: BigInt(1), fromCurrency: 'USD', toCurrency: 'MYR', rate: 4.45 },
      ]);

      await getCurrencySettings(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          baseCurrency: 'MYR',
          supportedCurrencies: SUPPORTED_CURRENCIES,
          rates: expect.arrayContaining([
            expect.objectContaining({ fromCurrency: 'USD', toCurrency: 'MYR' }),
          ]),
        }),
      });
    });
  });

  describe('setBaseCurrency', () => {
    it('should reject unsupported currency codes', async () => {
      mockRequest.body = { currency: 'XYZ' };

      await setBaseCurrency(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Unsupported currency') })
      );
    });

    it('should update base currency setting when valid', async () => {
      mockRequest.body = { currency: 'USD' };
      (prisma.setting.upsert as jest.Mock).mockResolvedValue({
        key: 'base_currency',
        value: 'USD',
      });

      await setBaseCurrency(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'base_currency' },
          update: { value: 'USD' },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: { baseCurrency: 'USD' },
        })
      );
    });
  });

  describe('createExchangeRate', () => {
    it('should reject non-positive exchange rates', async () => {
      mockRequest.body = {
        fromCurrency: 'USD',
        toCurrency: 'MYR',
        rate: -1.5,
      };

      await createExchangeRate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Rate must be a positive number' })
      );
    });

    it('should record user-entered exchange rate', async () => {
      mockRequest.body = {
        fromCurrency: 'USD',
        toCurrency: 'MYR',
        rate: 4.4525,
        source: 'Wise',
        notes: 'Invoice payment rate',
      };

      const mockCreatedRate = {
        id: BigInt(10),
        fromCurrency: 'USD',
        toCurrency: 'MYR',
        rate: 4.4525,
      };
      (prisma.exchangeRate.create as jest.Mock).mockResolvedValue(mockCreatedRate);

      await createExchangeRate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.exchangeRate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromCurrency: 'USD',
          toCurrency: 'MYR',
          rate: 4.4525,
          source: 'Wise',
          notes: 'Invoice payment rate',
        }),
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCreatedRate,
      });
    });
  });

  describe('deleteExchangeRate', () => {
    it('should delete rate by ID and return 200', async () => {
      mockRequest.params = { id: '10' };
      (prisma.exchangeRate.delete as jest.Mock).mockResolvedValue({ id: BigInt(10) });

      await deleteExchangeRate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.exchangeRate.delete).toHaveBeenCalledWith({
        where: { id: BigInt(10) },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Exchange rate deleted',
      });
    });
  });
});

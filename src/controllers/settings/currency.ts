import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import logger from '../../utils/logger';

// Standard ISO currencies list
export const SUPPORTED_CURRENCIES = [
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
];

const DEFAULT_BASE_CURRENCY = 'MYR';

/**
 * GET /api/settings/currency
 * Returns base currency, supported currencies, and the latest exchange rates.
 */
export const getCurrencySettings = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // 1. Get base currency setting
    const baseSetting = await prisma.setting.findUnique({
      where: { key: 'base_currency' },
    });

    const baseCurrency = baseSetting ? baseSetting.value : DEFAULT_BASE_CURRENCY;

    // 2. Get latest exchange rates for each currency pair
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { effectiveDate: 'desc' },
      take: 100,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        baseCurrency,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        rates,
      },
    });
  } catch (error) {
    logger.error('Error fetching currency settings:', error);
    return next(error);
  }
};

/**
 * POST /api/settings/currency/base
 * Updates the company base currency.
 */
export const setBaseCurrency = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { currency } = req.body;
    if (!currency || typeof currency !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Currency code is required' });
    }

    const code = currency.toUpperCase();
    const isValid = SUPPORTED_CURRENCIES.some((c) => c.code === code);
    if (!isValid) {
      return res.status(400).json({ status: 'error', message: `Unsupported currency: ${code}` });
    }

    const setting = await prisma.setting.upsert({
      where: { key: 'base_currency' },
      update: { value: code },
      create: {
        key: 'base_currency',
        value: code,
        description: 'Company Base Currency for Accounting & Financial Statements',
        type: 'STRING',
      },
    });

    return res.status(200).json({
      status: 'success',
      message: `Base currency set to ${code}`,
      data: { baseCurrency: setting.value },
    });
  } catch (error) {
    logger.error('Error setting base currency:', error);
    return next(error);
  }
};

/**
 * GET /api/settings/currency/rates
 * Returns all exchange rate records.
 */
export const listExchangeRates = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { effectiveDate: 'desc' },
    });
    return res.status(200).json({ status: 'success', data: rates });
  } catch (error) {
    logger.error('Error listing exchange rates:', error);
    return next(error);
  }
};

/**
 * POST /api/settings/currency/rates
 * Sets or records an exchange rate for a currency pair.
 * Body: { fromCurrency, toCurrency, rate, effectiveDate?, source?, notes? }
 */
export const createExchangeRate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { fromCurrency, toCurrency, rate, effectiveDate, source, notes } = req.body;
    const userId = (req as any).user?.id;

    if (!fromCurrency || !toCurrency || rate === undefined || rate === null) {
      return res.status(400).json({
        status: 'error',
        message: 'fromCurrency, toCurrency, and rate are required',
      });
    }

    const numericRate = parseFloat(rate);
    if (isNaN(numericRate) || numericRate <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Rate must be a positive number',
      });
    }

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        fromCurrency: from,
        toCurrency: to,
        rate: numericRate,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        source: source || 'Manual Entry',
        notes: notes || null,
        createdBy: userId ? BigInt(userId) : null,
      },
    });

    return res.status(201).json({
      status: 'success',
      data: exchangeRate,
    });
  } catch (error) {
    logger.error('Error creating exchange rate:', error);
    return next(error);
  }
};

/**
 * DELETE /api/settings/currency/rates/:id
 * Removes an exchange rate record.
 */
export const deleteExchangeRate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id = BigInt(req.params.id);
    await prisma.exchangeRate.delete({
      where: { id },
    });
    return res.status(200).json({ status: 'success', message: 'Exchange rate deleted' });
  } catch (error) {
    logger.error('Error deleting exchange rate:', error);
    return next(error);
  }
};

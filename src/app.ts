require('module-alias/register');

import express, { Express, Request, Response, NextFunction } from 'express';

// Add BigInt serialization support
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import cors from 'cors';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contact';
import productRoutes from './routes/product';
import invoiceRoutes from './routes/invoice';
import billRoutes from './routes/bill';
import accountRoutes from './routes/account';
import journalEntryRoutes from './routes/journalEntry';
import paymentRoutes from './routes/payment';
import reportRoutes from './routes/report';
import tradeRoutes from './routes/trade';
import userRoutes from './routes/user';
import bankAccountRoutes from './routes/bankAccount';
import bankingRoutes from './routes/banking';
import roleRoutes from './routes/role';
import { errorHandler } from './middlewares/error';
import { prisma } from './services/prisma/prismaClient';
import logger from './utils/logger';

import adminRoutes from './routes/admin';
import accountingPeriodRoutes from './routes/accountingPeriod';

const app: Express = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

const apiPrefix = process.env.API_PREFIX || '/api';

app.get(`${apiPrefix}/health`, (_req: Request, res: Response) => {
  res.status(200).json({ status: 'success', timestamp: new Date().toISOString() });
});

import { requireTenant } from './middlewares/tenant';


app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);
app.use(`${apiPrefix}/contact`, requireTenant, contactRoutes);
app.use(`${apiPrefix}/product`, requireTenant, productRoutes);
app.use(`${apiPrefix}/inventory/product`, requireTenant, productRoutes);
app.use(`${apiPrefix}/invoice`, requireTenant, invoiceRoutes);
app.use(`${apiPrefix}/bill`, requireTenant, billRoutes);
app.use(`${apiPrefix}/account`, requireTenant, accountRoutes);
app.use(`${apiPrefix}/journal-entry`, requireTenant, journalEntryRoutes);
app.use(`${apiPrefix}/payment`, requireTenant, paymentRoutes);
app.use(`${apiPrefix}/report`, requireTenant, reportRoutes);
app.use(`${apiPrefix}/trade`, requireTenant, tradeRoutes);
app.use(`${apiPrefix}/user`, requireTenant, userRoutes);
app.use(`${apiPrefix}/bank-account`, requireTenant, bankAccountRoutes);
app.use(`${apiPrefix}/role`, requireTenant, roleRoutes);
app.use(`${apiPrefix}/banking`, requireTenant, bankingRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

const checkDbConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
  }
};

checkDbConnection();

export default app;

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { BankTransactionType } from '@prisma/client';
import logger from '../../utils/logger';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.bankTransaction.findMany({
      where: { isActive: true, type: BankTransactionType.TRANSFER },
      include: { bankAccount: true },
      orderBy: { date: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const item = await prisma.bankTransaction.findUnique({
      where: { id },
      include: { bankAccount: true }
    });
    if (!item || !item.isActive) return res.status(404).json({ message: 'Transfer not found' });
    return res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const {
      fromBankAccountId,
      toBankAccountId,
      amount,
      date,
      description,
      reference
    } = req.body;

    // Generate a shared reference to link the two transactions
    const transferRef = reference || `TRF-${Date.now()}`;

    const [withdrawal, deposit] = await prisma.$transaction([
      prisma.bankTransaction.create({
        data: {
          bankAccountId: BigInt(fromBankAccountId),
          type: BankTransactionType.WITHDRAWAL,
          amount,
          date,
          description: description || `Transfer to account ${toBankAccountId}`,
          reference: transferRef,
          createdBy: BigInt(userId)
        }
      }),
      prisma.bankTransaction.create({
        data: {
          bankAccountId: BigInt(toBankAccountId),
          type: BankTransactionType.DEPOSIT,
          amount,
          date,
          description: description || `Transfer from account ${fromBankAccountId}`,
          reference: transferRef,
          createdBy: BigInt(userId)
        }
      })
    ]);

    res.status(201).json({ status: 'success', data: { withdrawal, deposit } });
  } catch (error) {
    logger.error('Error creating transfer:', error);
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) },
      include: { bankAccount: true }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating transfer:', error);
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    await prisma.bankTransaction.update({
      where: { id },
      data: { isActive: false, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: { message: 'Transfer deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting transfer:', error);
    next(error);
  }
};

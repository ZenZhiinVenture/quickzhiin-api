import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { BankTransactionType, BankTransactionStatus } from '@prisma/client';
import logger from '../../utils/logger';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.bankTransaction.findMany({
      where: { isActive: true, type: BankTransactionType.DEPOSIT },
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
    if (!item || !item.isActive) return res.status(404).json({ message: 'Income record not found' });
    return res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const item = await prisma.bankTransaction.create({
      data: {
        ...req.body,
        type: BankTransactionType.DEPOSIT,
        createdBy: BigInt(userId)
      },
      include: { bankAccount: true }
    });
    res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    logger.error('Error creating income record:', error);
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: { ...req.body, type: BankTransactionType.DEPOSIT, updatedBy: BigInt(userId) },
      include: { bankAccount: true }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating income record:', error);
    next(error);
  }
};

export const patchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: BankTransactionStatus };
    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching income status:', error);
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
    res.status(200).json({ status: 'success', data: { message: 'Income record deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting income record:', error);
    next(error);
  }
};

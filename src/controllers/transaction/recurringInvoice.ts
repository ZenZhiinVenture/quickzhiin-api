import { Request, Response } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { processRecurringInvoices } from '../../services/recurring/process';
import logger from '../../utils/logger';

export const listRecurringInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { profileName: { contains: search, mode: 'insensitive' } },
        { contact: { legalname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const profiles = await prisma.recurringInvoice.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            legalname: true,
            taxNo: true,
          },
        },
      },
      orderBy: { nextRunDate: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: profiles,
    });
  } catch (error: any) {
    logger.error('Error listing recurring invoices:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to list recurring invoices' });
  }
};

export const getRecurringInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const profile = await prisma.recurringInvoice.findUnique({
      where: { id: BigInt(id) },
      include: {
        contact: true,
      },
    });

    if (!profile) {
      res.status(404).json({ status: 'error', message: 'Recurring invoice profile not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (error: any) {
    logger.error('Error fetching recurring invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch recurring invoice' });
  }
};

export const createRecurringInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      profileName,
      contactId,
      frequency,
      startDate,
      endDate,
      currency = 'MYR',
      exchangeRate = 1.0,
      autoSendEmail = false,
      lineItems,
      notes,
      paymentTerms = 'Net 30',
      maxOccurrences,
    } = req.body;

    if (!profileName || !contactId || !startDate || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'profileName, contactId, startDate, and at least one lineItem are required',
      });
      return;
    }

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      res.status(400).json({ status: 'error', message: 'Invalid startDate provided' });
      return;
    }

    const profile = await prisma.recurringInvoice.create({
      data: {
        profileName,
        contactId: BigInt(contactId),
        frequency: frequency || 'MONTHLY',
        startDate: parsedStartDate,
        endDate: endDate ? new Date(endDate) : null,
        nextRunDate: parsedStartDate,
        currency,
        exchangeRate,
        autoSendEmail: Boolean(autoSendEmail),
        lineItems,
        notes: notes || null,
        paymentTerms,
        maxOccurrences: maxOccurrences ? parseInt(maxOccurrences, 10) : null,
        status: 'ACTIVE',
      },
      include: {
        contact: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: profile,
    });
  } catch (error: any) {
    logger.error('Error creating recurring invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create recurring invoice' });
  }
};

export const updateRecurringInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      profileName,
      contactId,
      frequency,
      startDate,
      endDate,
      nextRunDate,
      currency,
      exchangeRate,
      autoSendEmail,
      lineItems,
      notes,
      paymentTerms,
      maxOccurrences,
      status,
    } = req.body;

    const dataToUpdate: any = {};
    if (profileName !== undefined) dataToUpdate.profileName = profileName;
    if (contactId !== undefined) dataToUpdate.contactId = BigInt(contactId);
    if (frequency !== undefined) dataToUpdate.frequency = frequency;
    if (startDate !== undefined) dataToUpdate.startDate = new Date(startDate);
    if (endDate !== undefined) dataToUpdate.endDate = endDate ? new Date(endDate) : null;
    if (nextRunDate !== undefined) dataToUpdate.nextRunDate = new Date(nextRunDate);
    if (currency !== undefined) dataToUpdate.currency = currency;
    if (exchangeRate !== undefined) dataToUpdate.exchangeRate = exchangeRate;
    if (autoSendEmail !== undefined) dataToUpdate.autoSendEmail = Boolean(autoSendEmail);
    if (lineItems !== undefined) dataToUpdate.lineItems = lineItems;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (paymentTerms !== undefined) dataToUpdate.paymentTerms = paymentTerms;
    if (maxOccurrences !== undefined) dataToUpdate.maxOccurrences = maxOccurrences ? parseInt(maxOccurrences, 10) : null;
    if (status !== undefined) dataToUpdate.status = status;

    const updated = await prisma.recurringInvoice.update({
      where: { id: BigInt(id) },
      data: dataToUpdate,
      include: {
        contact: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error: any) {
    logger.error('Error updating recurring invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to update recurring invoice' });
  }
};

export const deleteRecurringInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.recurringInvoice.delete({
      where: { id: BigInt(id) },
    });

    res.status(200).json({
      status: 'success',
      message: 'Recurring invoice profile deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting recurring invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete recurring invoice' });
  }
};

export const pauseRecurringInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await prisma.recurringInvoice.update({
      where: { id: BigInt(id) },
      data: { status: 'PAUSED' },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error: any) {
    logger.error('Error pausing recurring invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to pause recurring invoice' });
  }
};

export const resumeRecurringInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await prisma.recurringInvoice.update({
      where: { id: BigInt(id) },
      data: { status: 'ACTIVE' },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error: any) {
    logger.error('Error resuming recurring invoice:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to resume recurring invoice' });
  }
};

export const processRecurringBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : new Date();
    const result = await processRecurringInvoices(prisma, targetDate);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error in recurring invoice batch execution:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Batch execution failed' });
  }
};

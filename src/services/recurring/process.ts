import { RecurringFrequency } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';
import { upsertInvoice, InvoiceLineInput } from '../invoice/upsert';
import logger from '../../utils/logger';

export function calculateNextRunDate(currentDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY': {
      const originalDay = next.getDate();
      next.setMonth(next.getMonth() + 1);
      if (next.getDate() !== originalDay) {
        next.setDate(0);
      }
      break;
    }
    case 'QUARTERLY': {
      const originalDay = next.getDate();
      next.setMonth(next.getMonth() + 3);
      if (next.getDate() !== originalDay) {
        next.setDate(0);
      }
      break;
    }
    case 'BIANNUALLY': {
      const originalDay = next.getDate();
      next.setMonth(next.getMonth() + 6);
      if (next.getDate() !== originalDay) {
        next.setDate(0);
      }
      break;
    }
    case 'ANNUALLY': {
      const originalDay = next.getDate();
      next.setFullYear(next.getFullYear() + 1);
      if (next.getDate() !== originalDay) {
        next.setDate(0);
      }
      break;
    }
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export interface ProcessRecurringResult {
  processedCount: number;
  completedCount: number;
  invoicesGenerated: Array<{
    recurringProfileId: string;
    profileName: string;
    invoiceId: string;
    invoiceNumber: string;
    date: Date;
  }>;
  errors: Array<{
    recurringProfileId: string;
    profileName: string;
    error: string;
  }>;
}

export async function processRecurringInvoices(
  client: any = prisma,
  targetDate: Date = new Date()
): Promise<ProcessRecurringResult> {
  const result: ProcessRecurringResult = {
    processedCount: 0,
    completedCount: 0,
    invoicesGenerated: [],
    errors: [],
  };

  try {
    const dueProfiles = await client.recurringInvoice.findMany({
      where: {
        status: 'ACTIVE',
        nextRunDate: {
          lte: targetDate,
        },
      },
      include: {
        contact: true,
      },
    });

    for (const profile of dueProfiles) {
      try {
        const rawLines = Array.isArray(profile.lineItems) ? profile.lineItems : JSON.parse(profile.lineItems as string);
        const lines: InvoiceLineInput[] = rawLines.map((line: any) => ({
          productId: line.productId,
          productName: line.productName || 'Retainer / Service',
          description: line.description || '',
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
          discount: Number(line.discount) || 0,
          tax: Number(line.tax) || 0,
          classificationCode: line.classificationCode,
          msicCode: line.msicCode,
          msicDescription: line.msicDescription,
        }));

        const invoice = await upsertInvoice(
          {
            contactId: profile.contactId,
            currency: profile.currency || 'MYR',
            exchangeRate: profile.exchangeRate ? Number(profile.exchangeRate) : 1,
            date: profile.nextRunDate,
            paymentTerms: profile.paymentTerms || 'Net 30',
            notes: profile.notes || undefined,
            lines,
          },
          profile.createdBy ? BigInt(profile.createdBy) : BigInt(1)
        );

        const newGeneratedCount = (profile.invoicesGenerated || 0) + 1;
        const nextDate = calculateNextRunDate(profile.nextRunDate, profile.frequency);

        const hasReachedMax = profile.maxOccurrences ? newGeneratedCount >= profile.maxOccurrences : false;
        const hasPassedEnd = profile.endDate ? nextDate > new Date(profile.endDate) : false;
        const isCompleted = hasReachedMax || hasPassedEnd;

        await client.recurringInvoice.update({
          where: { id: profile.id },
          data: {
            invoicesGenerated: newGeneratedCount,
            lastRunDate: profile.nextRunDate,
            nextRunDate: nextDate,
            status: isCompleted ? 'COMPLETED' : 'ACTIVE',
          },
        });

        result.processedCount++;
        if (isCompleted) {
          result.completedCount++;
        }

        result.invoicesGenerated.push({
          recurringProfileId: profile.id.toString(),
          profileName: profile.profileName,
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.number,
          date: profile.nextRunDate,
        });

        logger.info(`Recurring invoice generated: ${invoice.number} for profile ${profile.profileName} (ID: ${profile.id})`);
      } catch (err: any) {
        logger.error(`Error processing recurring profile ${profile.id}:`, err);
        result.errors.push({
          recurringProfileId: profile.id.toString(),
          profileName: profile.profileName,
          error: err.message || 'Unknown processing error',
        });
      }
    }
  } catch (err: any) {
    logger.error('Failed to query recurring profiles:', err);
    throw err;
  }

  return result;
}

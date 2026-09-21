import { processRecurringInvoices } from '../services/recurring/process';
import { prisma } from '../services/prisma/prismaClient';
import logger from '../utils/logger';

let schedulerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

export async function runRecurringJobOnce(): Promise<void> {
  if (isRunning) {
    logger.warn('Recurring invoice scheduler is already running, skipping overlapping tick.');
    return;
  }

  isRunning = true;
  try {
    logger.info('Running recurring invoices automated processor check...');
    const result = await processRecurringInvoices(prisma, new Date());
    if (result.processedCount > 0 || result.errors.length > 0) {
      logger.info(
        `Recurring scheduler completed: generated ${result.processedCount} invoices (${result.completedCount} profiles completed), ${result.errors.length} errors.`
      );
    }
  } catch (error) {
    logger.error('Unhandled error during recurring invoice scheduler execution:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the in-process recurring invoice scheduler.
 * @param intervalMinutes Interval between runs (defaults to 60 minutes)
 */
export function startRecurringScheduler(intervalMinutes = 60): void {
  if (schedulerInterval) {
    logger.warn('Recurring invoice scheduler is already initialized.');
    return;
  }

  logger.info(`Starting Recurring Invoice scheduler (interval: ${intervalMinutes} mins)...`);

  // Run initial check after a brief 5-second warmup delay
  setTimeout(() => {
    runRecurringJobOnce().catch((err) => logger.error('Initial recurring check error:', err));
  }, 5000);

  // Set recurring interval
  const intervalMs = intervalMinutes * 60 * 1000;
  schedulerInterval = setInterval(() => {
    runRecurringJobOnce().catch((err) => logger.error('Recurring interval check error:', err));
  }, intervalMs);
}

export function stopRecurringScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Recurring invoice scheduler stopped.');
  }
}

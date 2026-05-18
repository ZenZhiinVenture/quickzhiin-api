import { z } from 'zod';

export const bankMatchSchema = z.object({
  bankTransactionId: z.string().or(z.bigint()),
  journalEntryLineIds: z.array(z.string().or(z.bigint())),
  amount: z.number(),
});

export const bankReconciliationSchema = z.object({
  bankAccountId: z.string().or(z.bigint()),
  periodStart: z.date().or(z.string()),
  periodEnd: z.date().or(z.string()),
  statementBalance: z.number(),
  reconciledBalance: z.number().optional(),
  notes: z.string().optional(),
});

export const bankAdjustmentSchema = z.object({
  bankTransactionId: z.string().or(z.bigint()),
  date: z.string().or(z.date()),
  description: z.string(),
  offsetAccountId: z.string().or(z.bigint()),
  amount: z.number(),
});

export type BankMatchInput = z.infer<typeof bankMatchSchema>;
export type BankReconciliationInput = z.infer<typeof bankReconciliationSchema>;
export type BankAdjustmentInput = z.infer<typeof bankAdjustmentSchema>;

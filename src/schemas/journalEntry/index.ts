import { z } from 'zod';

export const journalEntryLineSchema = z.object({
  id: z.string().optional(),
  accountId: z.string(),
  description: z.string().nullable().optional(),
  debit: z.number().default(0),
  credit: z.number().default(0),
  taxId: z.string().nullable().optional(),
});

export const journalEntrySchema = z.object({
  number: z.string().min(1),
  date: z.string().or(z.date()),
  reference: z.string().nullable().optional(),
  narration: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'READY', 'PAID']).default('DRAFT'),
  lines: z.array(journalEntryLineSchema).min(2),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

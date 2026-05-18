import { z } from 'zod';

export const bankStatementSchema = z.object({
  bankAccountId: z.string().or(z.bigint()),
  fileName: z.string(),
  periodStart: z.date().or(z.string()),
  periodEnd: z.date().or(z.string()),
  openingBalance: z.number().default(0),
  closingBalance: z.number().default(0),
});

export type BankStatementInput = z.infer<typeof bankStatementSchema>;

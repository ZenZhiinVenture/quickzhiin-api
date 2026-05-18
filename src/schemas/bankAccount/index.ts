import { z } from 'zod';

export const bankAccountSchema = z.object({
  name: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  currency: z.string().default('RM'),
  balance: z.number().default(0),
  accountId: z.string().or(z.bigint()).optional(),
  isActive: z.boolean().default(true),
});

export type BankAccountInput = z.infer<typeof bankAccountSchema>;

import { z } from 'zod';
import {
  DepreciationMethod,
  DepreciationConvention,
  DepreciationMode,
} from '@prisma/client';

export const assetSchema = z.object({
  name: z.string(),
  assetTag: z.string(),
  assetTypeId: z.number(),
  assetAccountId: z.number(),
  depreciationAccountId: z.number(),
  expenseAccountId: z.number(),
  defaultMethod: z.enum([DepreciationMethod.DECLINING_BALANCE, DepreciationMethod.STRAIGHT_LINE]),
  defaultConvention: z.enum([
    DepreciationConvention.FULL_MONTH,
    DepreciationConvention.HALF_YEAR,
    DepreciationConvention.MID_MONTH,
  ]),
  defaultMode: z.enum([DepreciationMode.FIXED, DepreciationMode.PERCENTAGE]),
  defaultRate: z.number(),
  defaultYear: z.number(),
  defaultMonth: z.number(),
  isActive: z.boolean(),
});

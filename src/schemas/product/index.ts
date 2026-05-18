import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  classificationCode: z.number().optional(),
  productType: z.string().optional().default('Service'),
  msicCode: z.string().optional(),
  msicDescription: z.string().optional(),
  salePrice: z
    .number()
    .nonnegative('Sale price must be non-negative')
    .optional()
    .default(0)
    .transform(val => Number(val.toFixed(2))), // Ensure 4 decimal places
  saleDescription: z.string().optional(),
  saleAccountId: z.number().optional(),
  purchasePrice: z
    .number()
    .nonnegative('Purchase price must be non-negative')
    .optional()
    .default(0)
    .transform(val => Number(val.toFixed(2))), // Ensure 4 decimal places
  purchaseDescription: z.string().optional(),
  purchaseAccountId: z.number().optional(),
  uom: z.string().optional(),
  quantityOnHand: z.number().optional(),
  reorderLevel: z.number().optional(),
  isInventory: z.boolean().optional().default(false),
  categoryId: z.number().optional(),
  isActive: z.boolean().optional().default(true),
});

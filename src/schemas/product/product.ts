import { z } from 'zod';
import { productSchema } from '.';

// Validation schema for creating a product
export const createProductSchema = z.object({
  product: productSchema,
});

// Validation schema for updating a product (all fields optional)
export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().transform(val => BigInt(val)), // Expecting ID in URL params
  }),
  body: productSchema,
});

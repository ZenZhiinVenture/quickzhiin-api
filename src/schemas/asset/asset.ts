import { z } from 'zod';
import { assetSchema } from '.';

export const createAssetSchema = z.object({
  asset: assetSchema,
});

export const updateAssetSchema = z.object({
  params: z.object({
    id: z.string().transform(val => BigInt(val)), // Expecting ID in URL params
  }),
  body: assetSchema,
});

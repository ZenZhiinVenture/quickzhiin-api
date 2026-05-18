import { z } from 'zod';
import { contactAddressSchema, contactPersonSchema, contactSchema } from '.';

export const createContactSchema = z.object({
  body: z.object({
    contact: contactSchema,
    contactAddress: z.array(contactAddressSchema).optional(),
    contactPerson: z.array(contactPersonSchema).optional(),
  })
});

export const updateContactSchema = z.object({
  params: z.object({
    id: z.string().transform(val => BigInt(val)), // Expecting ID in URL params
  }),
  body: z.object({
    contact: contactSchema,
    contactAddress: z.array(contactAddressSchema),
    contactPerson: z.array(contactPersonSchema),
  }),
});

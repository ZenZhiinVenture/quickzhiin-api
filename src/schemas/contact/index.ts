import { z } from 'zod';
import { ContactType, RegistrationNumberType as RegNoT } from '@prisma/client';

export const contactSchema = z.object({
  legalname: z.string(),
  contactType: z.enum([
    ContactType.CUSTOMER,
    ContactType.EMPLOYEE,
    ContactType.SUPPLIER,
    ContactType.COMPANY,
    ContactType.BRANCH,
  ]),
  regNoType: z.enum(['NONE', 'BRN', 'IC', 'PASSPORT']),
  regNo: z.string(),
  taxNo: z.string().optional(),
  pfNo: z.string().optional(),
  businessCodeId: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  position: z.string().optional(),
  joinDate: z.date().optional(),
  userId: z.coerce.bigint().optional(),
  departmentId: z.number().optional(),
  defaultCountryId: z.number(),
  accountsReceivableAccountId: z.coerce.bigint().optional(),
  accountsPayableAccountId: z.coerce.bigint().optional(),
  creditLimit: z.number().optional(),
  paymentTerms: z.number().optional(),
  sstNo: z.string().optional(),
  msicCode: z.string().optional(),
  isCustomer: z.boolean().default(false),
  isSupplier: z.boolean().default(false),
  isActive: z.boolean(),
});

export const contactAddressSchema = z.object({
  contactId: z.coerce.bigint().optional(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  countryCode: z.string(),
  purpose: z.string(),
  isPrimary: z.boolean(),
});

export const contactPersonSchema = z.object({
  contactId: z.coerce.bigint().optional(),
  name: z.string(),
  position: z.string(),
  email: z.string(),
  phone: z.string(),
  isPrimary: z.boolean(),
});

import { contactSchema } from '../../schemas/contact';
import { Contact, Prisma } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertContact(
  userId: number,
  data: Contact) {
  try {
    const validateData = contactSchema.parse(data);
    const now = new Date();

    const contactData = {
      ...validateData,
      creditLimit: new Prisma.Decimal(validateData.creditLimit || 0.0),
      paymentTerms: validateData.paymentTerms || undefined,
      updatedAt: now,
      updatedBy: BigInt(userId),
    };

    if (!data.id || Number(data.id) === 0) {
      return await prisma.contact.create({
        data: {
          ...contactData,
          createdAt: now,
          createdBy: BigInt(userId),
        },
      });
    }

    return await prisma.contact.upsert({
      where: {
        id: data.id,
      },
      create: {
        ...contactData,
        createdAt: now,
        createdBy: BigInt(userId),
      },
      update: contactData,
    });
  } catch (err) {
    throw err;
  }
}

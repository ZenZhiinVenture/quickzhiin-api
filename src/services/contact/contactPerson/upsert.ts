import { contactPersonSchema } from '../../../schemas/contact';
import { ContactPerson } from '@prisma/client';
import { prisma } from '../../prisma/prismaClient';

export default async function upsertContactPerson(
  userId: number,
  contactId: number,
  datas: ContactPerson[]): Promise<ContactPerson[]> {
  try {
    const now = new Date();
    return await Promise.all(
      datas.map(async (data: ContactPerson) => {
        const validateData = contactPersonSchema.parse(data);
        
        // If no ID is provided, it's a new record
        if (!data.id || Number(data.id) === 0) {
          return prisma.contactPerson.create({
            data: {
              ...validateData,
              contactId: BigInt(contactId),
              createdAt: now,
              createdBy: BigInt(userId),
              updatedAt: now,
              updatedBy: BigInt(userId),
            },
          });
        }

        return prisma.contactPerson.upsert({
          where: {
            id: data.id,
          },
          create: {
            ...validateData,
            contactId: BigInt(contactId),
            createdAt: now,
            createdBy: BigInt(userId),
            updatedAt: now,
            updatedBy: BigInt(userId),
          },
          update: {
            name: validateData.name,
            position: validateData.position,
            email: validateData.email,
            phone: validateData.phone,
            isPrimary: validateData.isPrimary,
            updatedAt: now,
            updatedBy: BigInt(userId),
          },
        });
      })
    );
  } catch (err) {
    throw err;
  }
}

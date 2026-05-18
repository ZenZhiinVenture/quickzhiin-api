import { contactAddressSchema } from '../../../schemas/contact';
import { ContactAddress } from '@prisma/client';
import { prisma } from '../../prisma/prismaClient';

export default async function upsertContactAddress(
  userId: number,
  contactId: number,
  datas: ContactAddress[]): Promise<ContactAddress[]> {
  try {
    const now = new Date();

    const addresses = await Promise.all(
      datas.map(async (data: ContactAddress) => {
        const checkData = contactAddressSchema.parse(data);

        // If no ID is provided, it's a new record
        if (!data.id || Number(data.id) === 0) {
          return await prisma.contactAddress.create({
            data: {
              ...checkData,
              contactId: BigInt(contactId),
              createdAt: now,
              createdBy: BigInt(userId),
              updatedAt: now,
              updatedBy: BigInt(userId),
            },
          });
        }

        return await prisma.contactAddress.upsert({
          where: {
            id: data.id,
          },
          create: {
            ...checkData,
            contactId: BigInt(contactId),
            createdAt: now,
            createdBy: BigInt(userId),
            updatedAt: now,
            updatedBy: BigInt(userId),
          },
          update: {
            addressLine1: checkData.addressLine1,
            addressLine2: checkData.addressLine2,
            city: checkData.city,
            state: checkData.state,
            postalCode: checkData.postalCode,
            countryCode: checkData.countryCode,
            purpose: checkData.purpose,
            isPrimary: checkData.isPrimary,
            updatedAt: now,
            updatedBy: BigInt(userId),
          },
        });
      })
    );
    return addresses;
  } catch (err) {
    throw err;
  }
}

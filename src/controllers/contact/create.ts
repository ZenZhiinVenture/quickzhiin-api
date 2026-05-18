import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { contactSchema, contactPersonSchema, contactAddressSchema } from 'src/schemas/contact';
import { ContactPerson, ContactAddress, Prisma } from '@prisma/client';
import upsertContact from 'src/services/contact/upsert';
import upsertContactPerson from 'src/services/contact/contactPerson/upsert';
import upsertContactAddress from 'src/services/contact/contactAddress/upsert';

export default async function createContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { contact, contactAddress, contactPerson } = req.body;

    const contactData = contactSchema.parse({
      ...contact,
    });
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check uniqueness only if legalname, regNoType, and regNo are provided
    // If regNo is empty, we allow duplicates for now or rely on other constraints
    if (contactData.regNo && contactData.regNo !== "") {
      const isContactExist = await prisma.contact.findFirst({
        where: {
          legalname: contactData.legalname,
          regNoType: contactData.regNoType,
          regNo: contactData.regNo,
        },
      });

      if (isContactExist) {
        return res.status(400).json({
          message: 'Contact with the legalname, regNo already exist.',
        });
      }
    }

    const userIdNum = Number(userId);
    const now = new Date();

    // Use a transaction for atomic creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base contact
      const newContact = await tx.contact.create({
        data: {
          ...contactData,
          creditLimit: new Prisma.Decimal(contactData.creditLimit || 0.0),
          createdAt: now,
          createdBy: BigInt(userIdNum),
          updatedAt: now,
          updatedBy: BigInt(userIdNum),
        },
      });

      const contactId = newContact.id;

      // 2. Create contact persons
      let createdPersons = [];
      if (contactPerson && Array.isArray(contactPerson) && contactPerson.length > 0) {
        for (const person of contactPerson) {
          const validatedPerson = contactPersonSchema.parse(person);
          const p = await tx.contactPerson.create({
            data: {
              ...validatedPerson,
              contactId,
              createdAt: now,
              createdBy: BigInt(userIdNum),
              updatedAt: now,
              updatedBy: BigInt(userIdNum),
            },
          });
          createdPersons.push(p);
        }
      }

      // 3. Create contact addresses
      let createdAddresses = [];
      if (contactAddress && Array.isArray(contactAddress) && contactAddress.length > 0) {
        for (const addr of contactAddress) {
          const validatedAddr = contactAddressSchema.parse(addr);
          const a = await tx.contactAddress.create({
            data: {
              ...validatedAddr,
              contactId,
              createdAt: now,
              createdBy: BigInt(userIdNum),
              updatedAt: now,
              updatedBy: BigInt(userIdNum),
            },
          });
          createdAddresses.push(a);
        }
      }

      return {
        contact: newContact,
        contactPerson: createdPersons,
        contactAddress: createdAddresses,
      };
    });

    return res.status(200).json({
      message: 'Contact created successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

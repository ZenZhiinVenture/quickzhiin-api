import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertContactAddress from 'src/services/contact/contactAddress/upsert';
import upsertContactPerson from 'src/services/contact/contactPerson/upsert';
import { ContactAddress, ContactPerson } from '@prisma/client';
import upsertContact from 'src/services/contact/upsert';

export default async function updateContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { contact, contactAddress, contactPerson } = req.body;


    const userId = req.user?.id;

    const contactId = Number(id);
    // Update contact for the given tenant
    const updatedContact = await upsertContact(userId || 1, contact);

    let updatedAddresses: ContactAddress[] = [];
    if (contactAddress.length > 0) {
      updatedAddresses = await upsertContactAddress(
        userId || 1,
        contactId,
        contactAddress);
    }

    let updatedPerson: ContactPerson[] = [];
    if (contactPerson.length > 0) {
      updatedPerson = await upsertContactPerson(userId || 1, contactId, contactPerson);
    }

    return res.status(200).json({
      message: 'Contact updated successfully',
      data: {
        contact: updatedContact,
        contactAddress: updatedAddresses,
        contactPerson: updatedPerson,
      },
    });
  } catch (error) {
    return next(error);
  }
}

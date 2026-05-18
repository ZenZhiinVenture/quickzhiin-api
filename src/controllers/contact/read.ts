import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getContactDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Find contact by ID for the given tenant
    const contact = await prisma.contact.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
      });
    }

    const contactPerson = await prisma.contactPerson.findMany({
      where: {
        contactId: BigInt(id),
      },
    });

    const contactAddress = await prisma.contactAddress.findMany({
      where: {
        contactId: BigInt(id),
      },
    });
    return res.status(200).json({
      message: 'Contact retrieved successfully',
      data: {
        contact,
        contactPerson,
        contactAddress,
      },
    });
  } catch (error) {
    return next(error);
  }
}

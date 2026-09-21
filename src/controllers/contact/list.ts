import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { paginatedQuery } from '../../helpers/paginatedQuery';

export default async function getContactList(req: Request, res: Response, next: NextFunction) {
  try {

    const select = {
      id: true,
      legalname: true,
      contactType: true,
      isCustomer: true,
      isSupplier: true,
      regNo: true,
      taxNo: true,
      isActive: true,
      contact_persons: {
        where: { isPrimary: true },
        select: { email: true, phone: true }
      }
    };

    const where = {
      isActive: req.query.isActive === 'false' ? false : true,
    };

    const contacts = await paginatedQuery(prisma.contact, req, select, where);

    return res.status(200).json({
      message: 'Contacts retrieved successfully',
      data: contacts,
    });
  } catch (error) {
    return next(error);
  }
}

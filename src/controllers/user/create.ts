import { Request, Response, NextFunction } from 'express';
import { centralPrisma } from '../../services/prisma/prismaClient';
import * as bcrypt from 'bcryptjs';

/**
 * Creates a user in the CENTRAL database and links them to the current tenant.
 */
export default async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, role = 'ACCOUNTANT', firstName, lastName, phone } = req.body;
    const tenant = (req as any).tenant;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists in central DB
    let centralUser = await centralPrisma.user.findUnique({ where: { email } });

    if (!centralUser) {
      // Create new user in central DB
      const hashedPassword = await bcrypt.hash(password, 10);
      centralUser = await centralPrisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          phone,
          status: 'active',
        },
      });
    }

    // Check if user already has access to this tenant
    const existingAccess = await centralPrisma.tenantUserAccess.findUnique({
      where: { userId_tenantId: { userId: centralUser.id, tenantId: tenant.id } },
    });

    if (existingAccess) {
      return res.status(400).json({ message: 'User already has access to this company' });
    }

    // Link user to this tenant
    const access = await centralPrisma.tenantUserAccess.create({
      data: {
        userId: centralUser.id,
        tenantId: tenant.id,
        role,
      },
    });

    return res.status(201).json({
      message: 'User created and linked to company successfully',
      user: {
        id: centralUser.id.toString(),
        email: centralUser.email,
        firstName: centralUser.firstName,
        lastName: centralUser.lastName,
        role: access.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
    return next(err);
  }
}

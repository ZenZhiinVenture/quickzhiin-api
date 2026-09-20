import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { centralPrisma } from '../../services/prisma/prismaClient';
import { generateToken } from '../../utils/jwt';
import logger from '../../utils/logger';

/**
 * Handles user registration.
 * Creates the user in the CENTRAL database.
 * Optionally links them to a tenant via TenantUserAccess.
 */
export default async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, phone, tenantCode } = req.body;

    // 1. Check email uniqueness in central DB
    const existing = await centralPrisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'error_email_already_exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Create user in CENTRAL database
    const user = await centralPrisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        status: 'active',
      },
    });

    // 3. If tenantCode provided, link user as OWNER of that tenant
    let tenantAccess: any[] = [];
    if (tenantCode) {
      const tenant = await centralPrisma.tenant.findUnique({ where: { code: tenantCode } });
      if (tenant) {
        const access = await centralPrisma.tenantUserAccess.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: 'OWNER',
          },
          include: { tenant: { select: { code: true, id: true } } },
        });
        tenantAccess = [{
          tenantCode: access.tenant.code,
          tenantId: Number(access.tenant.id),
          role: access.role,
        }];
      }
    }

    // 4. Generate JWT
    const token = generateToken({
      id: Number(user.id),
      email: user.email,
      tenantAccess,
    });

    return res.status(201).json({
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantAccess,
      },
      token,
    });
  } catch (error) {
    logger.error('[Registration] Unexpected error', { error });
    return next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { centralPrisma } from '../../services/prisma/prismaClient';
import { generateToken } from '../../utils/jwt';

/**
 * Handles user login.
 * Authenticates against the CENTRAL database (not tenant).
 * Returns a JWT containing userId + all tenants the user can access.
 */
export default async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // 1. Find user in CENTRAL database
    const user = await centralPrisma.user.findUnique({
      where: { email },
      include: {
        tenantAccess: {
          include: {
            tenant: {
              select: { code: true, name: true, id: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'error_invalid_credentials' });
    }

    if (!user.isActive || user.status !== 'active') {
      return res.status(401).json({ message: 'error_account_inactive' });
    }

    // 2. Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'error_invalid_credentials' });
    }

    // 3. Build tenant access list for JWT
    const tenantAccess = user.tenantAccess.map((access: any) => ({
      tenantCode: access.tenant.code,
      tenantId: Number(access.tenant.id),
      role: access.role,
      roleId: access.roleId ? Number(access.roleId) : undefined,
    }));

    // 4. Generate JWT with central user info + all tenant access
    const token = generateToken({
      id: Number(user.id),
      email: user.email,
      tenantAccess,
    });

    return res.status(200).json({
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
    return next(error);
  }
}

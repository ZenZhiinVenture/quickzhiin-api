import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../services/prisma/prismaClient';
import { generateToken } from '../../utils/jwt';

/**
 * Handles user login.
 * Finds the user by email in the unified database.
 * Verifies password, loads role + permissions, returns JWT.
 */
export default async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'error_invalid_credentials' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'error_account_inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'error_invalid_credentials' });
    }

    const permissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: {
        permission: { select: { name: true } },
      },
    });

    const token = generateToken({
      id: Number(user.id),
      roleId: Number(user.roleId),
      email: user.email,
      permissions: permissions.map(p => p.permission.name),
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
      },
      token,
      permissions: permissions.map(p => p.permission.name),
    });
  } catch (error) {
    return next(error);
  }
}

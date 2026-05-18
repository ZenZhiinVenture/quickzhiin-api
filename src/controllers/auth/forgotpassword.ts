import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../../utils/jwt';
import { prisma } from '../../services/prisma/prismaClient';
import { sendResetEmail } from '../../services/email/email';

/**
 * Handles password reset request.
 * Generates a reset token and sends it to the user's email.
 */
export default async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: {
        permission: { select: { name: true } },
      },
    });

    const resetToken = generateToken({
      id: Number(user.id),
      email: user.email,
      roleId: Number(user.roleId),
      permissions: permissions.map((p: any) => p.permission.name),
    });

    await sendResetEmail(user.email, resetToken);

    return res.status(200).json({
      message: 'Reset link sent to your email',
    });
  } catch (error) {
    return next(error);
  }
}

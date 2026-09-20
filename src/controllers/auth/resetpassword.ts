import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { centralPrisma } from '../../services/prisma/prismaClient';
import { verifyToken } from '../../utils/jwt';
import { sendEmail } from '../../services/email/email';

/**
 * Handles password reset.
 * Verifies the reset token and updates the user's password in the central database.
 */
export default async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: 'Invalid or expired token',
      });
    }

    // Find user in central DB
    const user = await centralPrisma.user.findUnique({
      where: {
        id: BigInt(decoded.id),
      },
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await centralPrisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    await sendEmail({
      to: [user.email],
      from: [],
      subject: 'Password Reset Confirmation',
      text: 'Your password has been reset successfully.',
      html: '<p>Your password has been reset successfully.</p>',
    });

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    return next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { isEmailExist, registerUser } from '../../services/auth/register';
import { generateToken } from '../../utils/jwt';
import logger from '../../utils/logger';

/**
 * Handles user registration.
 * Creates a new user in the unified database.
 */
export default async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const emailExist = await isEmailExist(email);
    if (emailExist) {
      return res.status(400).json({ message: 'error_email_already_exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await registerUser({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      phone,
      status: 'active',
    });

    const token = generateToken({
      id: Number(user.id),
      roleId: Number(user.roleId),
      email: user.email,
      permissions: ['*'],
    });

    return res.status(201).json({
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId.toString(),
      },
      token,
      permissions: ['*'],
    });
  } catch (error) {
    logger.error('[Registration] Unexpected error', { error });
    return next(error);
  }
}

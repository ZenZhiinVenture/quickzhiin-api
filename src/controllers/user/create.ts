import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import * as bcrypt from 'bcryptjs';

export default async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, roleId, firstName, lastName, phone } = req.body;

    if (!email || !password || !roleId) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        roleId: BigInt(roleId),
        firstName,
        lastName,
        phone,
        status: 'active',
      },
      include: {
        role: true,
      }
    });

    // Serialize BigInt for response
    const responseData = {
      ...newUser,
      id: newUser.id.toString(),
      roleId: newUser.roleId.toString(),
      createdBy: newUser.createdBy?.toString(),
      updatedBy: newUser.updatedBy?.toString(),
    };

    return res.status(201).json({
      message: 'User created successfully',
      user: responseData,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}

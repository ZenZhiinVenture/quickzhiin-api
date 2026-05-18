import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import * as bcrypt from 'bcryptjs';

export default async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { email, password, roleId, firstName, lastName, phone, status } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {
      email,
      firstName,
      lastName,
      phone,
      status,
      roleId: roleId ? BigInt(roleId) : undefined,
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        role: true,
      }
    });

    const responseData = {
      ...updatedUser,
      id: updatedUser.id.toString(),
      roleId: updatedUser.roleId.toString(),
      createdBy: updatedUser.createdBy?.toString(),
      updatedBy: updatedUser.updatedBy?.toString(),
    };

    return res.status(200).json({
      message: 'User updated successfully',
      user: responseData,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}

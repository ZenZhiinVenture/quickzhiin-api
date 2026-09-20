import { Request, Response, NextFunction } from 'express';
import { centralPrisma } from '../../services/prisma/prismaClient';
import * as bcrypt from 'bcryptjs';

export default async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { email, password, role, roleId, firstName, lastName, phone, status } = req.body;
    const tenant = (req as any).tenant;

    const existingUser = await centralPrisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {
      email,
      firstName,
      lastName,
      phone,
      status,
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await centralPrisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    if (tenant && (role || roleId !== undefined)) {
      await centralPrisma.tenantUserAccess.updateMany({
        where: { userId: BigInt(id), tenantId: tenant.id },
        data: {
          ...(role ? { role } : {}),
          ...(roleId !== undefined ? { roleId: roleId ? BigInt(roleId) : null } : {}),
        },
      });
    }

    const responseData = {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      status: updatedUser.status,
      role,
      roleId: roleId?.toString(),
    };

    return res.status(200).json({
      message: 'User updated successfully',
      user: responseData,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}

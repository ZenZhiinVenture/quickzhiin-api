import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

interface RolePermissionRequest {
  roleId: number;
  permissionId: number;
  isCreate: boolean;
  isDelete: boolean;
}

export default async function updateRolePermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { rolePermissions } = req.body;

    const tenantId = Number(1);

    rolePermissions.map(async (data: RolePermissionRequest) => {
      if (data.isCreate) {
        await prisma.rolePermission.create({
          data: {
            roleId: data.roleId,
            permissionId: data.permissionId,
          },
        });
      }
      if (data.isDelete) {
        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId: data.roleId,
              permissionId: data.permissionId,
            },
          },
        });
      }
    });

    return res.status(200).json({
      message: 'Succesfully update',
    });
  } catch (err) {
    return next(err);
  }
}

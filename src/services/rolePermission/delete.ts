import { prisma } from '../prisma/prismaClient';

export default async function createRolePermission(
  roleId: number,
  permissionId: number) {
  try {
    return await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  } catch (err) {
    throw err;
  }
}

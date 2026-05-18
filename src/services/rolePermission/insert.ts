import { prisma } from '../prisma/prismaClient';

export default async function createRolePermission(
  roleId: number,
  permissionId: number) {
  try {
    return await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  } catch (err) {
    throw err;
  }
}

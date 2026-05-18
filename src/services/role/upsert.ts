import { Role } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertRole(
  userId: number,
  id: number | undefined,
  data: Role) {
  try {
    const now = new Date();
    return await prisma.role.upsert({
      where: {
        id: id,
      },
      create: {
        ...data,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
      },
      update: {
        updatedAt: now,
        updatedBy: userId,
      },
    });
  } catch (err) {
    throw err;
  }
}

import { Department } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertDepartment(
  userId: number,
  id: number | undefined,
  data: Department) {
  try {
    const now = new Date();
    return await prisma.department.upsert({
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

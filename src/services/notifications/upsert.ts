import { Notification } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertNotification(
  userId: number,
  id: number | undefined,
  data: Notification) {
  try {
    const now = new Date();
    return await prisma.notification.upsert({
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

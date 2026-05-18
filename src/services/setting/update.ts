import { Setting } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function update(
  userId: number,
  settings: Setting[]) {
  try {
    const now = new Date();

    return Promise.all(
      settings.map(async (data: Setting) => {
        return await prisma.setting.update({
          where: {
            key: data.key,
          },
          data: {
            value: data.value,
            isActive: data.isActive,
            updatedAt: now,
            updatedBy: userId,
          },
        });
      })
    );
  } catch (err) {
    throw err;
  }
}

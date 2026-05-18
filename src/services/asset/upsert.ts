import { Asset } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertAsset(
  userId: number,
  assetId: number | undefined,
  data: Asset) {
  try {
    const now = new Date();
    return await prisma.asset.upsert({
      where: {
        id: assetId,
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

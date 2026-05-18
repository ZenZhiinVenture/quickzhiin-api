import { accountSchema } from '../../schemas/account';
import { Account } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertAccount(
  data: Account,
  userId: number,
  accountId: number | undefined) {
  try {
    const now = new Date();
    const validateData = accountSchema.parse(data);

    return await prisma.account.upsert({
      where: {
        id: accountId ? BigInt(accountId) : 0n,
      },
      create: {
        code: validateData.code,
        name: validateData.name,
        type: validateData.type as any,
        subtype: validateData.subtype as any,
        description: validateData.description,
        isActive: validateData.isActive,
        isSystem: validateData.isSystem,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
      update: {
        code: validateData.code,
        name: validateData.name,
        type: validateData.type as any,
        subtype: validateData.subtype as any,
        description: validateData.description,
        isActive: validateData.isActive,
        isSystem: validateData.isSystem,
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });
  } catch (err) {
    throw err;
  }
}

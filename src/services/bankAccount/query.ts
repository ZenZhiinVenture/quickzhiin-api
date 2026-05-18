import { prisma } from '../prisma/prismaClient';

export async function getBankAccounts() {
  return await prisma.bankAccount.findMany({
    where: { isActive: true },
    include: {
      account: true,
      _count: {
        select: {
          transactions: true,
          reconciliations: true,
        },
      },
    },
  });
}

export async function getBankAccountById(id: number) {
  return await prisma.bankAccount.findFirst({
    where: { id: BigInt(id) },
    include: {
      account: true,
      reconciliations: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
      },
    },
  });
}

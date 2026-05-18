import { prisma } from '../prisma/prismaClient';
import { bankAccountSchema, BankAccountInput } from '../../schemas/bankAccount';

export async function upsertBankAccount(
  data: BankAccountInput,
  userId: number,
  bankAccountId?: number
) {
  const validateData = bankAccountSchema.parse(data);
  const now = new Date();

  return await prisma.bankAccount.upsert({
    where: {
      id: bankAccountId ? BigInt(bankAccountId) : 0n,
    },
    create: {
      name: validateData.name,
      bankName: validateData.bankName,
      accountNumber: validateData.accountNumber,
      currency: validateData.currency,
      balance: validateData.balance,
      accountId: validateData.accountId ? BigInt(validateData.accountId) : null,
      isActive: validateData.isActive,
      createdAt: now,
      createdBy: BigInt(userId),
      updatedAt: now,
      updatedBy: BigInt(userId),
    },
    update: {
      name: validateData.name,
      bankName: validateData.bankName,
      accountNumber: validateData.accountNumber,
      currency: validateData.currency,
      balance: validateData.balance,
      accountId: validateData.accountId ? BigInt(validateData.accountId) : null,
      isActive: validateData.isActive,
      updatedAt: now,
      updatedBy: BigInt(userId),
    },
  });
}

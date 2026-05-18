import { prisma } from '../prisma/prismaClient';
import { BankMatchInput, BankAdjustmentInput } from '../../schemas/bankReconciliation';
import { BankAccount, BankTransactionStatus, TransactionStatusType } from '@prisma/client';

export async function getUnmatchedBankTransactions(bankAccountId: number) {
  return await prisma.bankTransaction.findMany({
    where: {
      bankAccountId: BigInt(bankAccountId),
      status: BankTransactionStatus.PENDING,
    },
    orderBy: { date: 'asc' },
  });
}

export async function getUnmatchedLedgerTransactions(bankAccountId: number) {
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: BigInt(bankAccountId) },
    select: { accountId: true },
  });

  if (!bankAccount || !bankAccount.accountId) {
    throw new Error('Bank account is not linked to a General Ledger account');
  }

  // Find JournalEntryLines for this account that are NOT matched
  return await prisma.journalEntryLine.findMany({
    where: {
      accountId: bankAccount.accountId,
      matchedBankLines: {
        none: {}, // Not matched to any bank line
      },
      journalEntry: {
        status: 'READY', // Only posted entries
      }
    },
    include: {
      journalEntry: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function matchBankToLedger(
  data: BankMatchInput,
  userId: number
) {
  const { bankTransactionId, journalEntryLineIds, amount } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Create the matching records
    const matches = await Promise.all(journalEntryLineIds.map(lineId => 
      tx.bankTransactionLineMatched.create({
        data: {
          bankTransactionId: BigInt(bankTransactionId),
          journalEntryLineId: BigInt(lineId),
          amount: amount / journalEntryLineIds.length, // Simplified distribution
          createdBy: BigInt(userId),
        }
      })
    ));

    // 2. Update BankTransaction status to CLEARED/RECONCILED?
    // Let's use CLEARED for "Matched" and RECONCILED for when the period is closed.
    await tx.bankTransaction.update({
      where: { id: BigInt(bankTransactionId) },
      data: { status: BankTransactionStatus.CLEARED },
    });

    return matches;
  });
}

export async function createAdjustmentAndMatch(
  data: BankAdjustmentInput,
  userId: number
) {
  const { bankTransactionId, offsetAccountId, amount, description, date } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Get Bank Transaction details to find its linked BankAccount
    const bankTx = await tx.bankTransaction.findUnique({
      where: { id: BigInt(bankTransactionId) },
      include: { bankAccount: true },
    });

    if (!bankTx || !bankTx.bankAccount.accountId) {
      throw new Error('Bank account not found or not linked to General Ledger');
    }

    const bankAccountIdGL = bankTx.bankAccount.accountId;
    const now = new Date();

    // 2. Create the Journal Entry
    // We'll use a prefix for auto-generated adjustment numbers
    const journalNumber = `BA-${bankTransactionId}-${Date.now().toString().slice(-4)}`;

    const journalEntry = await tx.journalEntry.create({
      data: {
        number: journalNumber,
        date: new Date(date),
        narration: description,
        status: TransactionStatusType.READY,
        isActive: true,
        createdBy: BigInt(userId),
        updatedBy: BigInt(userId),
        createdAt: now,
        updatedAt: now,
      }
    });

    // 3. Create Journal Entry Lines
    // Line 1: The Bank Account Line
    // If it's a DEPOSIT (+) -> Debit Bank Account
    // If it's a WITHDRAWAL (-) -> Credit Bank Account
    const isDeposit = bankTx.type === 'DEPOSIT';
    const bankLine = await tx.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: bankAccountIdGL,
        description: description,
        debit: isDeposit ? amount : 0,
        credit: isDeposit ? 0 : amount,
        createdBy: BigInt(userId),
        updatedBy: BigInt(userId),
        isActive: true,
      }
    });

    // Line 2: The Offset Account Line
    // Inverse of the bank line
    await tx.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: BigInt(offsetAccountId),
        description: description,
        debit: isDeposit ? 0 : amount,
        credit: isDeposit ? amount : 0,
        createdBy: BigInt(userId),
        updatedBy: BigInt(userId),
        isActive: true,
      }
    });

    // 4. Create the Matching Record
    const match = await tx.bankTransactionLineMatched.create({
      data: {
        bankTransactionId: BigInt(bankTransactionId),
        journalEntryLineId: bankLine.id,
        amount: amount,
        createdBy: BigInt(userId),
      }
    });

    // 5. Update Bank Transaction status
    await tx.bankTransaction.update({
      where: { id: BigInt(bankTransactionId) },
      data: { status: BankTransactionStatus.CLEARED },
    });

    return { journalEntry, match };
  });
}

export async function unmatchBankTransaction(
  bankTransactionId: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete matching records
    await tx.bankTransactionLineMatched.deleteMany({
      where: { bankTransactionId: BigInt(bankTransactionId) },
    });

    // 2. Revert BankTransaction status
    await tx.bankTransaction.update({
      where: { id: BigInt(bankTransactionId) },
      data: { status: BankTransactionStatus.PENDING },
    });
  });
}

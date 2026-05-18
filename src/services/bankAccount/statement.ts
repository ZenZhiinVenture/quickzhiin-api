import { prisma } from '../prisma/prismaClient';
import { parse } from 'csv-parse/sync';
import { BankAccountInput } from '../../schemas/bankAccount';
import { BankTransactionType } from '@prisma/client';

interface CSVRow {
  Date: string;
  Description: string;
  Reference?: string;
  Amount: string;
  Type: string; // DEPOSIT or WITHDRAWAL
}

export async function processBankStatement(
  bankAccountId: number,
  fileContent: string,
  userId: number,
  fileName: string
) {
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const now = new Date();
  
  // Find period range from records
  const dates = records.map(r => new Date(r.Date)).filter(d => !isNaN(d.getTime()));
  const periodStart = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : now;
  const periodEnd = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : now;

  // Create the BankStatement record
  const statement = await prisma.bankStatement.create({
    data: {
      bankAccountId: BigInt(bankAccountId),
      fileName,
      periodStart,
      periodEnd,
      createdBy: BigInt(userId),
      updatedBy: BigInt(userId),
    }
  });

  // Create BankTransactions
  const transactions = await Promise.all(records.map(async (record) => {
    const amount = parseFloat(record.Amount.replace(/,/g, ''));
    const date = new Date(record.Date);
    
    return prisma.bankTransaction.create({
      data: {
        bankAccountId: BigInt(bankAccountId),
        bankStatementId: statement.id,
        date: isNaN(date.getTime()) ? now : date,
        amount: Math.abs(amount),
        type: amount >= 0 ? BankTransactionType.DEPOSIT : BankTransactionType.WITHDRAWAL,
        description: record.Description,
        reference: record.Reference || null,
        createdBy: BigInt(userId),
        updatedBy: BigInt(userId),
      }
    });
  }));

  return { statement, transactionCount: transactions.length };
}

export async function getBankStatements(bankAccountId: number) {
  return await prisma.bankStatement.findMany({
    where: { bankAccountId: BigInt(bankAccountId) },
    include: {
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

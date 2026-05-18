import { journalEntrySchema } from '../../schemas/journalEntry';
import { prisma } from '../prisma/prismaClient';

export default async function upsertJournalEntry(
  data: any,
  userId: number,
  journalEntryId: number | undefined) {
  try {
    const now = new Date();
    const validateData = journalEntrySchema.parse(data);

    // Validation: Debits must equal Credits
    const totalDebit = validateData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = validateData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error('Total debits must equal total credits');
    }

    return await prisma.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.upsert({
        where: {
          id: journalEntryId ? BigInt(journalEntryId) : 0n,
        },
        create: {
          number: validateData.number,
          date: new Date(validateData.date),
          reference: validateData.reference,
          narration: validateData.narration,
          status: validateData.status as any,
          isActive: true,
          createdAt: now,
          createdBy: BigInt(userId),
          updatedAt: now,
          updatedBy: BigInt(userId),
        },
        update: {
          number: validateData.number,
          date: new Date(validateData.date),
          reference: validateData.reference,
          narration: validateData.narration,
          status: validateData.status as any,
          updatedAt: now,
          updatedBy: BigInt(userId),
        },
      });

      // Clear existing lines if update
      if (journalEntryId) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: journalEntry.id },
        });
      }

      // Create lines
      for (const line of validateData.lines) {
        await tx.journalEntryLine.create({
          data: {
            journalEntryId: journalEntry.id,
            accountId: BigInt(line.accountId),
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            taxId: line.taxId ? BigInt(line.taxId) : null,
            isActive: true,
            createdAt: now,
            createdBy: BigInt(userId),
            updatedAt: now,
            updatedBy: BigInt(userId),
          },
        });
      }

      return journalEntry;
    });
  } catch (err) {
    throw err;
  }
}

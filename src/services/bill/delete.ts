
/**
 * Service to thoroughly delete a Bill and safely reverse its accounting impact
 * by deleting the associated Journal Entry and Lines within a transaction.
 */
export async function deleteBill(prisma: any, billId: number | bigint) {
  const billIdBigInt = BigInt(billId);

  // 1. Fetch the bill to get its number for the Journal Entry lookup
  const bill = await prisma.bill.findUnique({
    where: { id: billIdBigInt },
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  // Define the exact journal reference
  const journalNumber = `JRN-BIL-${bill.number}`;

  // 2. Perform the deletion inside a managed transaction to ensure we don't end up
  //    with orphaned lines or phantom balances if the database errors midway.
  await prisma.$transaction(async (prisma: any) => {
    // Find the associated Journal Entry
    const journalEntry = await prisma.journalEntry.findUnique({
      where: { number: journalNumber },
    });

    if (journalEntry) {
      // Clean up ledger footprint: delete lines then entry
      await prisma.journalEntryLine.deleteMany({
        where: { journalEntryId: journalEntry.id },
      });
      await prisma.journalEntry.delete({
        where: { id: journalEntry.id },
      });
    }

    // Clean up bill footprint
    await prisma.billLine.deleteMany({
      where: { billId: billIdBigInt },
    });

    // Delete Bill
    await prisma.bill.delete({
      where: { id: billIdBigInt },
    });
  });

  return { success: true, message: 'Bill and corresponding journal entry successfully deleted.' };
}

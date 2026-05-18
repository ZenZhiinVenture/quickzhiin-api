
/**
 * Service to thoroughly delete an Invoice and safely reverse its accounting impact
 * by deleting the associated Journal Entry and Lines within a transaction.
 */
export async function deleteInvoice(prisma: any, invoiceId: number | bigint) {
  const invoiceIdBigInt = BigInt(invoiceId);

  // 1. Fetch the invoice to get its number for the Journal Entry lookup
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceIdBigInt },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Define the exact journal reference
  const journalNumber = `JRN-INV-${invoice.number}`;

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

    // Clean up invoice footprint
    await prisma.invoiceLine.deleteMany({
      where: { invoiceId: invoiceIdBigInt },
    });

    // Delete Invoice
    await prisma.invoice.delete({
      where: { id: invoiceIdBigInt },
    });
  });

  return { success: true, message: 'Invoice and corresponding journal entry successfully deleted.' };
}

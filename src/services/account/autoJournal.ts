
/**
 * Automated Accounting Utility
 * Generates and synchronizes JournalEntries for business transactions.
 */
export const autoJournal = {
  /**
   * Synchronize Journal Entry for a Purchase Bill
   */
  async syncBillJournal(prisma: any, bill: any, userId: number | bigint) {
    const now = new Date();
    
    const journalEntry = await prisma.journalEntry.upsert({
      where: {
        number: `JRN-BIL-${bill.number}`,
      },
      update: {
        date: bill.date,
        narration: `Automated journal for Bill ${bill.number}`,
        status: 'READY',
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
      create: {
        number: `JRN-BIL-${bill.number}`,
        date: bill.date,
        reference: bill.number,
        narration: `Automated journal for Bill ${bill.number}`,
        status: 'READY',
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: journalEntry.id },
    });

    // Multi-Currency: Convert to base currency using transaction exchange rate
    const rate = Number(bill.exchangeRate) || 1.0;
    const baseTotal = Number((Number(bill.total) * rate).toFixed(2));
    const baseSubtotal = Number((Number(bill.subtotal) * rate).toFixed(2));
    const baseTax = Number((Number(bill.tax) * rate).toFixed(2));
    const roundingValue = Number((Number(bill.rounding || 0) * rate).toFixed(2));

    // Preparing balanced lines for Bill (Purchase)
    // Line 1: Credit Accounts Payable (Total Base Amount)
    const apAccount = await this.getAccountByCode(prisma, '2100', 'Accounts Payable', 'LIABILITY');
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: apAccount.id,
        description: `Bill ${bill.number} - ${bill.customer?.firstName || 'Supplier'}`,
        debit: 0,
        credit: baseTotal,
        currency: bill.currency || 'MYR',
        foreignAmount: Number(bill.total),
        exchangeRate: rate,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // Line 2: Debit Purchase Expense (Subtotal Base Amount)
    const expenseAccount = await this.getAccountByCode(prisma, '5000', 'Purchases', 'EXPENSE');
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: expenseAccount.id,
        description: `Purchases from Bill ${bill.number}`,
        debit: baseSubtotal,
        credit: 0,
        currency: bill.currency || 'MYR',
        foreignAmount: Number(bill.subtotal),
        exchangeRate: rate,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // Line 3: Debit Tax Receivable (Input Tax, if any)
    if (baseTax > 0) {
      const taxAccount = await this.getAccountByCode(prisma, '1310', 'Tax Receivable', 'ASSET');
      await prisma.journalEntryLine.create({
        data: {
          journalEntryId: journalEntry.id,
          accountId: taxAccount.id,
          description: `Tax claimable from Bill ${bill.number}`,
          debit: baseTax,
          credit: 0,
          currency: bill.currency || 'MYR',
          foreignAmount: Number(bill.tax),
          exchangeRate: rate,
          isActive: true,
          createdAt: now,
          createdBy: BigInt(userId),
          updatedAt: now,
          updatedBy: BigInt(userId),
        },
      });
    }

    // Line 4: Rounding Adjustment (if any)
    if (roundingValue !== 0) {
      const roundingAccount = await this.getAccountByCode(prisma, '8500', 'Rounding Adjustment', 'EXPENSE');
      await prisma.journalEntryLine.create({
        data: {
          journalEntryId: journalEntry.id,
          accountId: roundingAccount.id,
          description: `Rounding adjustment for Bill ${bill.number}`,
          debit: roundingValue > 0 ? roundingValue : 0,
          credit: roundingValue < 0 ? Math.abs(roundingValue) : 0,
          currency: bill.currency || 'MYR',
          foreignAmount: Number(bill.rounding || 0),
          exchangeRate: rate,
          isActive: true,
          createdAt: now,
          createdBy: BigInt(userId),
          updatedAt: now,
          updatedBy: BigInt(userId),
        },
      });
    }

    return journalEntry;
  },

  /**
   * Synchronize Journal Entry for a Sales Invoice
   */
  async syncInvoiceJournal(prisma: any, invoice: any, userId: number | bigint) {
    const now = new Date();
    
    // 1. Find or create the corresponding Journal Entry
    // We use a reference like 'INV-000001' to uniquely identify the source
    const journalEntry = await prisma.journalEntry.upsert({
      where: {
        number: `JRN-INV-${invoice.number}`,
      },
      update: {
        date: invoice.date,
        narration: `Automated journal for Invoice ${invoice.number}`,
        status: 'READY',
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
      create: {
        number: `JRN-INV-${invoice.number}`,
        date: invoice.date,
        reference: invoice.number,
        narration: `Automated journal for Invoice ${invoice.number}`,
        status: 'READY',
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // 2. Clear old lines for this journal (to handle updates)
    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: journalEntry.id },
    });

    // Multi-Currency: Convert to base currency using transaction exchange rate
    const rate = Number(invoice.exchangeRate) || 1.0;
    const baseTotal = Number((Number(invoice.total) * rate).toFixed(2));
    const baseSubtotal = Number((Number(invoice.subtotal) * rate).toFixed(2));
    const baseTax = Number((Number(invoice.tax) * rate).toFixed(2));
    const roundingValue = Number((Number(invoice.rounding || 0) * rate).toFixed(2));

    // 3. Prepare balanced lines
    // Line 1: Debit Accounts Receivable (Total Base Amount)
    const arAccount = await this.getAccountByCode(prisma, '1200', 'Accounts Receivable', 'ASSET');
    
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: arAccount.id,
        description: `Invoice ${invoice.number} - ${invoice.customer?.legalname || 'Customer'}`,
        debit: baseTotal,
        credit: 0,
        currency: invoice.currency || 'MYR',
        foreignAmount: Number(invoice.total),
        exchangeRate: rate,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // Line 2: Credit Sales Revenue (Subtotal Base Amount)
    const salesAccount = await this.getAccountByCode(prisma, '4000', 'Sales Revenue', 'REVENUE');
    
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: salesAccount.id,
        description: `Sales from Invoice ${invoice.number}`,
        debit: 0,
        credit: baseSubtotal,
        currency: invoice.currency || 'MYR',
        foreignAmount: Number(invoice.subtotal),
        exchangeRate: rate,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // Line 3: Credit Tax Payable (Tax Amount, if any)
    if (baseTax > 0) {
      const taxAccount = await this.getAccountByCode(prisma, '2200', 'Tax Payable', 'LIABILITY');
      await prisma.journalEntryLine.create({
        data: {
          journalEntryId: journalEntry.id,
          accountId: taxAccount.id,
          description: `Tax from Invoice ${invoice.number}`,
          debit: 0,
          credit: baseTax,
          currency: invoice.currency || 'MYR',
          foreignAmount: Number(invoice.tax),
          exchangeRate: rate,
          isActive: true,
          createdAt: now,
          createdBy: BigInt(userId),
          updatedAt: now,
          updatedBy: BigInt(userId),
        },
      });
    }

    // Line 4: Rounding Adjustment (if any)
    if (roundingValue !== 0) {
      const roundingAccount = await this.getAccountByCode(prisma, '8500', 'Rounding Adjustment', 'REVENUE');
      await prisma.journalEntryLine.create({
        data: {
          journalEntryId: journalEntry.id,
          accountId: roundingAccount.id,
          description: `Rounding adjustment for Invoice ${invoice.number}`,
          debit: roundingValue < 0 ? Math.abs(roundingValue) : 0,
          credit: roundingValue > 0 ? roundingValue : 0,
          currency: invoice.currency || 'MYR',
          foreignAmount: Number(invoice.rounding || 0),
          exchangeRate: rate,
          isActive: true,
          createdAt: now,
          createdBy: BigInt(userId),
          updatedAt: now,
          updatedBy: BigInt(userId),
        },
      });
    }

    return journalEntry;
  },

  /**
   * Synchronize Journal Entry for an Invoice Payment
   */
  async syncInvoicePaymentJournal(prisma: any, payment: any, invoice: any, userId: number | bigint) {
    const now = new Date();
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: payment.methodId },
      include: { account: true },
    });

    const journalEntry = await prisma.journalEntry.upsert({
      where: {
        number: `JRN-PAY-INV-${payment.id}`,
      },
      update: {
        date: payment.paidAt,
        narration: `Payment for Invoice ${invoice.number} via ${paymentMethod?.name || 'Manual'}`,
        status: 'READY',
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
      create: {
        number: `JRN-PAY-INV-${payment.id}`,
        date: payment.paidAt,
        reference: invoice.number,
        narration: `Payment for Invoice ${invoice.number} via ${paymentMethod?.name || 'Manual'}`,
        status: 'READY',
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: journalEntry.id },
    });

    // Debit: Bank/Cash Account
    const bankAccount = paymentMethod?.account || await this.getAccountByCode(prisma, '1000', 'Bank/Cash', 'ASSET');
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: bankAccount.id,
        description: `Payment received for Invoice ${invoice.number}`,
        debit: payment.amount,
        credit: 0,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // Credit: Accounts Receivable
    const arAccount = await this.getAccountByCode(prisma, '1200', 'Accounts Receivable', 'ASSET');
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: arAccount.id,
        description: `Accounts Receivable cleared for Invoice ${invoice.number}`,
        debit: 0,
        credit: payment.amount,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    return journalEntry;
  },

  /**
   * Synchronize Journal Entry for a Bill Payment
   */
  async syncBillPaymentJournal(prisma: any, payment: any, bill: any, userId: number | bigint) {
    const now = new Date();
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: payment.methodId },
      include: { account: true },
    });

    const journalEntry = await prisma.journalEntry.upsert({
      where: {
        number: `JRN-PAY-BIL-${payment.id}`,
      },
      update: {
        date: payment.paidAt,
        narration: `Payment for Bill ${bill.number} via ${paymentMethod?.name || 'Manual'}`,
        status: 'READY',
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
      create: {
        number: `JRN-PAY-BIL-${payment.id}`,
        date: payment.paidAt,
        reference: bill.number,
        narration: `Payment for Bill ${bill.number} via ${paymentMethod?.name || 'Manual'}`,
        status: 'READY',
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: journalEntry.id },
    });

    // Debit: Accounts Payable
    const apAccount = await this.getAccountByCode(prisma, '2100', 'Accounts Payable', 'LIABILITY');
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: apAccount.id,
        description: `Accounts Payable cleared for Bill ${bill.number}`,
        debit: payment.amount,
        credit: 0,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    // Credit: Bank/Cash Account
    const bankAccount = paymentMethod?.account || await this.getAccountByCode(prisma, '1000', 'Bank/Cash', 'ASSET');
    await prisma.journalEntryLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: bankAccount.id,
        description: `Payment made for Bill ${bill.number}`,
        debit: 0,
        credit: payment.amount,
        isActive: true,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });

    return journalEntry;
  },

  /**
   * Helper to get or create a system account by code
   */
  async getAccountByCode(prisma: any, code: string, name: string, type: string) {
    let account = await prisma.account.findUnique({
      where: { code },
    });

    if (!account) {
      account = await prisma.account.create({
        data: {
          code,
          name,
          type,
          isSystem: true,
          isActive: true,
          createdBy: 1n,
          updatedBy: 1n,
        },
      });
    }

    return account;
  },
};

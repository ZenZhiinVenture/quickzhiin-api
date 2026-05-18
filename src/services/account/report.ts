
/**
 * Reporting Service
 * Generates financial reports by aggregating JournalEntryLines.
 */
export const reportingService = {
  /**
   * Profit & Loss (P/L) Report
   * Aggregates Revenue and Expenses over a date range.
   */
  async getProfitAndLoss(prisma: any, startDate: Date, endDate: Date) {
    // 1. Fetch Revenue Accounts and their balances
    const revenueLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          date: { gte: startDate, lte: endDate },
          status: 'READY',
          isActive: true
        },
        account: { type: 'REVENUE' },
        isActive: true
      },
      include: { account: true }
    });

    // 2. Fetch Expense Accounts and their balances
    const expenseLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          date: { gte: startDate, lte: endDate },
          status: 'READY',
          isActive: true
        },
        account: { type: 'EXPENSE' },
        isActive: true
      },
      include: { account: true }
    });

    // 3. Aggregate Revenue
    const revenueMap: Record<string, { code: string; name: string; amount: number }> = {};
    let totalRevenue = 0;
    revenueLines.forEach((line: any) => {
        const amount = Number(line.credit) - Number(line.debit);
        if (!revenueMap[line.account.code]) {
            revenueMap[line.account.code] = { code: line.account.code, name: line.account.name, amount: 0 };
        }
        revenueMap[line.account.code].amount += amount;
        totalRevenue += amount;
    });

    // 4. Aggregate Expenses
    const expenseMap: Record<string, { code: string; name: string; amount: number }> = {};
    let totalExpenses = 0;
    expenseLines.forEach((line: any) => {
        const amount = Number(line.debit) - Number(line.credit);
        if (!expenseMap[line.account.code]) {
            expenseMap[line.account.code] = { code: line.account.code, name: line.account.name, amount: 0 };
        }
        expenseMap[line.account.code].amount += amount;
        totalExpenses += amount;
    });

    return {
      revenue: Object.values(revenueMap),
      expenses: Object.values(expenseMap),
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      startDate,
      endDate
    };
  },

  /**
   * Balance Sheet Report
   * As of a specific date (cumulative).
   */
  async getBalanceSheet(prisma: any, date: Date) {
    // 1. Fetch ALL lines up to date
    const allLines = await prisma.journalEntryLine.findMany({
        where: {
            journalEntry: {
                date: { lte: date },
                status: 'READY',
                isActive: true
            },
            isActive: true
        },
        include: { account: true }
    });

    // 2. Aggregate by Type
    const assets: Record<string, { code: string; name: string; amount: number }> = {};
    const liabilities: Record<string, { code: string; name: string; amount: number }> = {};
    const equity: Record<string, { code: string; name: string; amount: number }> = {};

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    allLines.forEach((line: any) => {
        const type = line.account.type;
        const code = line.account.code;
        const name = line.account.name;

        if (type === 'ASSET') {
            const val = Number(line.debit) - Number(line.credit);
            if (!assets[code]) assets[code] = { code, name, amount: 0 };
            assets[code].amount += val;
            totalAssets += val;
        } else if (type === 'LIABILITY') {
            const val = Number(line.credit) - Number(line.debit);
            if (!liabilities[code]) liabilities[code] = { code, name, amount: 0 };
            liabilities[code].amount += val;
            totalLiabilities += val;
        } else if (type === 'EQUITY') {
            const val = Number(line.credit) - Number(line.debit);
            if (!equity[code]) equity[code] = { code, name, amount: 0 };
            equity[code].amount += val;
            totalEquity += val;
        }
    });

    // 3. We must inject the Net Profit from P&L (Retained Earnings)
    // Start of year to current date
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pl = await this.getProfitAndLoss(prisma, startOfYear, date);
    
    totalEquity += pl.netProfit;

    return {
      assets: Object.values(assets),
      liabilities: Object.values(liabilities),
      equity: Object.values(equity),
      currentYearEarnings: pl.netProfit,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      date
    };
  },

  /**
   * General Ledger (GL) Report
   * Detailed transaction list by account over a period.
   */
  async getGeneralLedger(prisma: any, startDate: Date, endDate: Date) {
    const startOfYear = new Date(startDate.getFullYear(), 0, 1);
    
    // 1. Fetch all accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });

    const reportData = [];

    for (const account of accounts) {
      // 2. Calculate Opening Balance
      // Balance Sheet accounts: Cumulative from beginning
      // P/L accounts: Cumulative from start of fiscal year
      const isBalanceSheet = ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type);
      const openingBalanceDate = isBalanceSheet ? new Date(0) : startOfYear;

      const openingLines = await prisma.journalEntryLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            date: { gte: openingBalanceDate, lt: startDate },
            status: 'READY'
          },
          isActive: true
        }
      });

      let openingBalance = 0;
      openingLines.forEach((line: any) => {
        const debit = Number(line.debit);
        const credit = Number(line.credit);
        
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          openingBalance += (debit - credit);
        } else {
          openingBalance += (credit - debit);
        }
      });

      // 3. Fetch Transactions in range
      const periodLines = await prisma.journalEntryLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            date: { gte: startDate, lte: endDate },
            status: 'READY'
          },
          isActive: true
        },
        include: {
          journalEntry: true
        },
        orderBy: {
          journalEntry: { date: 'asc' }
        }
      });

      // 4. Map lines and calculate running balance
      let totalDebit = 0;
      let totalCredit = 0;
      let runningBalance = openingBalance;

      const lines = periodLines.map((line: any) => {
        const debit = Number(line.debit);
        const credit = Number(line.credit);
        totalDebit += debit;
        totalCredit += credit;

        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          runningBalance += (debit - credit);
        } else {
          runningBalance += (credit - debit);
        }

        return {
          id: line.id.toString(),
          date: line.journalEntry.date,
          number: line.journalEntry.number,
          reference: line.journalEntry.reference,
          description: line.description || line.journalEntry.narration,
          debit,
          credit,
          balance: runningBalance
        };
      });

      // 5. Add to report if there's an opening balance or transactions
      if (openingBalance !== 0 || lines.length > 0) {
        reportData.push({
          id: account.id.toString(),
          code: account.code,
          name: account.name,
          type: account.type,
          openingBalance,
          closingBalance: runningBalance,
          totalDebit,
          totalCredit,
          lines
        });
      }
    }

    return {
      startDate,
      endDate,
      accounts: reportData
    };
  },

  /**
   * Trial Balance Report
   * Summary of all account balances (Debit vs. Credit) as of a date.
   */
  async getTrialBalance(prisma: any, date: Date) {
    // 1. Fetch all accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });

    // 2. Fetch all lines up to date
    const allLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          date: { lte: date },
          status: 'READY'
        },
        isActive: true
      }
    });

    // 3. Aggregate balances by accountId
    const balanceMap: Record<string, number> = {};
    allLines.forEach((line: any) => {
      const accountId = line.accountId.toString();
      const val = Number(line.debit) - Number(line.credit);
      balanceMap[accountId] = (balanceMap[accountId] || 0) + val;
    });

    // 4. Map into Trial Balance format
    const reportData = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const account of accounts) {
      const balance = balanceMap[account.id.toString()] || 0;
      
      if (balance === 0) continue;

      let debit = 0;
      let credit = 0;

      if (balance > 0) {
        debit = balance;
        totalDebit += debit;
      } else {
        credit = Math.abs(balance);
        totalCredit += credit;
      }

      reportData.push({
        id: account.id.toString(),
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit
      });
    }

    return {
      date,
      accounts: reportData,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  }
};

import { reportingService } from './report';

describe('ReportingService - Financial Reports Engine', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      journalEntryLine: {
        findMany: jest.fn(),
      },
      account: {
        findMany: jest.fn(),
      },
    };
  });

  describe('getTrialBalance', () => {
    it('should aggregate accounts and verify debit equals credit when balanced', async () => {
      const mockAccounts = [
        { id: BigInt(1), code: '1000', name: 'Cash', type: 'ASSET', isActive: true },
        { id: BigInt(2), code: '2000', name: 'Accounts Payable', type: 'LIABILITY', isActive: true },
      ];
      mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

      const mockLines = [
        { accountId: BigInt(1), debit: 5000, credit: 0 },
        { accountId: BigInt(2), debit: 0, credit: 5000 },
      ];
      mockPrisma.journalEntryLine.findMany.mockResolvedValue(mockLines);

      const result = await reportingService.getTrialBalance(mockPrisma, new Date('2025-12-31'));

      expect(result.totalDebit).toBe(5000);
      expect(result.totalCredit).toBe(5000);
      expect(result.isBalanced).toBe(true);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0]).toEqual({
        id: '1',
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        debit: 5000,
        credit: 0,
      });
      expect(result.accounts[1]).toEqual({
        id: '2',
        code: '2000',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        debit: 0,
        credit: 5000,
      });
    });

    it('should flag isBalanced as false when debits do not equal credits', async () => {
      const mockAccounts = [
        { id: BigInt(1), code: '1000', name: 'Cash', type: 'ASSET', isActive: true },
      ];
      mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

      const mockLines = [
        { accountId: BigInt(1), debit: 1000, credit: 0 },
      ];
      mockPrisma.journalEntryLine.findMany.mockResolvedValue(mockLines);

      const result = await reportingService.getTrialBalance(mockPrisma, new Date('2025-12-31'));

      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(0);
      expect(result.isBalanced).toBe(false);
    });
  });

  describe('getProfitAndLoss', () => {
    it('should aggregate revenue and expenses, computing correct net profit', async () => {
      const revenueLines = [
        {
          accountId: BigInt(10),
          debit: 0,
          credit: 10000,
          account: { id: '10', code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
        },
        {
          accountId: BigInt(11),
          debit: 200,
          credit: 1200,
          account: { id: '11', code: '4100', name: 'Consulting Income', type: 'REVENUE' },
        },
      ];

      const expenseLines = [
        {
          accountId: BigInt(20),
          debit: 3000,
          credit: 0,
          account: { id: '20', code: '5000', name: 'Rent Expense', type: 'EXPENSE' },
        },
        {
          accountId: BigInt(21),
          debit: 1500,
          credit: 100,
          account: { id: '21', code: '5100', name: 'Utilities', type: 'EXPENSE' },
        },
      ];

      mockPrisma.journalEntryLine.findMany
        .mockResolvedValueOnce(revenueLines)
        .mockResolvedValueOnce(expenseLines);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const result = await reportingService.getProfitAndLoss(mockPrisma, startDate, endDate);

      expect(result.totalRevenue).toBe(11000); // 10000 + (1200 - 200)
      expect(result.totalExpenses).toBe(4400); // 3000 + (1500 - 100)
      expect(result.netProfit).toBe(6600); // 11000 - 4400
      expect(result.revenue).toHaveLength(2);
      expect(result.expenses).toHaveLength(2);
    });
  });

  describe('getBalanceSheet', () => {
    it('should compute Assets = Liabilities + Equity including net income from P&L', async () => {
      const asOfDate = new Date('2025-12-31');

      // 1. Balance sheet lines
      const bsLines = [
        {
          accountId: BigInt(1),
          debit: 15000,
          credit: 0,
          account: { id: '1', code: '1000', name: 'Cash', type: 'ASSET' },
        },
        {
          accountId: BigInt(2),
          debit: 0,
          credit: 5000,
          account: { id: '2', code: '2000', name: 'Bank Loan', type: 'LIABILITY' },
        },
        {
          accountId: BigInt(3),
          debit: 0,
          credit: 7000,
          account: { id: '3', code: '3000', name: 'Owner Equity', type: 'EQUITY' },
        },
      ];

      // 2. Lines for the nested getProfitAndLoss call (startOfYear to asOfDate)
      const revenueLines = [
        {
          accountId: BigInt(10),
          debit: 0,
          credit: 5000,
          account: { id: '10', code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
        },
      ];
      const expenseLines = [
        {
          accountId: BigInt(20),
          debit: 2000,
          credit: 0,
          account: { id: '20', code: '5000', name: 'Rent', type: 'EXPENSE' },
        },
      ];

      mockPrisma.journalEntryLine.findMany
        .mockResolvedValueOnce(bsLines) // for allLines in getBalanceSheet
        .mockResolvedValueOnce(revenueLines) // for getProfitAndLoss revenue
        .mockResolvedValueOnce(expenseLines); // for getProfitAndLoss expense

      const result = await reportingService.getBalanceSheet(mockPrisma, asOfDate);

      // Total Assets = 15000
      // Total Liabilities = 5000
      // Owner Equity = 7000
      // Net Income = 5000 - 2000 = 3000
      // Total Equity = 7000 + 3000 = 10000
      // Total Liabilities + Total Equity = 5000 + 10000 = 15000 == Total Assets
      expect(result.totalAssets).toBe(15000);
      expect(result.totalLiabilities).toBe(5000);
      expect(result.netIncome).toBe(3000);
      expect(result.totalEquity).toBe(10000);
      expect(result.balanceCheck).toBe(true);
    });
  });
});

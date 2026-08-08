import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'SUMMARY';
    // BUG-012 FIX: Support date range filtering to avoid loading all records
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
    const dateFilter = fromDate || toDate
      ? { gte: fromDate, lte: toDate }
      : undefined;

    // BUG-012 FIX: Use aggregation queries instead of loading all records into memory
    const [
      loanSummary,
      collectionSummary,
      incomeSummary,
      expenseSummary,
      bankAccounts,
      cashAccount,
    ] = await Promise.all([
      db.loan.aggregate({
        _sum: { principalAmount: true, outstandingBalance: true },
        _count: { id: true },
        where: { status: { not: 'PENDING' } },
      }),
      db.collection.aggregate({
        _sum: { amountReceived: true, interestPaid: true, principalPaid: true },
        where: dateFilter ? { collectionDate: dateFilter } : undefined,
      }),
      db.income.aggregate({
        _sum: { amount: true },
        where: dateFilter ? { date: dateFilter } : undefined,
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: dateFilter ? { date: dateFilter } : undefined,
      }),
      db.bankAccount.findMany({ select: { id: true, accountName: true, bankName: true, currentBalance: true, branch: true } }),
      db.cashAccount.findUnique({ where: { id: 'cash-master' } }),
    ]);

    const totalDisbursed = loanSummary._sum.principalAmount || 0;
    const totalOutstanding = loanSummary._sum.outstandingBalance || 0;
    const totalCollections = collectionSummary._sum.amountReceived || 0;
    const totalInterestCollected = collectionSummary._sum.interestPaid || 0;
    const totalIncome = (incomeSummary._sum.amount || 0) + totalInterestCollected;
    const totalExpense = expenseSummary._sum.amount || 0;
    const netProfit = totalIncome - totalExpense;
    const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
    const cashInHand = cashAccount?.currentBalance || 0;

    // For detailed views, load paginated records
    let loans: any[] = [];
    let collections: any[] = [];
    let ledgerEntries: any[] = [];
    let incomes: any[] = [];
    let expenses: any[] = [];

    if (reportType === 'LOAN_OUTSTANDING') {
      loans = await db.loan.findMany({
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: { customer: { select: { name: true, mobile: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    } else if (reportType === 'DAY_BOOK' || reportType === 'CASH_BOOK' || reportType === 'BANK_BOOK') {
      const ledgerWhere: any = {};
      if (reportType === 'CASH_BOOK') ledgerWhere.isCash = true;
      if (reportType === 'BANK_BOOK') ledgerWhere.bankAccountId = { not: null };
      if (dateFilter) ledgerWhere.date = dateFilter;

      ledgerEntries = await db.ledgerEntry.findMany({
        where: ledgerWhere,
        orderBy: { date: 'desc' },
        take: 500,
      });
    } else if (reportType === 'PROFIT_LOSS') {
      incomes = await db.income.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
        take: 200,
      });
      expenses = await db.expense.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
        take: 200,
      });
    }

    return NextResponse.json({
      summary: {
        totalDisbursed,
        totalOutstanding,
        totalCollections,
        totalInterestCollected,
        totalIncome,
        totalExpense,
        netProfit,
        totalBankBalance,
        cashInHand,
        totalAssets: totalOutstanding + totalBankBalance + cashInHand,
        loanCount: loanSummary._count.id,
      },
      bankAccounts,
      cashInHand,
      loans,
      collections,
      ledgerEntries,
      incomes,
      expenses,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

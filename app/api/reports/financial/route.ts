import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'SUMMARY';

    const loans = await db.loan.findMany({ include: { customer: true } });
    const collections = await db.collection.findMany({ include: { customer: true, loan: true } });
    const ledgerEntries = await db.ledgerEntry.findMany({ orderBy: { date: 'desc' } });
    const bankAccounts = await db.bankAccount.findMany();
    const cashAccount = await db.cashAccount.findUnique({ where: { id: 'cash-master' } });
    const incomes = await db.income.findMany();
    const expenses = await db.expense.findMany();

    const totalDisbursed = loans.reduce((sum, l) => sum + (l.status !== 'PENDING' ? l.principalAmount : 0), 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.status === 'ACTIVE' || l.status === 'OVERDUE' ? l.outstandingBalance : 0), 0);
    const totalCollections = collections.reduce((sum, c) => sum + c.amountReceived, 0);
    const totalInterestCollected = collections.reduce((sum, c) => sum + c.interestPaid, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0) + totalInterestCollected;
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
    const cashInHand = cashAccount?.currentBalance || 0;

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
        totalAssetValue: totalOutstanding + totalBankBalance + cashInHand,
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    const activeLoans = await prisma.loan.findMany({
      where: { status: { in: ['ACTIVE', 'DISBURSED', 'OVERDUE'] } },
      include: { collections: true },
    });

    let totalPortfolioValue = 0;
    let totalOutstandingBalance = 0;
    let totalInterestIncome = 0;
    let totalPenaltiesCollected = 0;

    activeLoans.forEach((loan) => {
      totalPortfolioValue += loan.principalAmount;
      totalOutstandingBalance += loan.outstandingBalance;

      loan.collections.forEach((c) => {
        totalInterestIncome += c.interestPaid;
        totalPenaltiesCollected += c.penaltyPaid;
      });
    });

    const directIncome = await prisma.income.aggregate({
      _sum: { amount: true },
    });
    const directExpense = await prisma.expense.aggregate({
      _sum: { amount: true },
    });

    const totalIncome = totalInterestIncome + (directIncome._sum.amount || 0) + totalPenaltiesCollected;
    const totalExpense = directExpense._sum.amount || 0;
    const netProfit = totalIncome - totalExpense;
    const netProfitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

    const overdueCount = activeLoans.filter((l) => l.status === 'OVERDUE' || l.npaCategory !== 'STANDARD').length;
    const collectionEfficiency =
      totalPortfolioValue > 0
        ? (((totalPortfolioValue - totalOutstandingBalance) / totalPortfolioValue) * 100).toFixed(1)
        : '100.0';

    // Simulated 6-month growth forecasting based on current active portfolio yield
    const averageMonthlyInterest = totalInterestIncome / 6 || totalPortfolioValue * 0.01;
    const forecasting = [
      { month: 'Month 1', expectedCollection: Math.round(totalOutstandingBalance * 0.15 + averageMonthlyInterest) },
      { month: 'Month 2', expectedCollection: Math.round(totalOutstandingBalance * 0.18 + averageMonthlyInterest) },
      { month: 'Month 3', expectedCollection: Math.round(totalOutstandingBalance * 0.20 + averageMonthlyInterest) },
      { month: 'Month 4', expectedCollection: Math.round(totalOutstandingBalance * 0.22 + averageMonthlyInterest) },
      { month: 'Month 5', expectedCollection: Math.round(totalOutstandingBalance * 0.24 + averageMonthlyInterest) },
      { month: 'Month 6', expectedCollection: Math.round(totalOutstandingBalance * 0.25 + averageMonthlyInterest) },
    ];

    return NextResponse.json({
      success: true,
      kpis: {
        totalCustomers,
        totalActiveLoans: activeLoans.length,
        totalPortfolioValue,
        totalOutstandingBalance,
        totalIncome,
        totalExpense,
        netProfit,
        netProfitMargin,
        overdueCount,
        collectionEfficiency,
      },
      forecasting,
    });
  } catch (error: any) {
    console.error('BI API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

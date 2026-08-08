import React from 'react';
import { db } from '@/lib/db';
import { StatCards } from '@/components/dashboard/StatCards';
import { FinancialCharts } from '@/components/dashboard/FinancialCharts';
import { CreditCard, Users, ArrowUpRight, ArrowDownRight, Plus, Receipt, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const [
    totalCustomers,
    activeLoansCount,
    closedLoansCount,
    pendingLoansCount,
    overdueLoansCount,
    loans,
    collections,
    cashAccount,
    bankAccounts,
    incomes,
    expenses,
    mortgageDetails,
  ] = await Promise.all([
    db.customer.count(),
    db.loan.count({ where: { status: 'ACTIVE' } }),
    db.loan.count({ where: { status: 'CLOSED' } }),
    db.loan.count({ where: { status: 'PENDING' } }),
    db.loan.count({ where: { status: 'OVERDUE' } }),
    db.loan.findMany({ select: { outstandingBalance: true, principalAmount: true, status: true } }),
    db.collection.findMany({ select: { amountReceived: true, collectionDate: true, interestPaid: true } }),
    db.cashAccount.findUnique({ where: { id: 'cash-master' } }),
    db.bankAccount.findMany({ select: { currentBalance: true } }),
    db.income.findMany({ select: { amount: true } }),
    db.expense.findMany({ select: { amount: true } }),
    db.mortgageDetail.findMany({ select: { estimatedValue: true } }),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollection = collections
    .filter((c) => c.collectionDate.toISOString().split('T')[0] === todayStr)
    .reduce((sum, c) => sum + c.amountReceived, 0);

  const monthlyCollection = collections.reduce((sum, c) => sum + c.amountReceived, 0);
  const totalOutstanding = loans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
    .reduce((sum, l) => sum + l.outstandingBalance, 0);

  const totalMortgageValue = mortgageDetails.reduce((sum, m) => sum + m.estimatedValue, 0);
  const cashInHand = cashAccount?.currentBalance || 0;
  const bankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const interestCollected = collections.reduce((sum, c) => sum + c.interestPaid, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0) + interestCollected;
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const stats = {
    totalCustomers,
    activeLoans: activeLoansCount,
    closedLoans: closedLoansCount,
    pendingLoans: pendingLoansCount,
    overdueLoans: overdueLoansCount,
    todayCollection,
    monthlyCollection,
    totalOutstanding,
    totalMortgageValue,
    cashInHand,
    bankBalance,
    totalIncome,
    totalExpense,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Real-Time Accounting Ledger Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Financial Dashboard Overview
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Monitor real-time NBFC loans, mortgage assets, collection ledger, and liquidity balance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/customers?action=new"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Link>
          <Link
            href="/loans?action=new"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>New Loan</span>
          </Link>
          <Link
            href="/collections?action=new"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all flex items-center space-x-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Collection</span>
          </Link>
        </div>
      </div>

      {/* 13 KPI Metric Cards */}
      <StatCards stats={stats} />

      {/* Analytics & Financial Visualizations */}
      <FinancialCharts />
    </div>
  );
}

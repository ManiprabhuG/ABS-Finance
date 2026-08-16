import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function TrialBalancePrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (params.from) {
    fromDate = new Date(params.from);
    fromDate.setHours(0, 0, 0, 0);
  }
  if (params.to) {
    toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
  }
  const dateFilter = fromDate || toDate ? { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } : undefined;

  const [loans, collections, incomes, expenses, bankAccounts, cashAccount, settings] = await Promise.all([
    db.loan.aggregate({
      _sum: { outstandingBalance: true, principalAmount: true },
      where: { status: { not: 'PENDING' } },
    }),
    db.collection.aggregate({
      _sum: { interestPaid: true, penaltyPaid: true },
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
    db.bankAccount.findMany({}),
    db.cashAccount.findUnique({ where: { id: 'cash-master' } }),
    db.systemSettings.findFirst(),
  ]);

  const totalOutstanding = loans._sum.outstandingBalance || 0;
  const cashInHand = cashAccount?.currentBalance || 0;
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalIncome = (incomes._sum.amount || 0) + (collections._sum.interestPaid || 0) + (collections._sum.penaltyPaid || 0);
  const totalExpense = expenses._sum.amount || 0;

  const totalDebit = totalOutstanding + cashInHand + totalBankBalance + totalExpense;
  const totalCredit = totalIncome;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Trial Balance Sheet" />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="TRIAL BALANCE STATEMENT"
          documentNumber={`TB-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Period: {params.from ? formatDate(params.from) : 'All Recorded Transactions'} to {params.to ? formatDate(params.to) : 'Present Date'}</span>
            <span>Accounting Standard: Double-Entry Accrual System</span>
          </div>

          <table className="w-full text-left border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border border-slate-300">Account Head / Ledger Description</th>
                <th className="p-2.5 border border-slate-300 text-right">Debit (₹)</th>
                <th className="p-2.5 border border-slate-300 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              <tr>
                <td className="p-2.5 font-sans font-semibold">Loan Portfolio Outstanding (Current Assets)</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(totalOutstanding)}</td>
                <td className="p-2.5 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="p-2.5 font-sans font-semibold">Cash In Hand Register (Vault Float)</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(cashInHand)}</td>
                <td className="p-2.5 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="p-2.5 font-sans font-semibold">Bank Accounts Liquidity (HDFC / ICICI / SBI)</td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(totalBankBalance)}</td>
                <td className="p-2.5 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="p-2.5 font-sans font-semibold">Direct Operating Expenses</td>
                <td className="p-2.5 text-right font-bold text-rose-600">{formatCurrency(totalExpense)}</td>
                <td className="p-2.5 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="p-2.5 font-sans font-semibold">Interest & Service Fee Realization</td>
                <td className="p-2.5 text-right text-slate-400">-</td>
                <td className="p-2.5 text-right font-bold text-emerald-600">{formatCurrency(totalIncome)}</td>
              </tr>
              <tr className="bg-slate-100 font-bold font-sans text-sm">
                <td className="p-3">TOTAL TRIAL BALANCE</td>
                <td className="p-3 text-right font-mono text-brand-900">{formatCurrency(totalDebit)}</td>
                <td className="p-3 text-right font-mono text-brand-900">{formatCurrency(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

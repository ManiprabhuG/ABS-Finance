import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency } from '@/lib/export-utils';

export const revalidate = 0;

export default async function CashFlowReportPrintPage() {
  const [incomes, expenses, collections, cashAccount, bankAccounts, settings] = await Promise.all([
    db.income.findMany({}),
    db.expense.findMany({}),
    db.collection.findMany({}),
    db.cashAccount.findUnique({ where: { id: 'cash-master' } }),
    db.bankAccount.findMany({}),
    db.systemSettings.findFirst(),
  ]);

  const interestCollected = collections.reduce((sum, c) => sum + c.interestPaid, 0);
  const penaltyCollected = collections.reduce((sum, c) => sum + c.penaltyPaid, 0);
  const otherIncomeTotal = incomes.reduce((sum, i) => sum + i.amount, 0);

  const totalIncome = interestCollected + penaltyCollected + otherIncomeTotal;
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const cashBalance = cashAccount?.currentBalance || 0;
  const bankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const closingBalance = cashBalance + bankBalance;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Statement of Cash Flows & Liquidity" />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Cash Flow & Liquidity Statement"
          documentNumber={`CF-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6 text-xs">
          {/* Section 1: Inflows / Income Heads */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              1. Operating Cash Inflows & Income Realization
            </h2>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-300">Income Category Head</th>
                  <th className="p-2 border border-slate-300 text-right">Realized Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="p-2 font-sans font-medium">Interest Earnings on Loans</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(interestCollected)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium">Late Payment Penalty Recovery</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(penaltyCollected)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium">Loan Processing & Service Fees</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(otherIncomeTotal)}</td>
                </tr>
                <tr className="bg-emerald-50 font-bold font-sans">
                  <td className="p-2">TOTAL CASH INFLOWS</td>
                  <td className="p-2 text-right font-mono text-sm text-emerald-900">{formatCurrency(totalIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Outflows / Expense Heads */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              2. Operating Cash Outflows & Expenses
            </h2>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-300">Expense Category Head</th>
                  <th className="p-2 border border-slate-300 text-right">Disbursed Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-3 text-center text-slate-500 font-sans">No expenses recorded</td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 font-sans font-medium">{e.category} ({e.expenseNo})</td>
                      <td className="p-2 text-right font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))
                )}
                <tr className="bg-rose-50 font-bold font-sans">
                  <td className="p-2">TOTAL CASH OUTFLOWS</td>
                  <td className="p-2 text-right font-mono text-sm text-rose-900">{formatCurrency(totalExpense)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-4 text-center bg-slate-900 text-white p-4 rounded-xl font-mono">
            <div>
              <div className="text-[10px] text-slate-400">Cash In Hand Register</div>
              <div className="text-sm font-black text-amber-400">{formatCurrency(cashBalance)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Bank Liquidity</div>
              <div className="text-sm font-black text-cyan-400">{formatCurrency(bankBalance)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Available Liquidity</div>
              <div className="text-base font-black text-emerald-400">{formatCurrency(closingBalance)}</div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

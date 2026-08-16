import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function ProfitLossPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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

  const [incomes, expenses, collections, settings] = await Promise.all([
    db.income.findMany({ where: dateFilter ? { date: dateFilter } : undefined }),
    db.expense.findMany({ where: dateFilter ? { date: dateFilter } : undefined }),
    db.collection.findMany({ where: dateFilter ? { collectionDate: dateFilter } : undefined }),
    db.systemSettings.findFirst(),
  ]);

  const interestIncome = collections.reduce((acc, c) => acc + c.interestPaid, 0);
  const penaltyIncome = collections.reduce((acc, c) => acc + c.penaltyPaid, 0);
  const directFeeIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalIncome = interestIncome + penaltyIncome + directFeeIncome;

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Profit and Loss Statement" />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="PROFIT & LOSS STATEMENT"
          documentNumber={`PL-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Period: {params.from ? formatDate(params.from) : 'All Recorded Transactions'} to {params.to ? formatDate(params.to) : 'Present Date'}</span>
            <span>Accounting Method: Realized Basis</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Income Side */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                A. Revenue & Operating Incomes
              </h2>
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold text-[10px]">
                  <tr>
                    <th className="p-2 border border-slate-300">Particulars</th>
                    <th className="p-2 border border-slate-300 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="p-2 font-sans">Interest Realization</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(interestIncome)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">Processing & Doc Fees</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(directFeeIncome)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">Penal Charges Recovery</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(penaltyIncome)}</td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold font-sans">
                    <td className="p-2">TOTAL INCOME</td>
                    <td className="p-2 text-right font-mono text-emerald-900">{formatCurrency(totalIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expense Side */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                B. Operating Expenses
              </h2>
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold text-[10px]">
                  <tr>
                    <th className="p-2 border border-slate-300">Particulars</th>
                    <th className="p-2 border border-slate-300 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 font-sans">{e.category.replace(/_/g, ' ')}</td>
                      <td className="p-2 text-right font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-rose-50 font-bold font-sans">
                    <td className="p-2">TOTAL EXPENSES</td>
                    <td className="p-2 text-right font-mono text-rose-900">{formatCurrency(totalExpense)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Profit Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Net Financial Operating Result</span>
              <span className="text-base font-extrabold text-slate-200">
                {netProfit >= 0 ? 'NET OPERATING PROFIT' : 'NET OPERATING DEFICIT'}
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {formatCurrency(netProfit)}
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

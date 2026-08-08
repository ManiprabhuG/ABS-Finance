import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function MonthlyCollectionPrintPage() {
  const [collections, activeLoansCount, settings] = await Promise.all([
    db.collection.findMany({
      include: {
        customer: true,
        loan: true,
      },
      orderBy: { collectionDate: 'desc' },
    }),
    db.loan.count({ where: { status: 'ACTIVE' } }),
    db.systemSettings.findFirst(),
  ]);

  const totalCollected = collections.reduce((sum, c) => sum + c.amountReceived, 0);
  const totalPrincipal = collections.reduce((sum, c) => sum + c.principalPaid, 0);
  const totalInterest = collections.reduce((sum, c) => sum + c.interestPaid, 0);
  const totalPenalty = collections.reduce((sum, c) => sum + c.penaltyPaid, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Monthly Collection Audit Report" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Monthly Portfolio Recovery Audit Report"
          documentNumber={`MTH-${new Date().getFullYear()}-${new Date().getMonth() + 1}`}
          settings={settings}
        />

        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-3 text-center bg-slate-900 text-white p-4 rounded-xl font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Total Recovery</div>
              <div className="text-sm font-black text-emerald-400">{formatCurrency(totalCollected)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Principal Recovery</div>
              <div className="text-sm font-black text-slate-200">{formatCurrency(totalPrincipal)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Interest Income</div>
              <div className="text-sm font-black text-emerald-400">{formatCurrency(totalInterest)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Penalty Penalties</div>
              <div className="text-sm font-black text-rose-400">{formatCurrency(totalPenalty)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Active Loans</div>
              <div className="text-sm font-black text-amber-400">{activeLoansCount}</div>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Date</th>
                <th className="p-2 border border-slate-300">Customer Name</th>
                <th className="p-2 border border-slate-300">Loan Number</th>
                <th className="p-2 border border-slate-300 text-right">Collection Amount (₹)</th>
                <th className="p-2 border border-slate-300">Payment Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {collections.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 font-sans text-slate-600">{formatDate(c.collectionDate)}</td>
                  <td className="p-2 font-sans font-bold">{c.customer.name}</td>
                  <td className="p-2 font-bold text-brand-700">{c.loan.loanNumber}</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(c.amountReceived)}</td>
                  <td className="p-2 font-sans">{c.paymentMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

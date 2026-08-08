import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function DailyCollectionPrintPage() {
  const [collections, settings] = await Promise.all([
    db.collection.findMany({
      include: {
        customer: true,
        loan: true,
      },
      orderBy: { collectionDate: 'desc' },
    }),
    db.systemSettings.findFirst(),
  ]);

  const totalCollected = collections.reduce((sum, c) => sum + c.amountReceived, 0);
  const totalPrincipal = collections.reduce((sum, c) => sum + c.principalPaid, 0);
  const totalInterest = collections.reduce((sum, c) => sum + c.interestPaid, 0);
  const totalPenalty = collections.reduce((sum, c) => sum + c.penaltyPaid, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Daily Collection Register Report" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Daily Loan Collection Register"
          documentNumber={`DLY-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6">
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Receipt #</th>
                <th className="p-2 border border-slate-300">Customer Name</th>
                <th className="p-2 border border-slate-300">Loan #</th>
                <th className="p-2 border border-slate-300 text-right">Principal (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Interest (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Penalty (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Total (₹)</th>
                <th className="p-2 border border-slate-300">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {collections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500 font-sans">No collection receipts found</td>
                </tr>
              ) : (
                collections.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2 font-bold text-brand-700">{c.collectionId}</td>
                    <td className="p-2 font-sans font-semibold">{c.customer.name}</td>
                    <td className="p-2">{c.loan.loanNumber}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(c.principalPaid)}</td>
                    <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(c.interestPaid)}</td>
                    <td className="p-2 text-right font-bold text-rose-600">{c.penaltyPaid > 0 ? formatCurrency(c.penaltyPaid) : '-'}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(c.amountReceived)}</td>
                    <td className="p-2 font-sans">{c.paymentMode}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="grid grid-cols-4 gap-4 text-center bg-slate-900 text-white p-4 rounded-xl font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Total Recovery</div>
              <div className="text-base font-black text-emerald-400">{formatCurrency(totalCollected)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Principal</div>
              <div className="text-base font-black text-slate-200">{formatCurrency(totalPrincipal)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Interest</div>
              <div className="text-base font-black text-emerald-400">{formatCurrency(totalInterest)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Penalty</div>
              <div className="text-base font-black text-rose-400">{formatCurrency(totalPenalty)}</div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

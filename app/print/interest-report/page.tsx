import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency } from '@/lib/export-utils';

export const revalidate = 0;

export default async function InterestReportPrintPage() {
  const [collections, loans, settings] = await Promise.all([
    db.collection.findMany({
      include: { customer: true, loan: true },
    }),
    db.loan.findMany({
      where: { status: 'ACTIVE' },
    }),
    db.systemSettings.findFirst(),
  ]);

  const totalInterestEarned = collections.reduce((sum, c) => sum + c.interestPaid, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Interest Income Audit Statement" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Interest Earnings Audit Report"
          documentNumber={`INT-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6">
          <div className="p-4 bg-emerald-900 text-white rounded-xl flex items-center justify-between font-mono">
            <div>
              <span className="text-xs text-emerald-300 block">Cumulative Interest Earned & Realized:</span>
              <span className="text-2xl font-black text-emerald-400">{formatCurrency(totalInterestEarned)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-300 block">Active Earning Accounts:</span>
              <span className="text-lg font-bold text-white">{loans.length} Loans</span>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Loan #</th>
                <th className="p-2 border border-slate-300">Customer Name</th>
                <th className="p-2 border border-slate-300">Interest Rate</th>
                <th className="p-2 border border-slate-300 text-right">Total Interest Collected (₹)</th>
                <th className="p-2 border border-slate-300">Payment Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {collections.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 font-bold text-brand-700">{c.loan.loanNumber}</td>
                  <td className="p-2 font-sans font-semibold">{c.customer.name}</td>
                  <td className="p-2">{c.loan.interestRate}% p.a.</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(c.interestPaid)}</td>
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

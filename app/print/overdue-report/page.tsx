import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function OverdueReportPrintPage() {
  const [overdueLoans, settings] = await Promise.all([
    db.loan.findMany({
      where: { status: 'OVERDUE' },
      include: { customer: true, mortgageDetail: true },
      orderBy: { outstandingBalance: 'desc' },
    }),
    db.systemSettings.findFirst(),
  ]);

  const totalOverdueCount = overdueLoans.length;
  const totalOutstanding = overdueLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Overdue NPA Loans Audit Report" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Delinquent & Overdue Loan NPA Report"
          documentNumber={`OVD-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center bg-rose-950 text-white p-4 rounded-xl font-mono text-xs border border-rose-800">
            <div>
              <div className="text-[10px] text-rose-300">Total Overdue Accounts</div>
              <div className="text-base font-black text-white">{totalOverdueCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-rose-300">Total Default Principal</div>
              <div className="text-base font-black text-rose-400">{formatCurrency(totalOutstanding)}</div>
            </div>
            <div>
              <div className="text-[10px] text-rose-300">Action Required</div>
              <div className="text-base font-black text-amber-400">Legal Recovery Notice</div>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Loan #</th>
                <th className="p-2 border border-slate-300">Customer Name</th>
                <th className="p-2 border border-slate-300">Mobile</th>
                <th className="p-2 border border-slate-300 text-right">Sanction Amount</th>
                <th className="p-2 border border-slate-300 text-right">Outstanding Default</th>
                <th className="p-2 border border-slate-300">Collateral Pledged</th>
                <th className="p-2 border border-slate-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {overdueLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500 font-sans">No overdue accounts found in portfolio</td>
                </tr>
              ) : (
                overdueLoans.map((l) => (
                  <tr key={l.id}>
                    <td className="p-2 font-bold text-rose-700">{l.loanNumber}</td>
                    <td className="p-2 font-sans font-bold">{l.customer.name}</td>
                    <td className="p-2 font-sans">{l.customer.mobile}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(l.principalAmount)}</td>
                    <td className="p-2 text-right font-bold text-rose-600">{formatCurrency(l.outstandingBalance)}</td>
                    <td className="p-2 font-sans">{l.mortgageDetail ? `${l.mortgageDetail.assetType} (₹${l.mortgageDetail.estimatedValue?.toLocaleString()})` : 'NONE'}</td>
                    <td className="p-2 font-bold text-rose-700 uppercase font-sans">OVERDUE</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

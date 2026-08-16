import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function LoanOutstandingPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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

  const [loans, settings] = await Promise.all([
    db.loan.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        ...(dateFilter && { loanDate: dateFilter }),
      },
      include: { customer: true },
      orderBy: { outstandingBalance: 'desc' },
      take: 200,
    }),
    db.systemSettings.findFirst(),
  ]);

  const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Loan Outstanding Portfolio Statement" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="LOAN OUTSTANDING PORTFOLIO REPORT"
          documentNumber={`LOP-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Total Active Loans: {loans.length}</span>
            <span>Total Outstanding Portfolio: {formatCurrency(totalOutstanding)}</span>
          </div>

          <table className="w-full text-left border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Loan Number</th>
                <th className="p-2 border border-slate-300">Borrower Name & Phone</th>
                <th className="p-2 border border-slate-300">Loan Type</th>
                <th className="p-2 border border-slate-300">Disbursed Date</th>
                <th className="p-2 border border-slate-300 text-right">Principal</th>
                <th className="p-2 border border-slate-300 text-right">Outstanding (₹)</th>
                <th className="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {loans.map((l) => (
                <tr key={l.id}>
                  <td className="p-2 font-bold text-slate-900">{l.loanNumber}</td>
                  <td className="p-2 font-sans">
                    <div className="font-semibold text-slate-900">{l.customer?.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{l.customer?.mobile}</div>
                  </td>
                  <td className="p-2 font-sans text-slate-700">{l.loanType}</td>
                  <td className="p-2 text-slate-600">{formatDate(l.loanDate)}</td>
                  <td className="p-2 text-right text-slate-700">{formatCurrency(l.principalAmount)}</td>
                  <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(l.outstandingBalance)}</td>
                  <td className="p-2 text-center font-sans">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      l.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {l.status} {l.npaDays > 0 ? `(${l.npaDays}d)` : ''}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold font-sans text-sm">
                <td colSpan={4} className="p-3">TOTAL PORTFOLIO TOTALS</td>
                <td className="p-3 text-right font-mono">{formatCurrency(totalPrincipal)}</td>
                <td className="p-3 text-right font-mono text-brand-900">{formatCurrency(totalOutstanding)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

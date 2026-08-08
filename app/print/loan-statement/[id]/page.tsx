import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function LoanStatementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [loan, settings] = await Promise.all([
    db.loan.findUnique({
      where: { id },
      include: {
        customer: true,
        collections: {
          orderBy: { collectionDate: 'asc' },
        },
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!loan) notFound();

  const totalPrincipalPaid = loan.collections.reduce((sum, c) => sum + c.principalPaid, 0);
  const totalInterestPaid = loan.collections.reduce((sum, c) => sum + c.interestPaid, 0);
  const totalPenaltyPaid = loan.collections.reduce((sum, c) => sum + c.penaltyPaid, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Loan Ledger Statement - ${loan.loanNumber}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Loan Repayment Schedule & Ledger Statement"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-6">
          {/* Loan Particulars Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-500 block">Borrower Name:</span><span className="font-bold text-slate-900">{loan.customer.name}</span></div>
            <div><span className="text-slate-500 block">Sanction Principal:</span><span className="font-bold text-slate-900">{formatCurrency(loan.principalAmount)}</span></div>
            <div><span className="text-slate-500 block">Interest Rate:</span><span className="font-bold text-emerald-700">{loan.interestRate}% p.a. ({loan.interestType})</span></div>
            <div><span className="text-slate-500 block">Outstanding Balance:</span><span className="font-extrabold text-rose-600">{formatCurrency(loan.outstandingBalance)}</span></div>
          </div>

          {/* Repayments History Table */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2">Detailed Collection History</h3>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-300">Date</th>
                  <th className="p-2 border border-slate-300">Receipt #</th>
                  <th className="p-2 border border-slate-300 text-right">Principal Paid (₹)</th>
                  <th className="p-2 border border-slate-300 text-right">Interest Paid (₹)</th>
                  <th className="p-2 border border-slate-300 text-right">Penalty Paid (₹)</th>
                  <th className="p-2 border border-slate-300 text-right">Total Collection (₹)</th>
                  <th className="p-2 border border-slate-300">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {loan.collections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 font-sans">No repayment receipts recorded yet</td>
                  </tr>
                ) : (
                  loan.collections.map((c) => (
                    <tr key={c.id}>
                      <td className="p-2 font-sans">{formatDate(c.collectionDate)}</td>
                      <td className="p-2 font-bold text-brand-700">{c.collectionId}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(c.principalPaid)}</td>
                      <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(c.interestPaid)}</td>
                      <td className="p-2 text-right font-bold text-rose-600">{c.penaltyPaid > 0 ? formatCurrency(c.penaltyPaid) : '-'}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(c.amountReceived)}</td>
                      <td className="p-2 font-sans">{c.paymentMode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statement Financial Totals */}
          <div className="grid grid-cols-4 gap-4 text-center bg-slate-900 text-white p-4 rounded-xl font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Total Principal Recovered</div>
              <div className="text-sm font-black text-emerald-400">{formatCurrency(totalPrincipalPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Interest Recovered</div>
              <div className="text-sm font-black text-emerald-400">{formatCurrency(totalInterestPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Penalty Charges</div>
              <div className="text-sm font-black text-rose-400">{formatCurrency(totalPenaltyPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Current Outstanding Balance</div>
              <div className="text-sm font-black text-amber-400">{formatCurrency(loan.outstandingBalance)}</div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

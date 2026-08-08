import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function BankStatementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [bankAccount, settings] = await Promise.all([
    db.bankAccount.findUnique({
      where: { id },
      include: {
        ledgerEntries: {
          orderBy: { date: 'asc' },
        },
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!bankAccount) notFound();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Bank Statement - ${bankAccount.bankName}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Bank Account Audit Statement"
          documentNumber={bankAccount.accountNumber}
          settings={settings}
        />

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-500 block">Bank Name:</span><span className="font-bold text-slate-900 text-sm">{bankAccount.bankName}</span></div>
            <div><span className="text-slate-500 block">Account Number:</span><span className="font-mono font-bold text-slate-900">{bankAccount.accountNumber}</span></div>
            <div><span className="text-slate-500 block">IFSC Code:</span><span className="font-mono font-bold">{bankAccount.ifsc}</span></div>
            <div><span className="text-slate-500 block">Branch Name:</span><span className="font-semibold">{bankAccount.branch}</span></div>
            <div><span className="text-slate-500 block">Opening Balance:</span><span className="font-mono font-bold">{formatCurrency(bankAccount.openingBalance)}</span></div>
            <div><span className="text-slate-500 block">Current Balance:</span><span className="font-mono font-extrabold text-emerald-700">{formatCurrency(bankAccount.currentBalance)}</span></div>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Date</th>
                <th className="p-2 border border-slate-300">Ref #</th>
                <th className="p-2 border border-slate-300">Description</th>
                <th className="p-2 border border-slate-300 text-right">Debit (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Credit (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {bankAccount.ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">No bank transactions recorded</td>
                </tr>
              ) : (
                bankAccount.ledgerEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="p-2 font-sans">{formatDate(e.date)}</td>
                    <td className="p-2">{e.referenceNo || '-'}</td>
                    <td className="p-2 font-sans text-slate-700">{e.remarks}</td>
                    <td className="p-2 text-right font-bold text-rose-600">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                    <td className="p-2 text-right font-bold text-emerald-600">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(e.balanceAfter)}</td>
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

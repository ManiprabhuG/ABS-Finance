import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function DayBookPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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

  const [ledgerEntries, settings] = await Promise.all([
    db.ledgerEntry.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      orderBy: { date: 'desc' },
      take: 200,
    }),
    db.systemSettings.findFirst(),
  ]);

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Day Book Journal Ledger" />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="DAILY TRANSACTION JOURNAL (DAY BOOK)"
          documentNumber={`DB-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-4 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Period: {params.from || 'Today'} to {params.to || 'Present'}</span>
            <span>Total Journal Entries: {ledgerEntries.length}</span>
          </div>

          <table className="w-full text-left border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Voucher Ref</th>
                <th className="p-2 border border-slate-300">Date</th>
                <th className="p-2 border border-slate-300">Particulars / Description</th>
                <th className="p-2 border border-slate-300 text-right">Debit (Out)</th>
                <th className="p-2 border border-slate-300 text-right">Credit (In)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {ledgerEntries.map((e) => (
                <tr key={e.id}>
                  <td className="p-2 font-bold text-slate-800">{e.ledgerId}</td>
                  <td className="p-2 text-slate-600">{formatDate(e.date)}</td>
                  <td className="p-2 font-sans text-slate-800">{e.remarks}</td>
                  <td className="p-2 text-right font-bold text-rose-600">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold font-sans">
                <td colSpan={3} className="p-2.5">TOTAL JOURNAL TRANSACTIONS</td>
                <td className="p-2.5 text-right font-mono text-rose-900">{formatCurrency(totalDebit)}</td>
                <td className="p-2.5 text-right font-mono text-emerald-900">{formatCurrency(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

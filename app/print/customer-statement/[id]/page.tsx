import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function CustomerStatementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer, settings] = await Promise.all([
    db.customer.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            ledgerEntries: {
              orderBy: { date: 'asc' },
            },
          },
        },
        collections: {
          orderBy: { collectionDate: 'asc' },
        },
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!customer) notFound();

  // Combine and format all transactions for customer statement
  const allLedgerEntries = customer.loans.flatMap((l) => l.ledgerEntries);
  allLedgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalDebit = allLedgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = allLedgerEntries.reduce((sum, e) => sum + e.credit, 0);
  const netBalance = totalDebit - totalCredit;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Customer Ledger Statement - ${customer.name}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Customer Account Statement of Ledger"
          documentNumber={customer.customerId}
          settings={settings}
        />

        <div className="space-y-6">
          {/* Customer Particulars */}
          <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-500 block">Customer Name:</span><span className="font-bold text-slate-900">{customer.name}</span></div>
            <div><span className="text-slate-500 block">Customer ID:</span><span className="font-mono font-bold">{customer.customerId}</span></div>
            <div><span className="text-slate-500 block">Mobile Number:</span><span className="font-semibold">{customer.mobile}</span></div>
            <div className="col-span-3"><span className="text-slate-500 block">Address:</span><span className="font-semibold">{customer.address}</span></div>
          </div>

          {/* Statement Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-300">Date</th>
                  <th className="p-2 border border-slate-300">Type</th>
                  <th className="p-2 border border-slate-300">Ref #</th>
                  <th className="p-2 border border-slate-300 text-right">Debit (₹)</th>
                  <th className="p-2 border border-slate-300 text-right">Credit (₹)</th>
                  <th className="p-2 border border-slate-300 text-right">Balance (₹)</th>
                  <th className="p-2 border border-slate-300">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {allLedgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">No ledger transactions found</td>
                  </tr>
                ) : (
                  allLedgerEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 text-slate-600 font-sans">{formatDate(e.date)}</td>
                      <td className="p-2 font-bold font-sans">{e.transactionType}</td>
                      <td className="p-2">{e.referenceNo || '-'}</td>
                      <td className="p-2 text-right font-bold text-rose-600">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                      <td className="p-2 text-right font-bold text-emerald-600">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(e.balanceAfter)}</td>
                      <td className="p-2 font-sans text-slate-600">{e.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger Summary */}
          <div className="grid grid-cols-3 gap-4 text-center bg-slate-900 text-white p-4 rounded-xl font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Total Debit Disbursed</div>
              <div className="text-sm font-black text-rose-400">{formatCurrency(totalDebit)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Total Credit Recovered</div>
              <div className="text-sm font-black text-emerald-400">{formatCurrency(totalCredit)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Net Outstanding Ledger Balance</div>
              <div className="text-sm font-black text-amber-400">{formatCurrency(netBalance)}</div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

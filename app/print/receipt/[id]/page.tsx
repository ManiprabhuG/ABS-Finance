import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function CollectionReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [collection, settings] = await Promise.all([
    db.collection.findUnique({
      where: { id },
      include: {
        customer: true,
        loan: true,
        recordedBy: true,
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!collection) notFound();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Collection Receipt - ${collection.collectionId}`} />

      <main className="max-w-2xl mx-auto bg-white p-8 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Official Repayment Receipt"
          documentNumber={collection.collectionId}
          settings={settings}
        />

        <div className="space-y-4 text-xs text-slate-800">
          {/* Top Payment Banner */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div>
              <span className="text-emerald-800 font-semibold block text-[11px] uppercase tracking-wider">Amount Received Successfully</span>
              <div className="text-2xl font-black text-emerald-900">{formatCurrency(collection.amountReceived)}</div>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-500 block">Payment Mode:</span>
              <span className="font-extrabold text-slate-900 uppercase text-sm">{collection.paymentMode}</span>
            </div>
          </div>

          {/* Customer & Loan Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Received From Customer:</span>
              <span className="font-bold text-slate-900 text-sm">{collection.customer.name}</span>
              <span className="text-slate-500 block font-mono">({collection.customer.customerId})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Loan Account #:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{collection.loan.loanNumber}</span>
              <span className="text-slate-500 block font-mono">({collection.loan.loanType} LOAN)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Collection Date & Time:</span>
              <span className="font-semibold">{formatDate(collection.collectionDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Transaction Reference #:</span>
              <span className="font-mono font-bold">{collection.referenceNo || 'CASH-PAYMENT'}</span>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">Repayment Allocation Breakdown</h3>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-300">Component Head</th>
                  <th className="p-2 border border-slate-300 text-right">Allocated Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-medium">Principal Recovery Amount</td>
                  <td className="p-2 text-right font-mono font-bold">{formatCurrency(collection.principalPaid)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Interest Amount Paid</td>
                  <td className="p-2 text-right font-mono font-bold">{formatCurrency(collection.interestPaid)}</td>
                </tr>
                {collection.penaltyPaid > 0 && (
                  <tr>
                    <td className="p-2 font-medium text-rose-600">Overdue Late Penalty Charges</td>
                    <td className="p-2 text-right font-mono font-bold text-rose-600">{formatCurrency(collection.penaltyPaid)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2">TOTAL RECOVERY AMOUNT</td>
                  <td className="p-2 text-right font-mono text-base text-slate-900">{formatCurrency(collection.amountReceived)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Post-Payment Loan Balance */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between font-mono">
            <span>Remaining Outstanding Principal:</span>
            <span className="font-extrabold text-amber-400 text-sm">{formatCurrency(collection.loan.outstandingBalance)}</span>
          </div>

          {collection.notes && (
            <div className="text-[11px] text-slate-500 italic">
              Remarks: {collection.notes}
            </div>
          )}
        </div>

        <PrintFooter printedBy={collection.recordedBy?.name || 'Cashier'} signatureRequired={true} />
      </main>
    </div>
  );
}

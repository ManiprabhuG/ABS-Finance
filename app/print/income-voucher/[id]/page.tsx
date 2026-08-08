import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function IncomeVoucherPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [income, settings] = await Promise.all([
    db.income.findUnique({ where: { id } }),
    db.systemSettings.findFirst(),
  ]);

  if (!income) notFound();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Income Voucher - ${income.incomeNo}`} />

      <main className="max-w-3xl mx-auto bg-white p-8 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Official Credit Income Voucher"
          documentNumber={income.incomeNo}
          settings={settings}
        />

        <div className="space-y-6 text-xs text-slate-800">
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Income Amount Credited</span>
              <span className="text-2xl font-black text-emerald-900">{formatCurrency(income.amount)}</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-500 block">Voucher Date:</span>
              <span className="font-bold">{formatDate(income.date)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-500 block">Income Category Head:</span><span className="font-bold text-slate-900 text-sm">{income.category}</span></div>
            <div><span className="text-slate-500 block">Payment Mode:</span><span className="font-extrabold uppercase text-slate-900">{income.paymentMode}</span></div>
            <div><span className="text-slate-500 block">Ref / Cheque #:</span><span className="font-mono font-bold">{income.referenceNo || 'N/A'}</span></div>
            <div><span className="text-slate-500 block">Cash / Bank Designation:</span><span className="font-bold">{income.isCash ? 'CASH IN HAND' : 'BANK ACCOUNT'}</span></div>
            <div className="col-span-2"><span className="text-slate-500 block">Narration & Remarks:</span><span className="font-semibold">{income.remarks || 'Income booked to master ledger'}</span></div>
          </div>
        </div>

        <PrintFooter signatureRequired={true} />
      </main>
    </div>
  );
}

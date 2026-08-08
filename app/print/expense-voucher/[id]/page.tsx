import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function ExpenseVoucherPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [expense, settings] = await Promise.all([
    db.expense.findUnique({ where: { id } }),
    db.systemSettings.findFirst(),
  ]);

  if (!expense) notFound();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Expense Voucher - ${expense.expenseNo}`} />

      <main className="max-w-3xl mx-auto bg-white p-8 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Official Debit Expense Voucher"
          documentNumber={expense.expenseNo}
          settings={settings}
        />

        <div className="space-y-6 text-xs text-slate-800">
          <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Expense Amount Debited</span>
              <span className="text-2xl font-black text-rose-900">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-500 block">Voucher Date:</span>
              <span className="font-bold">{formatDate(expense.date)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-500 block">Expense Category Head:</span><span className="font-bold text-slate-900 text-sm">{expense.category}</span></div>
            <div><span className="text-slate-500 block">Payment Mode:</span><span className="font-extrabold uppercase text-slate-900">{expense.paymentMode}</span></div>
            <div><span className="text-slate-500 block">Ref / Cheque #:</span><span className="font-mono font-bold">{expense.referenceNo || 'N/A'}</span></div>
            <div><span className="text-slate-500 block">Cash / Bank Account:</span><span className="font-bold">{expense.isCash ? 'CASH REGISTER' : 'BANK ACCOUNT'}</span></div>
            <div className="col-span-2"><span className="text-slate-500 block">Narration & Purpose:</span><span className="font-semibold">{expense.remarks || 'Expense debited from ledger'}</span></div>
          </div>
        </div>

        <PrintFooter signatureRequired={true} />
      </main>
    </div>
  );
}

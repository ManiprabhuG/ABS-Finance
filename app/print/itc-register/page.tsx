import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function ITCRegisterPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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

  const [expenses, settings] = await Promise.all([
    db.expense.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      orderBy: { date: 'desc' },
      take: 200,
    }),
    db.systemSettings.findFirst(),
  ]);

  const items = expenses.map((exp, idx) => {
    const taxable = exp.amount;
    const grossGst = taxable * 0.18;
    const eligibleAmount = grossGst * 0.5;
    return {
      voucherNo: exp.expenseNo,
      date: exp.date,
      vendor: exp.remarks || `Vendor - ${exp.category}`,
      category: exp.category.replace(/_/g, ' '),
      taxable,
      grossGst,
      eligibleItc: eligibleAmount,
      ineligibleItc: grossGst - eligibleAmount,
    };
  });

  const totalTaxable = items.reduce((acc, i) => acc + i.taxable, 0);
  const totalGrossGst = items.reduce((acc, i) => acc + i.grossGst, 0);
  const totalEligibleItc = items.reduce((acc, i) => acc + i.eligibleItc, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Inward ITC Register Statement" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="INWARD INPUT TAX CREDIT (ITC) REGISTER (SEC 17(4))"
          documentNumber={`ITC-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Special Rule: Section 17(4) CGST Act (50% NBFC Apportionment)</span>
            <span>Eligible ITC Claim: {formatCurrency(totalEligibleItc)}</span>
          </div>

          <table className="w-full text-left border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[9px]">
              <tr>
                <th className="p-2 border border-slate-300">Voucher No</th>
                <th className="p-2 border border-slate-300">Date</th>
                <th className="p-2 border border-slate-300">Vendor / Particulars</th>
                <th className="p-2 border border-slate-300">Expense Category</th>
                <th className="p-2 border border-slate-300 text-right">Taxable Val (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Gross GST (18%)</th>
                <th className="p-2 border border-slate-300 text-right">Eligible ITC (50%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td className="p-1.5 font-bold text-slate-900">{i.voucherNo}</td>
                  <td className="p-1.5 text-slate-600">{formatDate(i.date)}</td>
                  <td className="p-1.5 font-sans font-semibold text-slate-800">{i.vendor}</td>
                  <td className="p-1.5 font-sans text-slate-700">{i.category}</td>
                  <td className="p-1.5 text-right">{formatCurrency(i.taxable)}</td>
                  <td className="p-1.5 text-right text-rose-700">{formatCurrency(i.grossGst)}</td>
                  <td className="p-1.5 text-right font-bold text-emerald-800">{formatCurrency(i.eligibleItc)}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold font-sans text-xs">
                <td colSpan={4} className="p-2.5">ITC REGISTER TOTALS</td>
                <td className="p-2.5 text-right font-mono">{formatCurrency(totalTaxable)}</td>
                <td className="p-2.5 text-right font-mono text-rose-900">{formatCurrency(totalGrossGst)}</td>
                <td className="p-2.5 text-right font-mono text-emerald-900">{formatCurrency(totalEligibleItc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function GSTR1OutwardPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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

  const [taxInvoices, incomes, penaltyCollections, settings] = await Promise.all([
    db.taxInvoice.findMany({
      where: dateFilter ? { invoiceDate: dateFilter } : undefined,
      orderBy: { invoiceDate: 'desc' },
      take: 200,
    }),
    db.income.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      orderBy: { date: 'desc' },
      take: 200,
    }),
    db.collection.findMany({
      where: {
        penaltyPaid: { gt: 0 },
        ...(dateFilter && { collectionDate: dateFilter }),
      },
      include: { customer: true },
      orderBy: { collectionDate: 'desc' },
      take: 200,
    }),
    db.systemSettings.findFirst(),
  ]);

  const items: any[] = [];
  taxInvoices.forEach((inv) => {
    items.push({
      invoiceNo: inv.invoiceNumber,
      date: inv.invoiceDate,
      customer: inv.customerName,
      sacCode: inv.sacCode,
      desc: inv.serviceType.replace(/_/g, ' '),
      taxable: inv.taxableValue,
      cgst: inv.cgstAmount,
      sgst: inv.sgstAmount,
      total: inv.totalInvoiceAmount,
    });
  });

  incomes.forEach((inc, idx) => {
    const taxable = inc.amount;
    items.push({
      invoiceNo: inc.incomeNo || `FEE-${1000 + idx}`,
      date: inc.date,
      customer: 'Borrower Client',
      sacCode: '997119',
      desc: inc.category.replace(/_/g, ' '),
      taxable,
      cgst: taxable * 0.09,
      sgst: taxable * 0.09,
      total: taxable * 1.18,
    });
  });

  penaltyCollections.forEach((col) => {
    const taxable = col.penaltyPaid;
    items.push({
      invoiceNo: `PEN-${col.collectionId}`,
      date: col.collectionDate,
      customer: col.customer?.name || 'Borrower',
      sacCode: '997113',
      desc: 'Late Payment Delay Charges',
      taxable,
      cgst: taxable * 0.09,
      sgst: taxable * 0.09,
      total: taxable * 1.18,
    });
  });

  const totalTaxable = items.reduce((acc, i) => acc + i.taxable, 0);
  const totalGst = items.reduce((acc, i) => acc + (i.cgst + i.sgst), 0);
  const grandTotal = items.reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="GSTR-1 Outward Supply Ledger" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="GSTR-1 OUTWARD TAXABLE SUPPLY LEDGER"
          documentNumber={`GSTR1-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Total Outward Tax Invoices: {items.length}</span>
            <span>Total Taxable: {formatCurrency(totalTaxable)} | Total Output GST: {formatCurrency(totalGst)}</span>
          </div>

          <table className="w-full text-left border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[9px]">
              <tr>
                <th className="p-2 border border-slate-300">Invoice No</th>
                <th className="p-2 border border-slate-300">Date</th>
                <th className="p-2 border border-slate-300">Recipient</th>
                <th className="p-2 border border-slate-300">SAC Code</th>
                <th className="p-2 border border-slate-300">Service Head</th>
                <th className="p-2 border border-slate-300 text-right">Taxable Val (₹)</th>
                <th className="p-2 border border-slate-300 text-right">CGST (9%)</th>
                <th className="p-2 border border-slate-300 text-right">SGST (9%)</th>
                <th className="p-2 border border-slate-300 text-right">Total Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td className="p-1.5 font-bold text-slate-900">{i.invoiceNo}</td>
                  <td className="p-1.5 text-slate-600">{formatDate(i.date)}</td>
                  <td className="p-1.5 font-sans font-semibold text-slate-800">{i.customer}</td>
                  <td className="p-1.5 text-amber-700">{i.sacCode}</td>
                  <td className="p-1.5 font-sans text-slate-700">{i.desc}</td>
                  <td className="p-1.5 text-right">{formatCurrency(i.taxable)}</td>
                  <td className="p-1.5 text-right text-rose-700">{formatCurrency(i.cgst)}</td>
                  <td className="p-1.5 text-right text-rose-700">{formatCurrency(i.sgst)}</td>
                  <td className="p-1.5 text-right font-bold text-emerald-800">{formatCurrency(i.total)}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold font-sans text-xs">
                <td colSpan={5} className="p-2.5">GSTR-1 OUTWARD TOTALS</td>
                <td className="p-2.5 text-right font-mono">{formatCurrency(totalTaxable)}</td>
                <td className="p-2.5 text-right font-mono text-rose-900">{formatCurrency(totalGst / 2)}</td>
                <td className="p-2.5 text-right font-mono text-rose-900">{formatCurrency(totalGst / 2)}</td>
                <td className="p-2.5 text-right font-mono text-emerald-900">{formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

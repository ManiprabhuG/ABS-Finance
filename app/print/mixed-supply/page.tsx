import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function MixedSupplyPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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
        loanType: { in: ['MORTGAGE', 'CUSTOM'] },
        status: { not: 'PENDING' },
        ...(dateFilter && { loanDate: dateFilter }),
      },
      include: { customer: true, mortgageDetail: true },
      orderBy: { loanDate: 'desc' },
      take: 100,
    }),
    db.systemSettings.findFirst(),
  ]);

  const bundles = loans.map((l) => {
    const principal = l.principalAmount;
    const processing = Math.round(principal * 0.015);
    const valuation = l.mortgageDetail ? 3500 : 1500;
    const docFee = 2500;
    const totalFee = processing + valuation + docFee;
    const gst = totalFee * 0.18;
    return {
      bundleId: `BDL-${l.loanNumber}`,
      loanNumber: l.loanNumber,
      customer: l.customer?.name,
      date: l.loanDate,
      principal,
      processing,
      valuation,
      docFee,
      totalFee,
      gst,
    };
  });

  const grandTotalBundled = bundles.reduce((sum, b) => sum + b.totalFee, 0);
  const grandTotalGst = bundles.reduce((sum, b) => sum + b.gst, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Mixed & Composite Supply Segregation Audit" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="MIXED & COMPOSITE SUPPLY SEGREGATION AUDIT REPORT"
          documentNumber={`MIX-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Audit Condition: Unbundled Tax Valuation for Bundled Financial Services</span>
            <span>Total Bundled Fee: {formatCurrency(grandTotalBundled)} | Total GST Levied: {formatCurrency(grandTotalGst)}</span>
          </div>

          <table className="w-full text-left border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[9px]">
              <tr>
                <th className="p-2 border border-slate-300">Bundle ID</th>
                <th className="p-2 border border-slate-300">Borrower</th>
                <th className="p-2 border border-slate-300">Principal (0% Exempt)</th>
                <th className="p-2 border border-slate-300">Processing (18%)</th>
                <th className="p-2 border border-slate-300">Valuation (18%)</th>
                <th className="p-2 border border-slate-300">Legal Doc (18%)</th>
                <th className="p-2 border border-slate-300 text-right">Taxable Fee (₹)</th>
                <th className="p-2 border border-slate-300 text-right">Total GST (18%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {bundles.map((b, idx) => (
                <tr key={idx}>
                  <td className="p-1.5 font-bold text-slate-900">{b.bundleId}</td>
                  <td className="p-1.5 font-sans font-semibold text-slate-800">{b.customer}</td>
                  <td className="p-1.5 text-slate-600">{formatCurrency(b.principal)}</td>
                  <td className="p-1.5">{formatCurrency(b.processing)}</td>
                  <td className="p-1.5">{formatCurrency(b.valuation)}</td>
                  <td className="p-1.5">{formatCurrency(b.docFee)}</td>
                  <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(b.totalFee)}</td>
                  <td className="p-1.5 text-right font-bold text-rose-700">{formatCurrency(b.gst)}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold font-sans text-xs">
                <td colSpan={6} className="p-2.5">MIXED SUPPLY AUDIT TOTALS</td>
                <td className="p-2.5 text-right font-mono text-slate-900">{formatCurrency(grandTotalBundled)}</td>
                <td className="p-2.5 text-right font-mono text-rose-900">{formatCurrency(grandTotalGst)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function MasterGSTPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
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

  const [incomes, collections, expenses, settings] = await Promise.all([
    db.income.findMany({ where: dateFilter ? { date: dateFilter } : undefined }),
    db.collection.findMany({ where: dateFilter ? { collectionDate: dateFilter } : undefined }),
    db.expense.findMany({ where: dateFilter ? { date: dateFilter } : undefined }),
    db.systemSettings.findFirst(),
  ]);

  const interestCollected = collections.reduce((acc, c) => acc + c.interestPaid, 0);
  const penaltyCollected = collections.reduce((acc, c) => acc + c.penaltyPaid, 0);
  const directFeeIncome = incomes.reduce((acc, i) => acc + i.amount, 0);

  const taxableTurnover = directFeeIncome + penaltyCollected;
  const exemptTurnover = interestCollected;
  const totalTurnover = taxableTurnover + exemptTurnover;

  const outputGstTotal = taxableTurnover * 0.18;
  const outputCgst = outputGstTotal / 2;
  const outputSgst = outputGstTotal / 2;

  const totalExpenseTaxable = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossInwardGst = totalExpenseTaxable * 0.18;
  const eligibleItc = grossInwardGst * 0.50; // Sec 17(4) 50% NBFC rule
  const netGstPayable = Math.max(0, outputGstTotal - eligibleItc);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Master GST Summary Statement" />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="STATUTORY MASTER GST SUMMARY & TAX COMPUTATION"
          documentNumber={`GST-SUM-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>GSTIN: {settings?.gstNumber || '33AAAAA0000A1Z5'}</span>
            <span>Period: {params.from ? formatDate(params.from) : 'All Recorded Transactions'} to {params.to ? formatDate(params.to) : 'Present Date'}</span>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              1. Turnover Summary & Tax Rate Segregation
            </h2>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-300">Turnover Classification</th>
                  <th className="p-2 border border-slate-300">Applicable GST Rate</th>
                  <th className="p-2 border border-slate-300 text-right">Taxable Turnover (₹)</th>
                  <th className="p-2 border border-slate-300 text-right">Output GST (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="p-2 font-sans font-semibold">Exempt Lending Interest (Notification 12/2017)</td>
                  <td className="p-2 text-slate-600">0% (Nil Rated / Exempt)</td>
                  <td className="p-2 text-right">{formatCurrency(exemptTurnover)}</td>
                  <td className="p-2 text-right">₹0.00</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-semibold">Loan Processing, Documentation & Service Fees</td>
                  <td className="p-2 text-slate-600">18% (SAC 997119)</td>
                  <td className="p-2 text-right">{formatCurrency(directFeeIncome)}</td>
                  <td className="p-2 text-right text-rose-700">{formatCurrency(directFeeIncome * 0.18)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-semibold">Late Payment Delay & Penal Charges</td>
                  <td className="p-2 text-slate-600">18% (SAC 997113)</td>
                  <td className="p-2 text-right">{formatCurrency(penaltyCollected)}</td>
                  <td className="p-2 text-right text-rose-700">{formatCurrency(penaltyCollected * 0.18)}</td>
                </tr>
                <tr className="bg-slate-100 font-bold font-sans">
                  <td colSpan={2} className="p-2.5">AGGREGATE GROSS TURNOVER</td>
                  <td className="p-2.5 text-right font-mono">{formatCurrency(totalTurnover)}</td>
                  <td className="p-2.5 text-right font-mono text-rose-900">{formatCurrency(outputGstTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: ITC & Net Tax */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              2. Input Tax Credit (ITC) Offset & Net Tax Payable
            </h2>
            <table className="w-full text-left border border-slate-300 font-mono">
              <tbody>
                <tr>
                  <td className="p-2 font-sans font-medium">A. Gross Output GST Liability (CGST ₹{formatCurrency(outputCgst)} + SGST ₹{formatCurrency(outputSgst)})</td>
                  <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(outputGstTotal)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium">B. Inward Expense Gross GST (18%)</td>
                  <td className="p-2 text-right text-slate-700">{formatCurrency(grossInwardGst)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-semibold text-emerald-800">C. Less: Section 17(4) 50% NBFC Eligible Input Tax Credit (ITC)</td>
                  <td className="p-2 text-right font-bold text-emerald-700">−{formatCurrency(eligibleItc)}</td>
                </tr>
                <tr className="bg-slate-900 text-white font-sans font-bold text-sm">
                  <td className="p-3">NET CASH GST PAYABLE TO GOVERNMENT</td>
                  <td className="p-3 text-right font-mono text-amber-400">{formatCurrency(netGstPayable)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

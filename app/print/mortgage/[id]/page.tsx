import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function MortgagePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [loan, settings] = await Promise.all([
    db.loan.findUnique({
      where: { id },
      include: {
        customer: true,
        mortgageDetail: true,
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!loan || !loan.mortgageDetail) notFound();

  const mortgage = loan.mortgageDetail;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Mortgage Collateral Deed - ${loan.loanNumber}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Pledged Mortgage & Collateral Valuation Sheet"
          documentNumber={`MORT-${loan.loanNumber}`}
          settings={settings}
        />

        <div className="space-y-6">
          {/* Collateral Asset Summary */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Pledged Collateral Asset Particulars
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-amber-50/70 p-4 rounded-xl border border-amber-300">
              <div>
                <span className="text-slate-500 block">Asset Category:</span>
                <span className="font-extrabold text-amber-900 text-sm">{mortgage.assetType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assessed Valuation:</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(mortgage.estimatedValue)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Market Valuation:</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(mortgage.marketValue)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Calculated LTV %:</span>
                <span className="font-extrabold text-emerald-700 text-sm">{mortgage.ltvPercentage}%</span>
              </div>
              <div className="col-span-4">
                <span className="text-slate-500 block">Detailed Asset Description & Identification Notes:</span>
                <span className="font-semibold text-slate-900 text-xs">{mortgage.assetDescription}</span>
              </div>
            </div>
          </div>

          {/* Owner / Borrower Details */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              2. Pledgor / Property Owner Details
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><span className="text-slate-500 block">Owner Name:</span><span className="font-bold text-slate-900">{loan.customer.name}</span></div>
              <div><span className="text-slate-500 block">Customer ID:</span><span className="font-mono font-bold">{loan.customer.customerId}</span></div>
              <div><span className="text-slate-500 block">Mobile Number:</span><span className="font-semibold">{loan.customer.mobile}</span></div>
              <div><span className="text-slate-500 block">Aadhaar #:</span><span className="font-mono">{loan.customer.aadhaar}</span></div>
              <div><span className="text-slate-500 block">PAN #:</span><span className="font-mono">{loan.customer.pan || 'N/A'}</span></div>
              <div><span className="text-slate-500 block">Linked Loan #:</span><span className="font-mono font-bold">{loan.loanNumber}</span></div>
              <div className="col-span-3"><span className="text-slate-500 block">Residential Address:</span><span className="font-semibold">{loan.customer.address}</span></div>
            </div>
          </div>

          {/* Linked Financial Facility */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              3. Linked Credit Facility Terms
            </h2>
            <div className="grid grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div><span className="text-slate-500 block">Loan Principal:</span><span className="font-bold text-slate-900">{formatCurrency(loan.principalAmount)}</span></div>
              <div><span className="text-slate-500 block">Interest Rate:</span><span className="font-bold text-emerald-700">{loan.interestRate}% p.a.</span></div>
              <div><span className="text-slate-500 block">Outstanding Balance:</span><span className="font-extrabold text-slate-900">{formatCurrency(loan.outstandingBalance)}</span></div>
              <div><span className="text-slate-500 block">Mortgage Status:</span><span className="font-bold text-emerald-800">VAULT SEALED</span></div>
            </div>
          </div>
        </div>

        <PrintFooter signatureRequired={true} />
      </main>
    </div>
  );
}

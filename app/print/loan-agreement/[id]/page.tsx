import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function LoanAgreementPrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!loan) notFound();

  const companyName = settings?.companyName || 'ABS Finance Management Ltd.';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Legal Loan Agreement - ${loan.loanNumber}`} />

      <main className="max-w-4xl mx-auto bg-white p-6 sm:p-8 print:p-6 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Formal Loan Agreement & Debt Contract"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-3.5 text-[11px] text-slate-800 leading-normal">
          {/* Recital Statement */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900 text-xs">
            THIS DEED OF LOAN AGREEMENT is executed on {formatDate(loan.loanDate)} between {companyName} (LENDER) and {loan.customer.name} (BORROWER).
          </div>

          {/* Section 1: Borrower Information */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article I: Borrower Identity & Particulars
            </h2>
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-2 border border-slate-200 rounded">
              <div><span className="text-slate-500 block text-[10px]">Borrower Name:</span><span className="font-bold text-slate-900">{loan.customer.name}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Customer Ref ID:</span><span className="font-mono font-bold">{loan.customer.customerId}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Contact Mobile:</span><span className="font-semibold">{loan.customer.mobile}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Aadhaar Card #:</span><span className="font-mono font-semibold">{loan.customer.aadhaar}</span></div>
              <div><span className="text-slate-500 block text-[10px]">PAN Card #:</span><span className="font-mono font-semibold">{loan.customer.pan || 'N/A'}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Occupation:</span><span className="font-semibold">{loan.customer.occupation || 'N/A'}</span></div>
              <div className="col-span-3"><span className="text-slate-500 block text-[10px]">Permanent Address:</span><span className="font-semibold">{loan.customer.address}</span></div>
            </div>
          </div>

          {/* Section 2: Loan Financial Terms */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article II: Principal Debt & Repayment Terms
            </h2>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 border border-slate-300 rounded font-mono text-[11px]">
              <div><span className="text-slate-500 block text-[10px]">Sanctioned Principal:</span><span className="font-bold text-slate-900 text-xs">{formatCurrency(loan.principalAmount)}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Agreed Interest Rate:</span><span className="font-bold text-slate-900">{loan.interestRate}% p.a.</span></div>
              <div><span className="text-slate-500 block text-[10px]">Interest Method:</span><span className="font-bold text-slate-900">{loan.interestType}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Loan Tenure:</span><span className="font-bold text-slate-900">{loan.tenureMonths} Months</span></div>
              <div><span className="text-slate-500 block text-[10px]">Default Penalty:</span><span className="font-bold text-rose-600">{settings?.defaultPenalty || 2.0}% / Mo</span></div>
              <div><span className="text-slate-500 block text-[10px]">Grace Period:</span><span className="font-bold text-slate-900">{settings?.gracePeriodDays || 5} Days</span></div>
            </div>
          </div>

          {/* Section 3: Mortgage Details (If applicable) */}
          {loan.mortgageDetail && (
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                Article III: Mortgage Collateral & Hypothecation Clause
              </h2>
              <div className="p-2 bg-amber-50/70 border border-amber-300 rounded text-[11px]">
                <div className="grid grid-cols-3 gap-2">
                  <div>Category: <span className="font-bold text-amber-900">{loan.mortgageDetail.assetType}</span></div>
                  <div>Assessed Value: <span className="font-bold">₹{loan.mortgageDetail.estimatedValue.toLocaleString()}</span></div>
                  <div>LTV Ratio: <span className="font-bold">{loan.mortgageDetail.ltvPercentage}%</span></div>
                </div>
                <div className="mt-1 text-[10px] text-slate-600 italic">
                  Asset Description: {loan.mortgageDetail.assetDescription}. Borrower pledges collateral until principal and interest are liquidated.
                </div>
              </div>
            </div>
          )}

          {/* Section 4: General Terms & Covenants */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article IV: Key Covenants & Remedies
            </h2>
            <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-slate-700">
              <li>Borrower agrees to pay monthly interest and principal dues on or before the due date.</li>
              <li>Overdue payments after grace period attract penalty of {settings?.defaultPenalty || 2.0}% per month.</li>
              <li>Default &gt;60 days entitles Lender to initiate legal recovery under NI Act / SARFAESI and liquidate collateral.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="pt-4 print:pt-4">
            <div className="grid grid-cols-2 gap-12 border-t border-slate-400 pt-6 text-center font-bold text-xs">
              <div>
                <div className="border-t border-slate-400 pt-1">Signature of Borrower / Guarantor</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">{loan.customer.name}</div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1">For {companyName}</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Authorized Signatory & Seal</div>
              </div>
            </div>
          </div>
        </div>

        <PrintFooter printedBy="Legal Officer" />
      </main>
    </div>
  );
}

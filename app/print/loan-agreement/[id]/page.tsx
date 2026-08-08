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

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Formal Loan Agreement & Debt Contract"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
          {/* Recital Statement */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900">
            THIS DEED OF LOAN AGREEMENT is executed at Mumbai on {formatDate(loan.loanDate)} between {companyName} (hereinafter called the LENDER) and {loan.customer.name} (hereinafter called the BORROWER).
          </div>

          {/* Section 1: Borrower Information */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              Article I: Borrower Identity & Particulars
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><span className="text-slate-500 block">Borrower Name:</span><span className="font-bold text-slate-900">{loan.customer.name}</span></div>
              <div><span className="text-slate-500 block">Customer Ref ID:</span><span className="font-mono font-bold">{loan.customer.customerId}</span></div>
              <div><span className="text-slate-500 block">Contact Mobile:</span><span className="font-semibold">{loan.customer.mobile}</span></div>
              <div><span className="text-slate-500 block">Aadhaar Card #:</span><span className="font-mono font-semibold">{loan.customer.aadhaar}</span></div>
              <div><span className="text-slate-500 block">PAN Card #:</span><span className="font-mono font-semibold">{loan.customer.pan || 'N/A'}</span></div>
              <div><span className="text-slate-500 block">Occupation:</span><span className="font-semibold">{loan.customer.occupation || 'N/A'}</span></div>
              <div className="col-span-3"><span className="text-slate-500 block">Permanent Address:</span><span className="font-semibold">{loan.customer.address}</span></div>
            </div>
          </div>

          {/* Section 2: Loan Financial Terms */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              Article II: Principal Debt, Interest Rate & Repayment Terms
            </h2>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 border border-slate-300 rounded font-mono">
              <div><span className="text-slate-500 block">Sanctioned Principal:</span><span className="font-bold text-slate-900 text-sm">{formatCurrency(loan.principalAmount)}</span></div>
              <div><span className="text-slate-500 block">Agreed Interest Rate:</span><span className="font-bold text-slate-900">{loan.interestRate}% p.a.</span></div>
              <div><span className="text-slate-500 block">Interest Computation:</span><span className="font-bold text-slate-900">{loan.interestType} METHOD</span></div>
              <div><span className="text-slate-500 block">Loan Tenure:</span><span className="font-bold text-slate-900">{loan.tenureMonths} Months</span></div>
              <div><span className="text-slate-500 block">Default Penalty:</span><span className="font-bold text-rose-600">{settings?.defaultPenalty || 2.0}% / Month</span></div>
              <div><span className="text-slate-500 block">Grace Period:</span><span className="font-bold text-slate-900">{settings?.gracePeriodDays || 5} Calendar Days</span></div>
            </div>
          </div>

          {/* Section 3: Mortgage Details (If applicable) */}
          {loan.mortgageDetail && (
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Article III: Mortgage Collateral & Hypothecation Clause
              </h2>
              <div className="p-3 bg-amber-50/70 border border-amber-300 rounded space-y-1">
                <div>Collateral Category: <span className="font-bold text-amber-900">{loan.mortgageDetail.assetType}</span></div>
                <div>Asset Description: <span className="font-semibold">{loan.mortgageDetail.assetDescription}</span></div>
                <div>Assessed Valuation: <span className="font-bold">₹{loan.mortgageDetail.estimatedValue.toLocaleString()}</span> (LTV Ratio: {loan.mortgageDetail.ltvPercentage}%)</div>
                <p className="text-[10px] text-slate-600 mt-1 italic">
                  The Borrower pledges and hypothecates the above collateral to the Lender until the entire principal, interest, and legal dues are fully liquidated.
                </p>
              </div>
            </div>
          )}

          {/* Section 4: General Terms & Covenants */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              Article IV: General Covenants, Default & Remedies
            </h2>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-700">
              <li>The Borrower agrees to pay all monthly interest and principal dues on or before the agreed due date each month.</li>
              <li>Failure to pay within the grace period shall attract default interest penalty of {settings?.defaultPenalty || 2.0}% per month on overdue installments.</li>
              <li>In the event of default exceeding 60 days, the Lender reserves the full legal right to initiate proceedings under the Negotiable Instruments Act / SARFAESI / Arbitration and liquidate pledged collateral.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="pt-8">
            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-400 text-center font-bold">
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

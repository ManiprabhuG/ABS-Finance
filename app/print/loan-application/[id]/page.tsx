import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function LoanApplicationPrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Loan Application - ${loan.loanNumber}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Loan Application Form"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-6">
          {/* Section 1: Applicant Information */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Applicant Personal & Financial Profile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Applicant Name:</span>
                <span className="font-bold text-slate-900 text-sm">{loan.customer.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Customer ID:</span>
                <span className="font-mono font-bold text-slate-900">{loan.customer.customerId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile Number:</span>
                <span className="font-semibold text-slate-800">{loan.customer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Aadhaar Number:</span>
                <span className="font-mono font-semibold text-slate-800">{loan.customer.aadhaar}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PAN Number:</span>
                <span className="font-mono font-semibold text-slate-800">{loan.customer.pan || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Occupation / Profession:</span>
                <span className="font-semibold text-slate-800">{loan.customer.occupation || 'N/A'}</span>
              </div>
              <div className="col-span-3">
                <span className="text-slate-500 block">Residential Address:</span>
                <span className="font-semibold text-slate-800">{loan.customer.address}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Loan Requirements Details */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              2. Requested Loan Facility Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Application Ref #:</span>
                <span className="font-mono font-bold text-slate-900">{loan.loanNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Loan Product Category:</span>
                <span className="font-bold text-slate-900">{loan.loanType} LOAN</span>
              </div>
              <div>
                <span className="text-slate-500 block">Requested Principal:</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(loan.principalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Interest Type:</span>
                <span className="font-semibold">{loan.interestType} INTEREST</span>
              </div>
              <div>
                <span className="text-slate-500 block">Interest Rate:</span>
                <span className="font-bold text-emerald-700">{loan.interestRate}% p.a.</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tenure Period:</span>
                <span className="font-bold">{loan.tenureMonths} Months</span>
              </div>
              <div>
                <span className="text-slate-500 block">Application Date:</span>
                <span className="font-semibold">{formatDate(loan.loanDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Application Status:</span>
                <span className="font-bold text-brand-700">{loan.status}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Mortgage Collateral (If Mortgage Loan) */}
          {loan.mortgageDetail && (
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                3. Mortgage Collateral Pledged Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                <div>
                  <span className="text-slate-500 block">Collateral Type:</span>
                  <span className="font-bold text-amber-900">{loan.mortgageDetail.assetType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Valuation:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(loan.mortgageDetail.estimatedValue)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Market Valuation:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(loan.mortgageDetail.marketValue)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Calculated LTV %:</span>
                  <span className="font-bold text-emerald-700">{loan.mortgageDetail.ltvPercentage}%</span>
                </div>
                <div className="col-span-4">
                  <span className="text-slate-500 block">Asset Description & Collateral Notes:</span>
                  <span className="font-semibold text-slate-800">{loan.mortgageDetail.assetDescription}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Legal Applicant Declaration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] leading-relaxed text-slate-700">
            <h3 className="font-bold text-xs text-slate-900 uppercase mb-1">Applicant Legal Declaration</h3>
            <p>
              I/We hereby declare that all the statements, documents, and information provided in this loan application form are true, correct, and complete to the best of my knowledge. I authorize {settings?.companyName || 'ABS Finance Management Ltd.'} to verify my credit history, identity, and collateral documentation. I understand that any false or misleading statement will result in immediate rejection of the loan application and appropriate legal recourse.
            </p>
          </div>
        </div>

        <PrintFooter signatureRequired={true} />
      </main>
    </div>
  );
}

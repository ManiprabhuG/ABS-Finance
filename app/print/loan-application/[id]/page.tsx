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
          documentTitle="Official Loan Application Form"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-6">
          {/* Section 1: Applicant Information with Photo */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Applicant Personal & Financial Profile
            </h2>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
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
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-500 block">Residential Address:</span>
                  <span className="font-semibold text-slate-800">{loan.customer.address}</span>
                </div>
              </div>

              {/* Applicant Official Photo Frame */}
              <div className="w-28 h-32 border-2 border-slate-400 p-1 flex flex-col items-center justify-center bg-slate-50 flex-shrink-0 self-center sm:self-start">
                {loan.customer.photoUrl ? (
                  <img
                    src={loan.customer.photoUrl}
                    alt={loan.customer.name}
                    className="w-full h-full object-cover rounded-none"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 text-center uppercase font-bold p-2">
                    Applicant Photo
                  </div>
                )}
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
                <span className="font-bold text-slate-900">{loan.tenureMonths} Months</span>
              </div>
            </div>
          </div>

          {/* Section 3: Mortgage Details (If applicable) */}
          {loan.mortgageDetail && (
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                3. Mortgage Asset Collateral Particulars
              </h2>
              <div className="grid grid-cols-3 gap-4 text-xs bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div>
                  <span className="text-slate-500 block">Asset Type:</span>
                  <span className="font-bold text-amber-900">{loan.mortgageDetail.assetType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Asset Value:</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(loan.mortgageDetail.estimatedValue)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Loan-to-Value (LTV):</span>
                  <span className="font-bold text-slate-900">{loan.mortgageDetail.ltvPercentage}%</span>
                </div>
                <div className="col-span-3">
                  <span className="text-slate-500 block">Collateral Description & Pledged Assets:</span>
                  <span className="font-semibold text-slate-800">{loan.mortgageDetail.assetDescription}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Applicant Declaration & Signatures */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              4. Declaration & Signature
            </h2>
            <p className="text-[11px] text-slate-600 mb-8 leading-relaxed">
              I hereby declare that all information provided in this loan application form is true and accurate to the best of my knowledge. I authorize {settings?.companyName || 'ABS Finance Management Ltd.'} to verify my KYC documents and credit history.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="border-t border-slate-400 pt-2 text-center text-xs">
                <span className="font-bold block">{loan.customer.name}</span>
                <span className="text-slate-500">Applicant / Borrower Signature</span>
              </div>
              <div className="border-t border-slate-400 pt-2 text-center text-xs">
                <span className="font-bold block">Authorized Officer</span>
                <span className="text-slate-500">Loan Officer / Credit Manager Signature</span>
              </div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

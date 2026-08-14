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
        customer: {
          include: {
            documents: true,
          },
        },
        mortgageDetail: true,
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!loan) notFound();

  const companyName = settings?.companyName || 'ABS Finance Management Ltd.';

  const documents = loan.customer.documents || [];
  const aadhaarDocs = documents.filter(
    (d) => d.category === 'AADHAAR' || d.title.toLowerCase().includes('aadhaar')
  );
  const panDocs = documents.filter(
    (d) => d.category === 'PAN' || d.title.toLowerCase().includes('pan')
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Legal Loan Agreement - ${loan.loanNumber}`} />

      <main className="max-w-4xl mx-auto bg-white p-6 sm:p-8 print:p-6 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Formal Loan Agreement & Debt Contract"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-4 text-[11px] text-slate-800 leading-normal">
          {/* Recital Statement */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900 text-xs">
            THIS DEED OF LOAN AGREEMENT is executed on {formatDate(loan.loanDate)} between {companyName} (LENDER) and {loan.customer.name} (BORROWER).
          </div>

          {/* Article I: Borrower Information with Photo */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article I: Borrower Identity & Particulars
            </h2>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-3 gap-2 bg-slate-50/50 p-2 border border-slate-200 rounded">
                <div><span className="text-slate-500 block text-[10px]">Borrower Name:</span><span className="font-bold text-slate-900">{loan.customer.name}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Customer Ref ID:</span><span className="font-mono font-bold">{loan.customer.customerId}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Contact Mobile:</span><span className="font-semibold">{loan.customer.mobile}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Aadhaar Card #:</span><span className="font-mono font-semibold">{loan.customer.aadhaar}</span></div>
                <div><span className="text-slate-500 block text-[10px]">PAN Card #:</span><span className="font-mono font-semibold">{loan.customer.pan || 'N/A'}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Occupation:</span><span className="font-semibold">{loan.customer.occupation || 'N/A'}</span></div>
                <div className="col-span-3"><span className="text-slate-500 block text-[10px]">Permanent Address:</span><span className="font-semibold">{loan.customer.address}</span></div>
              </div>

              {/* Borrower Official Passport Photo Frame */}
              <div className="w-24 h-28 border border-slate-400 p-1 flex flex-col items-center justify-center bg-slate-50 flex-shrink-0">
                {loan.customer.photoUrl ? (
                  <img
                    src={loan.customer.photoUrl}
                    alt={loan.customer.name}
                    className="w-full h-full object-cover rounded-none"
                  />
                ) : (
                  <div className="text-[9px] text-slate-400 text-center uppercase font-bold p-1">
                    Borrower Photo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Article II: Loan Financial Terms & Repayment Breakdown */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article II: Principal Debt & Repayment Structure
            </h2>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 border border-slate-300 rounded text-[11px]">
              <div><span className="text-slate-500 block text-[10px]">Sanctioned Principal:</span><span className="font-bold text-slate-900 text-xs">{formatCurrency(loan.principalAmount)}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Agreed Interest Rate:</span><span className="font-bold text-emerald-800">{loan.interestRate}% p.a. ({loan.interestType})</span></div>
              <div><span className="text-slate-500 block text-[10px]">Repayment Frequency:</span><span className="font-bold text-brand-700 uppercase">{loan.installmentType || 'MONTHLY'}</span></div>
              <div>
                <span className="text-slate-500 block text-[10px]">Tenure Duration:</span>
                <span className="font-bold text-slate-900">
                  {loan.tenureValue || loan.tenureMonths}{' '}
                  {loan.installmentType === 'DAILY' ? 'Days' : loan.installmentType === 'WEEKLY' ? 'Weeks' : 'Months'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Interest Amount:</span>
                <span className="font-bold text-emerald-800">
                  {loan.totalInterestAmount ? formatCurrency(loan.totalInterestAmount) : 'As per schedule'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Per Installment Repayment:</span>
                <span className="font-extrabold text-cyan-800">
                  {loan.installmentAmount
                    ? `${formatCurrency(loan.installmentAmount)} / ${
                        loan.installmentType === 'DAILY' ? 'Day' : loan.installmentType === 'WEEKLY' ? 'Week' : 'Month'
                      }`
                    : formatCurrency(loan.principalAmount / (loan.tenureMonths || 12))}
                </span>
              </div>
            </div>
          </div>

          {/* Article III: Mortgage Details (If applicable) */}
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

          {/* Article IV: Annexure - Verified Aadhaar & PAN Card Proof Pictures */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article IV: KYC Proof Annexure (Aadhaar & PAN Identification)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Aadhaar Card Frame */}
              <div className="p-2 bg-slate-50 border border-slate-300 rounded">
                <div className="flex items-center justify-between border-b pb-0.5 mb-1">
                  <span className="font-bold text-[10px] uppercase">Aadhaar Card Attachment</span>
                  <span className="text-[9px] font-mono font-bold text-slate-600">Aadhaar: {loan.customer.aadhaar}</span>
                </div>
                <div className="h-32 border bg-white rounded flex items-center justify-center overflow-hidden p-1">
                  {aadhaarDocs.length > 0 && aadhaarDocs[0].fileUrl ? (
                    <img src={aadhaarDocs[0].fileUrl} alt="Aadhaar Card" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-[10px] text-slate-400">
                      Aadhaar Card Copy Verified (Aadhaar: {loan.customer.aadhaar})
                    </div>
                  )}
                </div>
              </div>

              {/* PAN Card Frame */}
              <div className="p-2 bg-slate-50 border border-slate-300 rounded">
                <div className="flex items-center justify-between border-b pb-0.5 mb-1">
                  <span className="font-bold text-[10px] uppercase">PAN Card Attachment</span>
                  <span className="text-[9px] font-mono font-bold text-slate-600">PAN: {loan.customer.pan || 'N/A'}</span>
                </div>
                <div className="h-32 border bg-white rounded flex items-center justify-center overflow-hidden p-1">
                  {panDocs.length > 0 && panDocs[0].fileUrl ? (
                    <img src={panDocs[0].fileUrl} alt="PAN Card" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-[10px] text-slate-400">
                      PAN Card Copy Verified (PAN: {loan.customer.pan || 'N/A'})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Article V: Signatures */}
          <div className="pt-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Article V: Execution Signatures
            </h2>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border-t border-slate-400 pt-1 text-center">
                <span className="font-bold block text-xs">{loan.customer.name}</span>
                <span className="text-[10px] text-slate-500">BORROWER / DEBTOR</span>
              </div>
              <div className="border-t border-slate-400 pt-1 text-center">
                <span className="font-bold block text-xs">For {companyName}</span>
                <span className="text-[10px] text-slate-500">AUTHORIZED LENDER SIGNATORY</span>
              </div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

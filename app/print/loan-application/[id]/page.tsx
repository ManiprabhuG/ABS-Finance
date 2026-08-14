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

  const documents = loan.customer.documents || [];
  const aadhaarDocs = documents.filter(
    (d) => d.category === 'AADHAAR' || d.title.toLowerCase().includes('aadhaar')
  );
  const panDocs = documents.filter(
    (d) => d.category === 'PAN' || d.title.toLowerCase().includes('pan')
  );
  const otherDocs = documents.filter(
    (d) => !aadhaarDocs.includes(d) && !panDocs.includes(d)
  );

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

          {/* Section 2: Loan Requirements & Repayment Breakdown */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              2. Requested Loan Facility & Repayment Plan
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
                <span className="text-slate-500 block">Installment Frequency:</span>
                <span className="font-bold text-brand-700 uppercase">
                  {loan.installmentType || 'MONTHLY'} ({loan.tenureValue || loan.tenureMonths}{' '}
                  {loan.installmentType === 'DAILY' ? 'Days' : loan.installmentType === 'WEEKLY' ? 'Weeks' : 'Months'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Interest Rate (% p.a.):</span>
                <span className="font-bold text-emerald-700">{loan.interestRate}% p.a. ({loan.interestType})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Per Installment Amount:</span>
                <span className="font-extrabold text-cyan-800 text-sm">
                  {loan.installmentAmount
                    ? `${formatCurrency(loan.installmentAmount)} / ${
                        loan.installmentType === 'DAILY' ? 'Day' : loan.installmentType === 'WEEKLY' ? 'Week' : 'Month'
                      }`
                    : formatCurrency(loan.principalAmount / (loan.tenureMonths || 12))}
                </span>
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

          {/* Section 4: Verified KYC & Document Proof Pictures */}
          <div className="break-before-auto">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              4. Attached KYC Document & Identity Proof Pictures
            </h2>

            <div className="space-y-4">
              {/* Mandatory Aadhaar and PAN Proof Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aadhaar Card Proof */}
                <div className="p-3 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-xs uppercase text-slate-800">Aadhaar Card Proof</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Verified KYC
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">Number: {loan.customer.aadhaar}</div>
                  <div className="h-44 border border-slate-300 bg-white rounded flex items-center justify-center overflow-hidden p-1">
                    {aadhaarDocs.length > 0 && aadhaarDocs[0].fileUrl ? (
                      <img
                        src={aadhaarDocs[0].fileUrl}
                        alt="Aadhaar Card Proof"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <div className="font-bold text-xs">Aadhaar Card Attached</div>
                        <div className="text-[10px]">Aadhaar No: {loan.customer.aadhaar}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAN Card Proof */}
                <div className="p-3 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-xs uppercase text-slate-800">PAN Card Proof</span>
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Verified Tax ID
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">Number: {loan.customer.pan || 'N/A'}</div>
                  <div className="h-44 border border-slate-300 bg-white rounded flex items-center justify-center overflow-hidden p-1">
                    {panDocs.length > 0 && panDocs[0].fileUrl ? (
                      <img
                        src={panDocs[0].fileUrl}
                        alt="PAN Card Proof"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <div className="font-bold text-xs">PAN Card Attached</div>
                        <div className="text-[10px]">PAN No: {loan.customer.pan || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Attached Proof Documents */}
              {otherDocs.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-700 mb-2">Additional Uploaded Proof Documents:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {otherDocs.map((doc) => (
                      <div key={doc.id} className="p-2 border rounded-lg bg-slate-50 space-y-1">
                        <div className="font-bold text-[11px] text-slate-800 truncate">{doc.title}</div>
                        <div className="text-[9px] text-slate-500 font-mono uppercase">{doc.category}</div>
                        {doc.fileUrl && doc.fileUrl.startsWith('data:image') && (
                          <div className="h-28 border bg-white rounded overflow-hidden p-1 flex items-center justify-center">
                            <img src={doc.fileUrl} alt={doc.title} className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Applicant Declaration & Signatures */}
          <div className="pt-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              5. Declaration & Authorization Signatures
            </h2>
            <p className="text-[11px] text-slate-600 mb-8 leading-relaxed">
              I hereby declare that all information provided in this loan application form is true and accurate to the best of my knowledge. I authorize {settings?.companyName || 'ABS Finance Management Ltd.'} to verify my KYC documents, PAN, and Aadhaar identity records.
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

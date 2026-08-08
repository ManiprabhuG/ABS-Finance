import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function LoanApprovalPrintPage({ params }: { params: Promise<{ id: string }> }) {
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
      <PrintToolbar documentTitle={`Loan Approval Sanction - ${loan.loanNumber}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Official Loan Approval & Sanction Advice"
          documentNumber={loan.loanNumber}
          settings={settings}
        />

        <div className="space-y-6">
          {/* Section 1: Customer Details */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Customer & Account Identifier
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Customer Name:</span>
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
                <span className="text-slate-500 block">Aadhaar #:</span>
                <span className="font-mono font-semibold">{loan.customer.aadhaar}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PAN #:</span>
                <span className="font-mono font-semibold">{loan.customer.pan || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sanction Date:</span>
                <span className="font-semibold">{formatDate(loan.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Approved Loan Sanction Terms */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              2. Credit Sanction Terms & Limits
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <div>
                <span className="text-slate-500 block">Sanction Status:</span>
                <span className="font-extrabold text-emerald-800 text-sm uppercase">{loan.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Approved Principal Amount:</span>
                <span className="font-extrabold text-slate-900 text-base">{formatCurrency(loan.principalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Approved Interest Rate:</span>
                <span className="font-extrabold text-emerald-700">{loan.interestRate}% p.a. ({loan.interestType})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tenure Period:</span>
                <span className="font-bold text-slate-900">{loan.tenureMonths} Months</span>
              </div>
              <div>
                <span className="text-slate-500 block">Disbursement Mode:</span>
                <span className="font-bold text-slate-900">{loan.disbursedFrom || 'BANK_TRANSFER'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Loan Facility Type:</span>
                <span className="font-bold text-slate-900">{loan.loanType} LOAN</span>
              </div>
            </div>
          </div>

          {/* Section 3: Approving Officer Remarks */}
          {loan.notes && (
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                3. Credit Underwriting & Approving Remarks
              </h2>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                {loan.notes}
              </div>
            </div>
          )}
        </div>

        <PrintFooter signatureRequired={true} />
      </main>
    </div>
  );
}

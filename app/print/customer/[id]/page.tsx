import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function CustomerPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer, settings] = await Promise.all([
    db.customer.findUnique({
      where: { id },
      include: {
        loans: true,
        collections: true,
      },
    }),
    db.systemSettings.findFirst(),
  ]);

  if (!customer) notFound();

  const totalLoans = customer.loans.length;
  const activeLoans = customer.loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
  const closedLoans = customer.loans.filter((l) => l.status === 'CLOSED').length;
  const totalOutstanding = customer.loans.reduce((sum, l) => sum + l.outstandingBalance, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle={`Customer Profile - ${customer.name}`} />

      <main className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="Customer Master Profile"
          documentNumber={customer.customerId}
          settings={settings}
        />

        {/* Customer Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Customer Personal & Identity Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Customer ID:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{customer.customerId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile Number:</span>
                <span className="font-semibold text-slate-800">{customer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Aadhaar Number:</span>
                <span className="font-mono font-semibold text-slate-800">{customer.aadhaar}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PAN Number:</span>
                <span className="font-mono font-semibold text-slate-800">{customer.pan || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registration Date:</span>
                <span className="font-semibold text-slate-800">{formatDate(customer.createdAt)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Residential Address:</span>
                <span className="font-semibold text-slate-800">{customer.address}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Occupation / Profession:</span>
                <span className="font-semibold text-slate-800">{customer.occupation || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Nominee Details */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              2. Nominee & Next of Kin
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nominee Name:</span>
                <span className="font-semibold">{customer.nomineeName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Relationship:</span>
                <span className="font-semibold">{customer.nomineeRelation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nominee Mobile:</span>
                <span className="font-semibold">{customer.nomineeMobile || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Loan Portfolio Summary */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              3. Customer Financial & Loan Portfolio Summary
            </h2>
            <div className="grid grid-cols-4 gap-4 text-center bg-slate-900 text-white p-4 rounded-xl font-mono">
              <div>
                <div className="text-[10px] text-slate-400">Total Loans</div>
                <div className="text-lg font-black">{totalLoans}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Active Loans</div>
                <div className="text-lg font-black text-emerald-400">{activeLoans}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Closed Loans</div>
                <div className="text-lg font-black text-slate-300">{closedLoans}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Total Outstanding</div>
                <div className="text-lg font-black text-amber-400">{formatCurrency(totalOutstanding)}</div>
              </div>
            </div>
          </div>

          {/* Associated Loans List */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              4. Loan Accounts List
            </h2>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase">
                <tr>
                  <th className="p-2 border border-slate-300">Loan #</th>
                  <th className="p-2 border border-slate-300">Type</th>
                  <th className="p-2 border border-slate-300">Principal Amount</th>
                  <th className="p-2 border border-slate-300">Interest Rate</th>
                  <th className="p-2 border border-slate-300">Outstanding</th>
                  <th className="p-2 border border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.loans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500">No loan accounts registered</td>
                  </tr>
                ) : (
                  customer.loans.map((l) => (
                    <tr key={l.id} className="border border-slate-200">
                      <td className="p-2 font-mono font-bold">{l.loanNumber}</td>
                      <td className="p-2">{l.loanType}</td>
                      <td className="p-2 font-bold">{formatCurrency(l.principalAmount)}</td>
                      <td className="p-2">{l.interestRate}% ({l.interestType})</td>
                      <td className="p-2 font-bold text-slate-900">{formatCurrency(l.outstandingBalance)}</td>
                      <td className="p-2 font-semibold">{l.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <PrintFooter signatureRequired={true} />
      </main>
    </div>
  );
}

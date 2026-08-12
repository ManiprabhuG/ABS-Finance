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
        documents: true,
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
          documentTitle="Customer Master Profile & Audit Record"
          documentNumber={customer.customerId}
          settings={settings}
        />

        {/* Customer Information with Official Photo Box */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              1. Customer Personal & Identity Details
            </h2>

            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
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
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-500 block">Residential Address:</span>
                  <span className="font-semibold text-slate-800">{customer.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Occupation / Profession:</span>
                  <span className="font-semibold text-slate-800">{customer.occupation || 'N/A'}</span>
                </div>
              </div>

              {/* Official Customer Passport Photo Frame for Printout */}
              <div className="w-28 h-32 border-2 border-slate-400 p-1 flex flex-col items-center justify-center bg-slate-50 flex-shrink-0 self-center sm:self-start">
                {customer.photoUrl ? (
                  <img
                    src={customer.photoUrl}
                    alt={customer.name}
                    className="w-full h-full object-cover rounded-none"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 text-center uppercase font-bold p-2">
                    Affix Customer Passport Photo
                  </div>
                )}
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

          {/* Verification Proof Documents List */}
          {customer.documents && customer.documents.length > 0 && (
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                3. Attached KYC & Identity Proof Records
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {customer.documents.map((doc: any) => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{doc.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Portfolio Summary */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              4. Associated Loan Portfolio Summary
            </h2>
            <div className="grid grid-cols-4 gap-4 text-xs mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-center">
                <span className="text-slate-500 block">Total Facilities</span>
                <span className="font-bold text-slate-900 text-sm">{totalLoans}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border text-center">
                <span className="text-slate-500 block">Active / Overdue</span>
                <span className="font-bold text-emerald-700 text-sm">{activeLoans}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border text-center">
                <span className="text-slate-500 block">Closed Facilities</span>
                <span className="font-bold text-slate-900 text-sm">{closedLoans}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border text-center">
                <span className="text-slate-500 block">Total Outstanding</span>
                <span className="font-bold text-brand-700 text-sm">{formatCurrency(totalOutstanding)}</span>
              </div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function LocationCollectionsPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (params.from) {
    fromDate = new Date(params.from);
    fromDate.setHours(0, 0, 0, 0);
  }
  if (params.to) {
    toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
  }
  const dateFilter = fromDate || toDate ? { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } : undefined;

  const [loans, settings] = await Promise.all([
    db.loan.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        outstandingBalance: { gt: 0 },
        ...(dateFilter && { loanDate: dateFilter }),
      },
      include: { customer: true },
      orderBy: { outstandingBalance: 'desc' },
    }),
    db.systemSettings.findFirst(),
  ]);

  // Group by location/area
  const locationMap: Record<string, { location: string; count: number; total: number; items: any[] }> = {};
  loans.forEach((loan) => {
    const address = loan.customer?.address || 'Central District';
    const parts = address.split(',');
    const locKey = (parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim()) || 'Central Region';

    if (!locationMap[locKey]) {
      locationMap[locKey] = { location: locKey, count: 0, total: 0, items: [] };
    }
    locationMap[locKey].count += 1;
    locationMap[locKey].total += loan.outstandingBalance;
    locationMap[locKey].items.push(loan);
  });

  const locationsList = Object.values(locationMap).sort((a, b) => b.total - a.total);
  const grandTotal = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="Location & Branch Pending Recovery Report" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="LOCATION & BRANCH-WISE PENDING RECOVERY REPORT"
          documentNumber={`LOC-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-slate-700 flex justify-between font-mono">
            <span>Total Location Clusters: {locationsList.length}</span>
            <span>Total Arrears Balance: {formatCurrency(grandTotal)}</span>
          </div>

          {locationsList.map((loc, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center bg-slate-100 p-2 border border-slate-300 font-bold text-slate-800">
                <span>Cluster #{idx + 1}: {loc.location} ({loc.count} Borrowers)</span>
                <span className="font-mono text-rose-700">Total Due: {formatCurrency(loc.total)}</span>
              </div>
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-50 font-bold uppercase text-[9px]">
                  <tr>
                    <th className="p-1.5 border border-slate-300">Loan No</th>
                    <th className="p-1.5 border border-slate-300">Borrower</th>
                    <th className="p-1.5 border border-slate-300">Address</th>
                    <th className="p-1.5 border border-slate-300">Contact</th>
                    <th className="p-1.5 border border-slate-300 text-right">Outstanding (₹)</th>
                    <th className="p-1.5 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {loc.items.map((loan) => (
                    <tr key={loan.id}>
                      <td className="p-1.5 font-bold text-slate-900">{loan.loanNumber}</td>
                      <td className="p-1.5 font-sans font-semibold text-slate-800">{loan.customer?.name}</td>
                      <td className="p-1.5 font-sans text-slate-600 truncate max-w-[200px]">{loan.customer?.address}</td>
                      <td className="p-1.5 text-slate-700">{loan.customer?.mobile}</td>
                      <td className="p-1.5 text-right font-bold text-rose-700">{formatCurrency(loan.outstandingBalance)}</td>
                      <td className="p-1.5 text-center font-sans text-[10px]">
                        {loan.status} {loan.npaDays > 0 ? `(${loan.npaDays}d)` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <PrintFooter />
      </main>
    </div>
  );
}

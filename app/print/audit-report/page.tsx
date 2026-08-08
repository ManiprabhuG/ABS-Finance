import React from 'react';
import { db } from '@/lib/db';
import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintToolbar } from '@/components/print/PrintToolbar';
import { formatDate } from '@/lib/export-utils';

export const revalidate = 0;

export default async function AuditReportPrintPage() {
  const [logs, settings] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.systemSettings.findFirst(),
  ]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      <PrintToolbar documentTitle="System Audit & Security Trail Log" />

      <main className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-xl print:shadow-none rounded-2xl print:rounded-none border print:border-none border-slate-200">
        <PrintHeader
          documentTitle="System Security & Compliance Audit Log"
          documentNumber={`AUD-${new Date().toISOString().split('T')[0]}`}
          settings={settings}
        />

        <div className="space-y-6">
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Timestamp</th>
                <th className="p-2 border border-slate-300">User Account</th>
                <th className="p-2 border border-slate-300">Action Type</th>
                <th className="p-2 border border-slate-300">Module</th>
                <th className="p-2 border border-slate-300">Audit Trail Details</th>
                <th className="p-2 border border-slate-300">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">No audit log entries found</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="p-2 font-sans text-slate-600">{formatDate(l.createdAt)}</td>
                    <td className="p-2 font-bold text-brand-700">@{l.username}</td>
                    <td className="p-2 font-bold text-slate-900">{l.action}</td>
                    <td className="p-2 font-semibold">{l.module}</td>
                    <td className="p-2 font-sans text-slate-800">{l.details}</td>
                    <td className="p-2 text-slate-500">{l.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PrintFooter printedBy="Compliance & Security Officer" />
      </main>
    </div>
  );
}

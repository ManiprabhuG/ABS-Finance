import React from 'react';

interface PrintHeaderProps {
  documentTitle: string;
  documentNumber?: string;
  settings?: any;
  branchName?: string;
}

export function PrintHeader({
  documentTitle,
  documentNumber,
  settings,
  branchName = 'Main Mumbai HQ',
}: PrintHeaderProps) {
  const companyName = settings?.companyName || 'ABS Finance Management Ltd.';
  const address = settings?.address || 'Suite 401, Financial Tower, Bandra Kurla Complex, Mumbai 400051';
  const phone = settings?.contactPhone || '+91 98765 43210';
  const email = settings?.contactEmail || 'contact@absfinance.com';
  const gst = settings?.gstNumber || '27AAACA1234B1Z9';

  return (
    <div className="border-b-2 border-slate-900 pb-4 mb-6">
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-900 text-white font-black text-xl flex items-center justify-center rounded-xl tracking-wider">
            ABS
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              {companyName}
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-lg">
              {address}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Phone: {phone} | Email: {email} | GSTIN: {gst}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs uppercase tracking-wider rounded">
            {documentTitle}
          </div>
          {documentNumber && (
            <div className="text-xs font-mono font-bold text-slate-700 mt-1">
              Doc #: {documentNumber}
            </div>
          )}
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Branch: {branchName}
          </div>
        </div>
      </div>
    </div>
  );
}

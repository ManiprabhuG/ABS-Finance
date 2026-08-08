'use client';

import React from 'react';
import { Printer, Download, ArrowLeft, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PrintToolbarProps {
  documentTitle: string;
}

export function PrintToolbar({ documentTitle }: PrintToolbarProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="no-print sticky top-0 z-50 bg-slate-900 text-white px-6 py-3 shadow-lg flex items-center justify-between border-b border-slate-800 mb-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">| Print Preview:</span>
        <h2 className="font-bold text-sm text-white">{documentTitle}</h2>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Document</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Save as PDF</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { X, Printer, Download } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  printUrl: string;
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  title,
  printUrl,
}: PrintPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // BUG-014 FIX: ESC key closes modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !printUrl) return null;

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  // BUG-013 FIX: Save as PDF opens iframe URL in new tab so user can use browser Save as PDF
  const handleSaveAsPdf = () => {
    const pdfWindow = window.open(printUrl, '_blank');
    if (pdfWindow) {
      // Wait for page to load then trigger print dialog with PDF option
      pdfWindow.addEventListener('load', () => {
        setTimeout(() => {
          pdfWindow.print();
        }, 500);
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} // Click outside to close
    >
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{title}</h3>
              <p className="text-xs text-slate-400">Live Print & PDF Preview · Press ESC to close</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            {/* BUG-013 FIX: Save as PDF opens in new tab and triggers print to PDF */}
            <button
              onClick={handleSaveAsPdf}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Preview (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Iframe */}
        <div className="flex-1 bg-slate-950 p-4 overflow-hidden flex items-center justify-center">
          <iframe
            ref={iframeRef}
            src={printUrl}
            className="w-full h-full rounded-2xl bg-white border-0 shadow-inner"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}

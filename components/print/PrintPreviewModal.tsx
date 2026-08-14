'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Reset loading state whenever modal opens or printUrl changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIsPrinting(false);
    }
  }, [isOpen, printUrl]);

  // ESC key closes modal
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
    setIsPrinting(true);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
    setTimeout(() => setIsPrinting(false), 800);
  };

  const handleSaveAsPdf = () => {
    setIsPrinting(true);
    const pdfWindow = window.open(printUrl, '_blank');
    if (pdfWindow) {
      pdfWindow.addEventListener('load', () => {
        setTimeout(() => {
          pdfWindow.print();
          setIsPrinting(false);
        }, 300);
      });
    } else {
      setIsPrinting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} // Click outside to close
    >
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              ) : (
                <Printer className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{title}</h3>
              <p className="text-xs text-slate-400">
                {isLoading ? 'Preparing document preview...' : 'Live Print & PDF Preview · Press ESC to close'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              disabled={isLoading || isPrinting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
            >
              {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>{isPrinting ? 'Printing...' : 'Print Document'}</span>
            </button>

            <button
              onClick={handleSaveAsPdf}
              disabled={isLoading || isPrinting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
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

        {/* Modal Body / Iframe Container */}
        <div className="flex-1 bg-slate-950 p-4 overflow-hidden relative flex items-center justify-center">
          {/* Instant Loading Skeleton */}
          {isLoading && (
            <div className="absolute inset-4 z-10 bg-white rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <div className="text-slate-800 font-bold text-sm">Generating Print Preview...</div>
              <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
              <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
              <div className="w-2/3 h-4 bg-slate-200 rounded"></div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={printUrl}
            onLoad={() => setIsLoading(false)}
            className={`w-full h-full rounded-2xl bg-white border-0 shadow-inner transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            title={title}
          />
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { Shield, Eye, Lock, AlertTriangle, X, FileText, Download, Clock } from 'lucide-react';

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    category: string;
    fileUrl: string;
    isEncrypted?: boolean;
    watermarkText?: string;
    expiryDate?: string | null;
    viewCount?: number;
  } | null;
}

export function DocumentVaultModal({ isOpen, onClose, document }: DocumentVaultModalProps) {
  const [viewCount, setViewCount] = useState(document?.viewCount || 0);

  if (!isOpen || !document) return null;

  const handleView = () => {
    setViewCount((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {document.title}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {document.category}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Encrypted Document Vault Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confidential Security Banner */}
        <div className="bg-amber-500/10 border-y border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Watermarked & Protected. Unauthorized redistribution is audited.</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {viewCount} Views
            </span>
            {document.expiryDate && (
              <span className="flex items-center gap-1 text-amber-400 font-mono">
                <Clock className="w-3.5 h-3.5" /> Exp: {new Date(document.expiryDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Document Viewer Box with Dynamic Overlay Watermark */}
        <div className="relative flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[350px] overflow-hidden select-none">
          {/* Dynamic Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] rotate-[-25deg] text-slate-100 font-black text-2xl tracking-widest text-center whitespace-pre-wrap">
            {document.watermarkText || 'CONFIDENTIAL - ABS FINANCE MANAGEMENT'}
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-brand-400 shadow-xl">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">{document.title}</div>
              <div className="text-xs text-slate-500 font-mono mt-1">AES-256 Encrypted File Path</div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleView}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center space-x-2 transition shadow-lg shadow-brand-600/30"
              >
                <Eye className="w-4 h-4" />
                <span>Decrypt & View Document</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span>Document ID: {document.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}

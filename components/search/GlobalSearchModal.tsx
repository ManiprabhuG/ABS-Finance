'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, DollarSign, X, FileText } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  type: 'customer' | 'loan' | 'collection';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [custRes, loanRes] = await Promise.all([
          fetch(`/api/customers?q=${encodeURIComponent(query)}`).then((r) => r.json()),
          fetch(`/api/loans?q=${encodeURIComponent(query)}`).then((r) => r.json()),
        ]);

        const list: SearchResult[] = [];

        if (Array.isArray(custRes)) {
          custRes.slice(0, 4).forEach((c: any) => {
            list.push({
              type: 'customer',
              id: c.id,
              title: `${c.name} (${c.customerId})`,
              subtitle: `Mobile: ${c.mobile} | Aadhaar: ${c.aadhaar}`,
              url: `/customers?id=${c.id}`,
            });
          });
        }

        if (Array.isArray(loanRes)) {
          loanRes.slice(0, 4).forEach((l: any) => {
            list.push({
              type: 'loan',
              id: l.id,
              title: `${l.loanNumber} - ${l.customer?.name || 'Customer'}`,
              subtitle: `${l.loanType} Loan | ₹${l.principalAmount.toLocaleString()} | Status: ${l.status}`,
              url: `/loans?id=${l.id}`,
            });
          });
        }

        setResults(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search customers by name/mobile/aadhaar, loans by loan number... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3">
          {loading && (
            <div className="p-6 text-center text-slate-500 text-sm">Searching records...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">No matching customers or loans found</div>
          )}

          {!query && (
            <div className="p-6 text-center text-slate-400 text-sm">
              Type keywords to search across Customer Master & Active Loan Files
            </div>
          )}

          {results.map((res) => (
            <Link
              key={`${res.type}-${res.id}`}
              href={res.url}
              onClick={onClose}
              className="flex items-center p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer mb-1"
            >
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mr-3">
                {res.type === 'customer' ? <User className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-600">
                  {res.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{res.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

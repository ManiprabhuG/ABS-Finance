'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Trash2, ShieldCheck, CheckCircle2, Eye, Edit, X } from 'lucide-react';
import { formatCurrency } from '@/lib/export-utils';

export default function SlabsPage() {
  const [interestSlabs, setInterestSlabs] = useState<any[]>([]);
  const [ltvSlabs, setLtvSlabs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ltv' | 'interest'>('ltv');
  const [loading, setLoading] = useState(true);

  // Form State
  const [ltvForm, setLtvForm] = useState({ ltvRange: '', minLtv: '', maxLtv: '', interestRate: '' });
  const [intForm, setIntForm] = useState({ name: '', fromAmount: '', toAmount: '', interestRate: '' });

  const [editingLtv, setEditingLtv] = useState<any | null>(null);
  const [editingInt, setEditingInt] = useState<any | null>(null);
  const [selectedViewSlab, setSelectedViewSlab] = useState<{ type: string; data: any } | null>(null);

  const fetchSlabs = async () => {
    setLoading(true);
    try {
      const [intRes, ltvRes] = await Promise.all([
        fetch('/api/slabs/interest').then((r) => r.json()),
        fetch('/api/slabs/ltv').then((r) => r.json()),
      ]);

      if (Array.isArray(intRes)) setInterestSlabs(intRes);
      if (Array.isArray(ltvRes)) setLtvSlabs(ltvRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  const handleAddLtvSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLtv ? `/api/slabs/ltv/${editingLtv.id}` : '/api/slabs/ltv';
      const method = editingLtv ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ltvForm),
      });

      if (res.ok) {
        setLtvForm({ ltvRange: '', minLtv: '', maxLtv: '', interestRate: '' });
        setEditingLtv(null);
        fetchSlabs();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteLtvSlab = async (id: string) => {
    if (!confirm('Are you sure you want to delete this LTV slab?')) return;
    await fetch(`/api/slabs/ltv/${id}`, { method: 'DELETE' });
    fetchSlabs();
  };

  const handleDeleteIntSlab = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interest slab?')) return;
    await fetch(`/api/slabs/interest/${id}`, { method: 'DELETE' });
    fetchSlabs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-brand-600" /> Interest & LTV Slab Management
        </h1>
        <p className="text-xs text-slate-500">
          Configure rule engines for automated Loan-to-Value (LTV) interest suggestions and principal amount slabs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('ltv')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'ltv'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          LTV Interest Slabs (Mortgage Slabs)
        </button>
        <button
          onClick={() => setActiveTab('interest')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'interest'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Amount Interest Slabs
        </button>
      </div>

      {/* LTV Slabs Tab */}
      {activeTab === 'ltv' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="p-4">LTV Range</th>
                  <th className="p-4">Min LTV %</th>
                  <th className="p-4">Max LTV %</th>
                  <th className="p-4">Interest Rate (% p.a.)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {ltvSlabs.map((s) => (
                  <tr key={s.id}>
                    <td className="p-4 font-bold text-violet-600">{s.ltvRange}</td>
                    <td className="p-4 font-mono">{s.minLtv}%</td>
                    <td className="p-4 font-mono">{s.maxLtv}%</td>
                    <td className="p-4 font-extrabold text-emerald-600">{s.interestRate}%</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedViewSlab({ type: 'LTV Interest Slab', data: s })}
                          className="p-1 rounded text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLtv(s);
                            setLtvForm({
                              ltvRange: s.ltvRange,
                              minLtv: s.minLtv?.toString() || '',
                              maxLtv: s.maxLtv?.toString() || '',
                              interestRate: s.interestRate?.toString() || '',
                            });
                          }}
                          className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                          title="Edit Slab"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLtvSlab(s.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title="Delete Slab"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {editingLtv ? 'Edit LTV Interest Slab' : 'Add New LTV Interest Slab'}
            </h3>
            <form onSubmit={handleAddLtvSlab} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="LTV Range Name (e.g. 0-40%)"
                value={ltvForm.ltvRange}
                onChange={(e) => setLtvForm({ ...ltvForm, ltvRange: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  placeholder="Min LTV %"
                  value={ltvForm.minLtv}
                  onChange={(e) => setLtvForm({ ...ltvForm, minLtv: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
                <input
                  type="number"
                  required
                  placeholder="Max LTV %"
                  value={ltvForm.maxLtv}
                  onChange={(e) => setLtvForm({ ...ltvForm, maxLtv: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>
              <input
                type="number"
                step="0.1"
                required
                placeholder="Interest Rate (% p.a.)"
                value={ltvForm.interestRate}
                onChange={(e) => setLtvForm({ ...ltvForm, interestRate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-emerald-600"
              />
              <button
                type="submit"
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow text-xs"
              >
                {editingLtv ? 'Update LTV Slab' : 'Save LTV Slab'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Amount Slabs Tab */}
      {activeTab === 'interest' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                <th className="p-4">Slab Name</th>
                <th className="p-4">From Amount</th>
                <th className="p-4">To Amount</th>
                <th className="p-4">Interest Rate (% p.a.)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {interestSlabs.map((s) => (
                <tr key={s.id}>
                  <td className="p-4 font-semibold">{s.name}</td>
                  <td className="p-4 font-mono">{formatCurrency(s.fromAmount)}</td>
                  <td className="p-4 font-mono">{formatCurrency(s.toAmount)}</td>
                  <td className="p-4 font-extrabold text-emerald-600">{s.interestRate}%</td>
                  <td className="p-4 text-xs font-semibold text-emerald-600">{s.status}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => setSelectedViewSlab({ type: 'Amount Interest Slab', data: s })}
                        className="p-1 rounded text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIntSlab(s.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                        title="Delete Slab"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slab View Modal */}
      {selectedViewSlab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-600" /> {selectedViewSlab.type} Details
              </h3>
              <button onClick={() => setSelectedViewSlab(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
              {Object.entries(selectedViewSlab.data).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-400 capitalize">{k}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedViewSlab(null)}
                className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl shadow text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

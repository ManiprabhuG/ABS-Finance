'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    gstNumber: '',
    contactPhone: '',
    contactEmail: '',
    loanPrefix: 'LN',
    receiptPrefix: 'COL',
    defaultPenalty: '2.0',
    gracePeriodDays: '5',
    financialYear: '2026-2027',
    currencySymbol: '₹',
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setFormData({
            companyName: data.companyName || '',
            address: data.address || '',
            gstNumber: data.gstNumber || '',
            contactPhone: data.contactPhone || '',
            contactEmail: data.contactEmail || '',
            loanPrefix: data.loanPrefix || 'LN',
            receiptPrefix: data.receiptPrefix || 'COL',
            defaultPenalty: data.defaultPenalty?.toString() || '2.0',
            gracePeriodDays: data.gracePeriodDays?.toString() || '5',
            financialYear: data.financialYear || '2026-2027',
            currencySymbol: data.currencySymbol || '₹',
          });
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMsg('Settings updated successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update settings');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" /> System & Company Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure financial year, company defaults, loan/receipt prefixes, penalty rules, and branch preferences.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-sm">
        {/* Company Info */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Building className="w-4 h-4 text-brand-600" /> Company Profile Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Company / NBFC Name *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">GST / Tax Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Registered Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Loan & Finance Defaults */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Operational & Penalty Defaults
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Loan Number Prefix</label>
              <input
                type="text"
                value={formData.loanPrefix}
                onChange={(e) => setFormData({ ...formData, loanPrefix: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Receipt Prefix</label>
              <input
                type="text"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Financial Year</label>
              <input
                type="text"
                value={formData.financialYear}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Default Penalty Rate (% per month)</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultPenalty}
                onChange={(e) => setFormData({ ...formData, defaultPenalty: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Grace Period (Days)</label>
              <input
                type="number"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md flex items-center space-x-2 text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

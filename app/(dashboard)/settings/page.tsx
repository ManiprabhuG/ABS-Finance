'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, ShieldCheck, Download, Trash2, Image, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    logoUrl: '/logo.png',
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
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setFormData({
            companyName: data.companyName || '',
            logoUrl: data.logoUrl || '/logo.png',
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
        setMsg('Settings and Company Profile updated successfully!');
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

  const handleDownloadBackup = () => {
    window.location.href = '/api/settings/backup';
  };

  const handleResetOperationalData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/settings/reset-operational-data', { method: 'POST' });
      if (res.ok) {
        alert('Operational Data Reset Complete! Loans, Collections, Ledger, and Transactions purged. Customers, Users, Slabs, and Settings preserved.');
        setShowResetModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Reset failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" /> System & Company Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure financial year, company defaults, loan/receipt prefixes, penalty rules, logo, and system backup/reset options.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {msg}
        </div>
      )}

      {/* Top Quick Actions Bar: Backup & Reset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-slate-900 to-brand-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-white">
              <Download className="w-4 h-4 text-emerald-400" /> Full System Backup
            </h3>
            <p className="text-xs text-slate-400 mt-1">Export JSON backup of database tables.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow transition-all"
          >
            Export Backup
          </button>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-rose-400">
              <Trash2 className="w-4 h-4 text-rose-400" /> Operational Data Reset
            </h3>
            <p className="text-xs text-slate-400 mt-1">Purge loans & ledger. Preserves Customers & Users.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-xl shadow transition-all"
          >
            Reset Data
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-sm">
        {/* Company Profile & Logo */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Building className="w-4 h-4 text-brand-600" /> Company Profile & Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Company / NBFC Name * (Req #1)</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-brand-500" /> Company Logo URL / Image Path
              </label>
              <input
                type="text"
                value={formData.logoUrl}
                placeholder="/logo.png or https://domain.com/logo.png"
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Contact Phone * (Req #2)</label>
              <input
                type="text"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Contact Email * (Req #3)</label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">GST / Tax Registration Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Company Registered Address * (Req #4)</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Financial Rules & Defaults */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" /> Financial Rules & Document Prefixes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Loan Number Prefix</label>
              <input
                type="text"
                value={formData.loanPrefix}
                onChange={(e) => setFormData({ ...formData, loanPrefix: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Receipt Number Prefix</label>
              <input
                type="text"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Financial Year</label>
              <input
                type="text"
                value={formData.financialYear}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Default Penalty Rate (% / Month)</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultPenalty}
                onChange={(e) => setFormData({ ...formData, defaultPenalty: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Grace Period (Days)</label>
              <input
                type="number"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-center"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      {/* Operational Reset Danger Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-white">Reset Operational Data</h3>
                <p className="text-xs text-rose-400">WARNING: Destructive Operation</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="font-semibold text-amber-400">This action WILL PURGE/DELETE:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
                <li>All Loans & Mortgage Asset details</li>
                <li>All Collection receipts & Repayments</li>
                <li>All Central Master Ledger entries</li>
                <li>All Incomes, Expenses, and Fund Transfers</li>
                <li>All Audit logs & Documents</li>
              </ul>

              <p className="font-semibold text-emerald-400 mt-2">This action WILL PRESERVE:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-emerald-300">
                <li>Customer Profiles & Identity records</li>
                <li>User Accounts & RBAC Permissions</li>
                <li>Slabs & Interest Rate configurations</li>
                <li>System & Company Settings</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetOperationalData}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{resetting ? 'Resetting Data...' : 'Confirm Purge Operational Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

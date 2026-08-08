'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, ArrowLeftRight, Plus, Building, Wallet, TrendingUp, TrendingDown, BookOpen, Search, X, Eye, Edit, Trash2, Printer, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'banks' | 'income' | 'expense'>('ledger');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printModal, setPrintModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  // Filters
  const [ledgerType, setLedgerType] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals & View/Edit items
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showEditLedgerModal, setShowEditLedgerModal] = useState(false);

  const [selectedViewItem, setSelectedViewItem] = useState<{ type: string; data: any } | null>(null);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [editingLedger, setEditingLedger] = useState<any | null>(null);

  // Transfer form — 4 Required Fields (amount, fromAccountType, toAccountType, remarks)
  const [transferData, setTransferData] = useState({
    amount: '',
    fromAccountType: 'CASH',
    fromAccountId: '',
    toAccountType: 'BANK',
    toAccountId: '',
    referenceNo: '',
    remarks: '',
  });

  // Bank form — 4 Required Fields (accountName, accountNumber, bankName, ifsc)
  const [bankFormData, setBankFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    ifsc: '',
    openingBalance: '',
  });

  // Income / Expense form — 4 Required Fields (category, amount, paymentMode, remarks)
  const [incExpForm, setIncExpForm] = useState({
    category: 'PROCESSING_FEE',
    amount: '',
    paymentMode: 'CASH',
    bankAccountId: '',
    referenceNo: '',
    remarks: '',
  });

  // Ledger edit form
  const [ledgerEditForm, setLedgerEditForm] = useState({
    remarks: '',
    referenceNo: '',
    debit: '',
    credit: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, ledgRes, incRes, expRes] = await Promise.all([
        fetch('/api/accounts').then((r) => r.json()),
        fetch(`/api/ledger?type=${ledgerType}&q=${encodeURIComponent(search)}`).then((r) => r.json()),
        fetch('/api/income').then((r) => r.json()),
        fetch('/api/expense').then((r) => r.json()),
      ]);

      if (accRes.bankAccounts) {
        setBankAccounts(accRes.bankAccounts);
        if (accRes.bankAccounts.length > 0) {
          setTransferData((prev) => ({ ...prev, toAccountId: accRes.bankAccounts[0].id }));
        }
      }
      if (accRes.cashAccount) setCashBalance(accRes.cashAccount.currentBalance);
      if (ledgRes.entries) setLedgerEntries(ledgRes.entries);
      if (Array.isArray(incRes)) setIncomes(incRes);
      if (Array.isArray(expRes)) setExpenses(expRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ledgerType, search]);

  const handleDeleteBank = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete bank account "${name}"?`)) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteLedger = async (id: string, ledgerId: string) => {
    if (!confirm(`Are you sure you want to delete master ledger entry "${ledgerId}"?`)) return;
    await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleOpenEditLedger = (entry: any) => {
    setEditingLedger(entry);
    setLedgerEditForm({
      remarks: entry.remarks || '',
      referenceNo: entry.referenceNo || '',
      debit: entry.debit?.toString() || '0',
      credit: entry.credit?.toString() || '0',
    });
    setShowEditLedgerModal(true);
  };

  const handleSaveLedgerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLedger) return;
    try {
      const res = await fetch(`/api/ledger/${editingLedger.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ledgerEditForm),
      });

      if (res.ok) {
        setShowEditLedgerModal(false);
        setEditingLedger(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update ledger entry');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteIncome = async (id: string, incomeNo: string) => {
    if (!confirm(`Are you sure you want to delete income entry "${incomeNo}"?`)) return;
    await fetch(`/api/income/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteExpense = async (id: string, expenseNo: string) => {
    if (!confirm(`Are you sure you want to delete expense entry "${expenseNo}"?`)) return;
    await fetch(`/api/expense/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleFundTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts/fund-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });

      if (res.ok) {
        setShowTransferModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Transfer failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBank ? `/api/accounts/${editingBank.id}` : '/api/accounts';
      const method = editingBank ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankFormData),
      });
      if (res.ok) {
        setShowBankModal(false);
        setEditingBank(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Bank Account save failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingIncome ? `/api/income/${editingIncome.id}` : '/api/income';
      const method = editingIncome ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incExpForm),
      });
      if (res.ok) {
        setShowIncomeModal(false);
        setEditingIncome(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Income save failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExpense ? `/api/expense/${editingExpense.id}` : '/api/expense';
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incExpForm),
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setEditingExpense(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Expense save failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-brand-600" /> Finance & Central Accounts Engine
          </h1>
          <p className="text-xs text-slate-500">
            Master Central Ledger Book, Cash in Hand & Bank Balances, Income/Expense, and Fund Transfers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Fund Transfer</span>
          </button>
          <button
            onClick={() => setShowBankModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
          >
            <Building className="w-4 h-4" />
            <span>Add Bank Account</span>
          </button>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-brand-950 p-5 rounded-2xl text-white shadow-md border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cash In Hand (System Default)</span>
            <Wallet className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-emerald-400">
            {formatCurrency(cashBalance)}
          </div>
        </div>

        {bankAccounts.map((b) => (
          <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{b.bankName}</span>
              <div className="flex items-center space-x-1">
                <button onClick={() => { setEditingBank(b); setBankFormData({ accountName: b.accountName, accountNumber: b.accountNumber, bankName: b.bankName, branch: b.branch, ifsc: b.ifsc, openingBalance: b.openingBalance.toString() }); setShowBankModal(true); }} className="p-1 text-amber-600 hover:bg-amber-50 rounded">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteBank(b.id, b.bankName)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-xl font-bold mt-1 font-mono text-slate-900 dark:text-slate-100">
              {formatCurrency(b.currentBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              A/C: {b.accountNumber} | IFSC: {b.ifsc}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'ledger'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Central Master Ledger Book
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'income'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Income Register
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'expense'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Expense Register
        </button>
      </div>

      {/* Central Ledger View */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs text-slate-900 dark:text-slate-100 w-full sm:w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">Transaction Type:</span>
              <select
                value={ledgerType}
                onChange={(e) => setLedgerType(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                <option value="ALL">All Transactions</option>
                <option value="DISBURSEMENT">Disbursements</option>
                <option value="COLLECTION">Collections</option>
                <option value="INCOME">Incomes</option>
                <option value="EXPENSE">Expenses</option>
                <option value="BANK_TRANSFER">Fund Transfers</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="p-4">Ledger ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Ref No</th>
                    <th className="p-4">Debit (₹)</th>
                    <th className="p-4">Credit (₹)</th>
                    <th className="p-4">Running Balance (₹)</th>
                    <th className="p-4">Remarks</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-sm">
                        No master ledger entries found
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">{l.ledgerId}</td>
                        <td className="p-4 text-xs text-slate-500">{formatDate(l.date)}</td>
                        <td className="p-4 font-semibold text-xs">{l.transactionType}</td>
                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300">{l.referenceNo || '-'}</td>
                        <td className="p-4 font-bold text-rose-600">
                          {l.debit > 0 ? `₹${l.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4 font-bold text-emerald-600">
                          {l.credit > 0 ? `₹${l.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          ₹{l.balanceAfter?.toLocaleString()}
                        </td>
                        <td className="p-4 text-xs text-slate-500 max-w-xs truncate">{l.remarks}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setSelectedViewItem({ type: 'Ledger Entry', data: l })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                              title="View Entry Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* REQUIREMENT 3 FIX: EDIT ICON ADDED TO CENTRAL MASTER LEDGER TABLE */}
                            <button
                              onClick={() => handleOpenEditLedger(l)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                              title="Edit Ledger Entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteLedger(l.id, l.ledgerId)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                              title="Delete Ledger Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Income Register Tab */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIncExpForm({ category: 'PROCESSING_FEE', amount: '', paymentMode: 'CASH', bankAccountId: '', referenceNo: '', remarks: '' });
                setShowIncomeModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Record Income Entry</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-xs uppercase font-semibold text-slate-500">
                  <th className="p-4">Income #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount (₹)</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {incomes.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-brand-600">{i.incomeNo}</td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(i.date)}</td>
                    <td className="p-4 font-semibold text-xs">{i.category}</td>
                    <td className="p-4 font-bold text-emerald-600">{formatCurrency(i.amount)}</td>
                    <td className="p-4 text-xs">{i.paymentMode}</td>
                    <td className="p-4 text-xs text-slate-500">{i.remarks || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setPrintModal({ isOpen: true, title: `Income Voucher - ${i.incomeNo}`, url: `/print/income-voucher/${i.id}` })} className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteIncome(i.id, i.incomeNo)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Register Tab */}
      {activeTab === 'expense' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIncExpForm({ category: 'OFFICE_RENT', amount: '', paymentMode: 'CASH', bankAccountId: '', referenceNo: '', remarks: '' });
                setShowExpenseModal(true);
              }}
              className="px-4 py-2 bg-rose-600 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense Entry</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-xs uppercase font-semibold text-slate-500">
                  <th className="p-4">Expense #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount (₹)</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-brand-600">{e.expenseNo}</td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(e.date)}</td>
                    <td className="p-4 font-semibold text-xs">{e.category}</td>
                    <td className="p-4 font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                    <td className="p-4 text-xs">{e.paymentMode}</td>
                    <td className="p-4 text-xs text-slate-500">{e.remarks || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setPrintModal({ isOpen: true, title: `Expense Voucher - ${e.expenseNo}`, url: `/print/expense-voucher/${e.id}` })} className="p-1.5 text-rose-600 hover:bg-slate-100 rounded">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteExpense(e.id, e.expenseNo)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT LEDGER ENTRY MODAL */}
      {showEditLedgerModal && editingLedger && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Edit Master Ledger Entry: {editingLedger.ledgerId}
              </h3>
              <button onClick={() => setShowEditLedgerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLedgerEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Debit Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ledgerEditForm.debit}
                  onChange={(e) => setLedgerEditForm({ ...ledgerEditForm, debit: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Credit Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ledgerEditForm.credit}
                  onChange={(e) => setLedgerEditForm({ ...ledgerEditForm, credit: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reference Number</label>
                <input
                  type="text"
                  value={ledgerEditForm.referenceNo}
                  onChange={(e) => setLedgerEditForm({ ...ledgerEditForm, referenceNo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Remarks / Audit Note * (Req #1)</label>
                <textarea
                  required
                  rows={3}
                  value={ledgerEditForm.remarks}
                  onChange={(e) => setLedgerEditForm({ ...ledgerEditForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowEditLedgerModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl font-semibold shadow">
                  Update Ledger Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Transfer Modal — 4 REQUIRED FIELDS */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-brand-600" /> Execute Inter-Account Fund Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFundTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Transfer Amount (₹) * (Req #1)</label>
                <input
                  type="number"
                  required
                  placeholder="₹ Amount"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">From Source Account * (Req #2)</label>
                <select
                  required
                  value={transferData.fromAccountType}
                  onChange={(e) => setTransferData({ ...transferData, fromAccountType: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <option value="CASH">Cash In Hand (Available: ₹{cashBalance.toLocaleString()})</option>
                  <option value="BANK">Bank Account</option>
                </select>
              </div>

              {transferData.fromAccountType === 'BANK' && (
                <div>
                  <label className="block font-semibold mb-1">Select Source Bank</label>
                  <select
                    value={transferData.fromAccountId}
                    onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.bankName} (₹{b.currentBalance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">To Destination Account * (Req #3)</label>
                <select
                  required
                  value={transferData.toAccountType}
                  onChange={(e) => setTransferData({ ...transferData, toAccountType: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <option value="BANK">Bank Account</option>
                  <option value="CASH">Cash In Hand</option>
                </select>
              </div>

              {transferData.toAccountType === 'BANK' && (
                <div>
                  <label className="block font-semibold mb-1">Select Target Bank</label>
                  <select
                    value={transferData.toAccountId}
                    onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber.slice(-4)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Transfer Remarks * (Req #4)</label>
                <input
                  type="text"
                  required
                  placeholder="Reason for transfer"
                  value={transferData.remarks}
                  onChange={(e) => setTransferData({ ...transferData, remarks: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl font-semibold shadow">
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Income / Expense Modal — 4 REQUIRED FIELDS */}
      {(showIncomeModal || showExpenseModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {showIncomeModal ? 'Record Income Entry' : 'Record Expense Entry'}
              </h3>
              <button onClick={() => { setShowIncomeModal(false); setShowExpenseModal(false); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showIncomeModal ? handleSaveIncome : handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category * (Req #1)</label>
                <input
                  type="text"
                  required
                  value={incExpForm.category}
                  onChange={(e) => setIncExpForm({ ...incExpForm, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Amount (₹) * (Req #2)</label>
                <input
                  type="number"
                  required
                  value={incExpForm.amount}
                  onChange={(e) => setIncExpForm({ ...incExpForm, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Mode * (Req #3)</label>
                <select
                  required
                  value={incExpForm.paymentMode}
                  onChange={(e) => setIncExpForm({ ...incExpForm, paymentMode: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Remarks / Voucher Note * (Req #4)</label>
                <input
                  type="text"
                  required
                  value={incExpForm.remarks}
                  onChange={(e) => setIncExpForm({ ...incExpForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => { setShowIncomeModal(false); setShowExpenseModal(false); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl font-semibold shadow">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ isOpen: false, title: '', url: '' })}
        title={printModal.title}
        printUrl={printModal.url}
      />
    </div>
  );
}

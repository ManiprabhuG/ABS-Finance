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

  const [selectedViewItem, setSelectedViewItem] = useState<{ type: string; data: any } | null>(null);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editingBank, setEditingBank] = useState<any | null>(null);

  // Transfer form
  const [transferData, setTransferData] = useState({
    amount: '',
    fromAccountType: 'CASH',
    fromAccountId: '',
    toAccountType: 'BANK',
    toAccountId: '',
    remarks: '',
  });

  // Bank form
  const [bankFormData, setBankFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    ifsc: '',
    openingBalance: '',
  });

  // Income / Expense form
  const [incExpForm, setIncExpForm] = useState({
    category: 'PROCESSING_FEE',
    amount: '',
    paymentMode: 'CASH',
    bankAccountId: '',
    remarks: '',
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
          <div className="text-2xl font-extrabold mt-2">{formatCurrency(cashBalance)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Real-time synced cash register</div>
        </div>

        {bankAccounts.map((b) => (
          <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{b.bankName}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingBank(b);
                      setBankFormData({
                        accountName: b.accountName,
                        accountNumber: b.accountNumber,
                        bankName: b.bankName,
                        branch: b.branch,
                        ifsc: b.ifsc,
                        openingBalance: b.openingBalance?.toString() || '',
                      });
                      setShowBankModal(true);
                    }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600"
                    title="Edit Bank Account"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPrintModal({ isOpen: true, title: `Bank Statement - ${b.bankName}`, url: `/print/bank-statement/${b.id}` })}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600"
                    title="Print Bank Account Statement"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBank(b.id, b.bankName)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600"
                    title="Delete Bank Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                {formatCurrency(b.currentBalance)}
              </div>
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
                setIncExpForm({ category: 'PROCESSING_FEE', amount: '', paymentMode: 'CASH', bankAccountId: '', remarks: '' });
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
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="p-4">Income No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {incomes.map((inc) => (
                  <tr key={inc.id}>
                    <td className="p-4 font-mono font-bold text-emerald-600">{inc.incomeNo}</td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(inc.date)}</td>
                    <td className="p-4 font-semibold text-xs">{inc.category}</td>
                    <td className="p-4 font-extrabold text-emerald-600">{formatCurrency(inc.amount)}</td>
                    <td className="p-4 text-xs">{inc.paymentMode}</td>
                    <td className="p-4 text-xs text-slate-500">{inc.remarks || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedViewItem({ type: 'Income Record', data: inc })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="View Income Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingIncome(inc);
                            setIncExpForm({
                              category: inc.category,
                              amount: inc.amount?.toString() || '',
                              paymentMode: inc.paymentMode || 'CASH',
                              bankAccountId: inc.bankAccountId || '',
                              remarks: inc.remarks || '',
                            });
                            setShowIncomeModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Edit Income"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(inc.id, inc.incomeNo)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete Income"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintModal({ isOpen: true, title: `Income Voucher - ${inc.incomeNo}`, url: `/print/income-voucher/${inc.id}` })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Print Income Voucher"
                        >
                          <Printer className="w-4 h-4" />
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
                setEditingExpense(null);
                setIncExpForm({ category: 'OFFICE_RENT', amount: '', paymentMode: 'CASH', bankAccountId: '', remarks: '' });
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
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="p-4">Expense No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="p-4 font-mono font-bold text-rose-600">{exp.expenseNo}</td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(exp.date)}</td>
                    <td className="p-4 font-semibold text-xs">{exp.category}</td>
                    <td className="p-4 font-extrabold text-rose-600">{formatCurrency(exp.amount)}</td>
                    <td className="p-4 text-xs">{exp.paymentMode}</td>
                    <td className="p-4 text-xs text-slate-500">{exp.remarks || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedViewItem({ type: 'Expense Record', data: exp })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="View Expense Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setIncExpForm({
                              category: exp.category,
                              amount: exp.amount?.toString() || '',
                              paymentMode: exp.paymentMode || 'CASH',
                              bankAccountId: exp.bankAccountId || '',
                              remarks: exp.remarks || '',
                            });
                            setShowExpenseModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.expenseNo)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintModal({ isOpen: true, title: `Expense Voucher - ${exp.expenseNo}`, url: `/print/expense-voucher/${exp.id}` })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Print Expense Voucher"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Fund Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-brand-600" /> Internal Fund Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFundTransfer} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">From Source *</label>
                  <select
                    value={transferData.fromAccountType}
                    onChange={(e) => setTransferData({ ...transferData, fromAccountType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="CASH">Cash In Hand</option>
                    <option value="BANK">Bank Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">To Destination *</label>
                  <select
                    value={transferData.toAccountType}
                    onChange={(e) => setTransferData({ ...transferData, toAccountType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="CASH">Cash In Hand</option>
                  </select>
                </div>
              </div>

              {transferData.fromAccountType === 'BANK' && (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Source Bank Account</label>
                  <select
                    value={transferData.fromAccountId}
                    onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {transferData.toAccountType === 'BANK' && (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Target Bank Account</label>
                  <select
                    value={transferData.toAccountId}
                    onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md"
                >
                  Execute Fund Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-600" /> Add Bank Account
              </h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-3 text-sm">
              <input
                type="text"
                required
                placeholder="Account Holder Name"
                value={bankFormData.accountName}
                onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
              <input
                type="text"
                required
                placeholder="Account Number"
                value={bankFormData.accountNumber}
                onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Bank Name (e.g. HDFC)"
                  value={bankFormData.bankName}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="IFSC Code"
                  value={bankFormData.ifsc}
                  onChange={(e) => setBankFormData({ ...bankFormData, ifsc: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>
              <input
                type="number"
                placeholder="Opening Balance (₹)"
                value={bankFormData.openingBalance}
                onChange={(e) => setBankFormData({ ...bankFormData, openingBalance: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
              />

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Record Income Entry
              </h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Income Category *</label>
                <select
                  value={incExpForm.category}
                  onChange={(e) => setIncExpForm({ ...incExpForm, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="PROCESSING_FEE">Processing Fee</option>
                  <option value="DOCUMENTATION_FEE">Documentation Fee</option>
                  <option value="SERVICE_CHARGE">Service Charges</option>
                  <option value="OTHER">Other Income</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={incExpForm.amount}
                  onChange={(e) => setIncExpForm({ ...incExpForm, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-emerald-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md"
                >
                  Post Income to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600" /> Record Expense Entry
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Expense Category *</label>
                <select
                  value={incExpForm.category}
                  onChange={(e) => setIncExpForm({ ...incExpForm, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="OFFICE_RENT">Office Rent</option>
                  <option value="SALARY">Employee Salary</option>
                  <option value="ELECTRICITY">Electricity & Utilities</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="MISC">Misc Expenses</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={incExpForm.amount}
                  onChange={(e) => setIncExpForm({ ...incExpForm, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-rose-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md"
                >
                  Post Expense to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Details View Modal */}
      {selectedViewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" /> {selectedViewItem.type} Details
              </h3>
              <button onClick={() => setSelectedViewItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 font-mono">
                {Object.entries(selectedViewItem.data).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null) return null;
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{String(val)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedViewItem(null)}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl font-medium text-xs shadow"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ ...printModal, isOpen: false })}
        title={printModal.title}
        printUrl={printModal.url}
      />
    </div>
  );
}

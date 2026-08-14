'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Building,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  X,
  Eye,
  Edit,
  Trash2,
  Printer,
  FileText,
  Calculator,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState<any | null>(null);
  const [selectedViewLoan, setSelectedViewLoan] = useState<any | null>(null);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [printModal, setPrintModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  // Form State with Installment Concepts
  const [formData, setFormData] = useState({
    customerId: '',
    loanType: 'MORTGAGE',
    principalAmount: '',
    interestType: 'FLAT',
    interestRate: '12.0',
    installmentType: 'MONTHLY', // DAILY, WEEKLY, MONTHLY
    tenureValue: '12',
    tenureMonths: '12',
    notes: '',
    // Mortgage details
    assetType: 'PROPERTY',
    assetDescription: '',
    assetValue: '',
    marketValue: '',
  });

  const [ltvSuggestion, setLtvSuggestion] = useState<any | null>(null);
  const [disburseSource, setDisburseSource] = useState<'CASH' | 'BANK'>('BANK');
  const [selectedBankId, setSelectedBankId] = useState('');

  const fetchLoans = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [loanRes, custRes, accRes] = await Promise.all([
        fetch('/api/loans').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
      ]);
      if (loanRes.error) throw new Error(loanRes.error);
      if (Array.isArray(loanRes)) setLoans(loanRes);
      if (Array.isArray(custRes)) setCustomers(custRes);
      if (accRes.bankAccounts) {
        setBankAccounts(accRes.bankAccounts);
        if (accRes.bankAccounts.length > 0) setSelectedBankId(accRes.bankAccounts[0].id);
      }
    } catch (e: any) {
      setFetchError(e.message || 'Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Calculation Helper for Interest & Repayment Breakdown
  const getRepaymentCalc = () => {
    const principal = parseFloat(formData.principalAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const tenureVal = parseInt(formData.tenureValue) || 1;
    const type = formData.installmentType || 'MONTHLY';

    let tenureYears = tenureVal / 12;
    let label = 'Month';
    let unitLabel = 'Months';

    if (type === 'DAILY') {
      tenureYears = tenureVal / 365;
      label = 'Day';
      unitLabel = 'Days';
    } else if (type === 'WEEKLY') {
      tenureYears = tenureVal / 52;
      label = 'Week';
      unitLabel = 'Weeks';
    }

    const totalInterest = Math.round(principal * (rate / 100) * tenureYears);
    const totalRepayment = principal + totalInterest;
    const perInstallment = tenureVal > 0 ? Math.round(totalRepayment / tenureVal) : 0;

    return {
      principal,
      rate,
      tenureVal,
      type,
      label,
      unitLabel,
      totalInterest,
      totalRepayment,
      perInstallment,
    };
  };

  const calc = getRepaymentCalc();

  const handleOpenEditLoan = (loan: any) => {
    setEditingLoan(loan);
    setFormData({
      customerId: loan.customerId || '',
      loanType: loan.loanType || 'MORTGAGE',
      principalAmount: loan.principalAmount?.toString() || '',
      interestType: loan.interestType || 'FLAT',
      interestRate: loan.interestRate?.toString() || '12.0',
      installmentType: loan.installmentType || 'MONTHLY',
      tenureValue: loan.tenureValue?.toString() || loan.tenureMonths?.toString() || '12',
      tenureMonths: loan.tenureMonths?.toString() || '12',
      notes: loan.notes || '',
      assetType: loan.mortgageDetail?.assetType || 'PROPERTY',
      assetDescription: loan.mortgageDetail?.assetDescription || '',
      assetValue: loan.mortgageDetail?.estimatedValue?.toString() || '',
      marketValue: loan.mortgageDetail?.marketValue?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDeleteLoan = async (id: string, loanNumber: string) => {
    if (!confirm(`Are you sure you want to delete loan record "${loanNumber}"?`)) return;
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLoans();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete loan');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // LTV Auto calculation trigger
  useEffect(() => {
    if (formData.loanType === 'MORTGAGE' && formData.principalAmount && formData.assetValue) {
      const principal = parseFloat(formData.principalAmount);
      const asset = parseFloat(formData.assetValue);
      if (principal > 0 && asset > 0) {
        fetch('/api/loans/suggest-ltv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ principalAmount: principal, assetValue: asset }),
        })
          .then((r) => r.json())
          .then((data) => {
            setLtvSuggestion(data);
            setFormData((prev) => ({ ...prev, interestRate: data.suggestedInterestRate.toString() }));
          });
      }
    }
  }, [formData.principalAmount, formData.assetValue, formData.loanType]);

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingLoan ? `/api/loans/${editingLoan.id}` : '/api/loans';
      const method = editingLoan ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        totalInterestAmount: calc.totalInterest,
        installmentAmount: calc.perInstallment,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingLoan(null);
        fetchLoans();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save loan');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisburseLoan = async () => {
    if (!showDisburseModal) return;
    setIsDisbursing(true);
    try {
      const res = await fetch(`/api/loans/${showDisburseModal.id}/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disbursedFrom: disburseSource,
          bankAccountId: disburseSource === 'BANK' ? selectedBankId : undefined,
        }),
      });

      if (res.ok) {
        setShowDisburseModal(null);
        fetchLoans();
      } else {
        const err = await res.json();
        alert(err.error || 'Disbursement failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" /> Loan Origination & Management
          </h1>
          <p className="text-xs text-slate-500">
            Process Mortgage & Personal Loans with Days-wise, Weekly, and Monthly Interest Amount calculations.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingLoan(null);
            setFormData({
              customerId: '',
              loanType: 'MORTGAGE',
              principalAmount: '',
              interestType: 'FLAT',
              interestRate: '12.0',
              installmentType: 'MONTHLY',
              tenureValue: '12',
              tenureMonths: '12',
              notes: '',
              assetType: 'PROPERTY',
              assetDescription: '',
              assetValue: '',
              marketValue: '',
            });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Loan Application</span>
        </button>
      </div>

      {fetchError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 flex items-center space-x-2 text-rose-400 text-sm">
            <span className="font-bold">⚠ Error:</span>
            <span>{fetchError}</span>
            <button onClick={fetchLoans} className="ml-auto text-xs underline hover:no-underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loans Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="p-4">Loan Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Frequency & Rate</th>
                <th className="p-4">Principal & Interest</th>
                <th className="p-4">Repayment / Installment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                      <span>Loading loan records...</span>
                    </div>
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    No loan records found
                  </td>
                </tr>
              ) : (
                loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {l.loanNumber}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                      {l.customer?.name || 'N/A'}
                      <div className="text-xs text-slate-500 font-mono">{l.customer?.customerId}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{l.loanType} LOAN</div>
                      <div className="text-slate-500">
                        {l.interestRate}% p.a. ({l.interestType})
                      </div>
                      <div className="text-brand-600 dark:text-brand-400 font-medium mt-0.5">
                        {l.installmentType || 'MONTHLY'} ({l.tenureValue || l.tenureMonths}{' '}
                        {l.installmentType === 'DAILY' ? 'Days' : l.installmentType === 'WEEKLY' ? 'Weeks' : 'Months'})
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(l.principalAmount)}
                      </div>
                      {l.totalInterestAmount && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          + {formatCurrency(l.totalInterestAmount)} Interest
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {l.installmentAmount ? (
                        <div>
                          <div className="font-extrabold text-cyan-600 dark:text-cyan-400">
                            {formatCurrency(l.installmentAmount)}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            / {l.installmentType === 'DAILY' ? 'Day' : l.installmentType === 'WEEKLY' ? 'Week' : 'Month'}
                          </div>
                        </div>
                      ) : (
                        <div className="font-bold text-cyan-600 dark:text-cyan-400">
                          {formatCurrency(l.outstandingBalance)}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
                          l.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : l.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : l.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedViewLoan(l)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="View Loan Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditLoan(l)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Edit Loan Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPrintModal({
                              isOpen: true,
                              title: `Loan Application Form - ${l.loanNumber}`,
                              url: `/print/loan-application/${l.id}`,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-violet-600 dark:text-violet-400 transition-colors"
                          title="Print Loan Application Form"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPrintModal({
                              isOpen: true,
                              title: `Loan Agreement - ${l.loanNumber}`,
                              url: `/print/loan-agreement/${l.id}`,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Print Legal Loan Agreement"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {l.status === 'PENDING' && (
                          <button
                            onClick={() => setShowDisburseModal(l)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-sm ml-1"
                          >
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Creation / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                {editingLoan ? `Edit Loan Record (${editingLoan.loanNumber})` : 'Create New Loan Application'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLoan} className="space-y-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Select Customer *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerId}) - {c.mobile}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Loan Type *</label>
                  <select
                    value={formData.loanType}
                    onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-brand-600"
                  >
                    <option value="MORTGAGE">Mortgage Loan (Collateral Backed)</option>
                    <option value="NORMAL">Normal Personal Loan</option>
                    <option value="CUSTOM">Custom Enterprise Loan</option>
                  </select>
                </div>
              </div>

              {/* Installment Type / Repayment Frequency Selector */}
              <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-3">
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" /> Repayment Frequency & Installment Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        installmentType: 'DAILY',
                        tenureValue: formData.installmentType === 'DAILY' ? formData.tenureValue : '100',
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      formData.installmentType === 'DAILY'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Days Wise (Daily)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        installmentType: 'WEEKLY',
                        tenureValue: formData.installmentType === 'WEEKLY' ? formData.tenureValue : '24',
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      formData.installmentType === 'WEEKLY'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Weekly Installment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        installmentType: 'MONTHLY',
                        tenureValue: formData.installmentType === 'MONTHLY' ? formData.tenureValue : '12',
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      formData.installmentType === 'MONTHLY'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Monthly Installment</span>
                  </button>
                </div>
              </div>

              {/* Principal Amount, Duration & Interest Rate */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Principal Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.principalAmount}
                    onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                    placeholder="e.g. 100000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Interest Type *</label>
                  <select
                    value={formData.interestType}
                    onChange={(e) => setFormData({ ...formData, interestType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  >
                    <option value="FLAT">Flat Interest</option>
                    <option value="REDUCING">Reducing Balance</option>
                    <option value="MANUAL">Manual Interest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Interest Rate (% p.a.) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Tenure Duration ({calc.unitLabel}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.tenureValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tenureValue: e.target.value,
                        tenureMonths: e.target.value,
                      })
                    }
                    placeholder={`e.g. ${formData.installmentType === 'DAILY' ? '100' : formData.installmentType === 'WEEKLY' ? '24' : '12'}`}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-brand-600"
                  />
                </div>
              </div>

              {/* Dynamic Interest & Repayment Summary Calculator Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calculator className="w-4 h-4 text-emerald-600" /> Dynamic Interest & Repayment Calculator
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border">
                    {calc.tenureVal} {calc.unitLabel} ({calc.type})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                    <span className="text-slate-500 block text-[10px]">Principal Debt</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(calc.principal)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                    <span className="text-slate-500 block text-[10px]">Total Interest Amount</span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      + {formatCurrency(calc.totalInterest)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                    <span className="text-slate-500 block text-[10px]">Net Repayment Amount</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(calc.totalRepayment)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
                    <span className="text-emerald-100 block text-[10px]">Per Installment ({calc.label})</span>
                    <span className="font-black text-sm">{formatCurrency(calc.perInstallment)}</span>
                  </div>
                </div>
              </div>

              {/* Mortgage Asset Fields */}
              {formData.loanType === 'MORTGAGE' && (
                <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 space-y-3">
                  <div className="font-bold text-xs text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-violet-600" /> Mortgage Asset Collateral Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Asset Category
                      </label>
                      <select
                        value={formData.assetType}
                        onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="PROPERTY">Property / Real Estate</option>
                        <option value="GOLD">Gold Jewellery</option>
                        <option value="VEHICLE">Commercial Vehicle</option>
                        <option value="SHARES">Stocks / Shares</option>
                        <option value="OTHER">Other Collateral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Estimated Asset Value (₹) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1000000"
                        value={formData.assetValue}
                        onChange={(e) => setFormData({ ...formData, assetValue: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Market Valuation (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Market Value"
                        value={formData.marketValue}
                        onChange={(e) => setFormData({ ...formData, marketValue: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Asset Description (e.g., Shop No 4, Andheri West Market)..."
                      value={formData.assetDescription}
                      onChange={(e) => setFormData({ ...formData, assetDescription: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  {ltvSuggestion && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-500">Calculated LTV: </span>
                        <span className="font-bold text-violet-600 text-sm">{ltvSuggestion.ltvPercentage}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">{ltvSuggestion.matchedSlabName}</span>
                        <span className="font-bold text-emerald-600">
                          Suggested Rate: {ltvSuggestion.suggestedInterestRate}% p.a.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium shadow-md transition flex items-center space-x-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Saving Application...' : 'Save Loan Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disbursement Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Disburse Loan Funds
              </h3>
              <button onClick={() => setShowDisburseModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <div className="text-xs text-slate-500">Loan Number</div>
                <div className="font-mono font-bold text-brand-600 text-base">{showDisburseModal.loanNumber}</div>
                <div className="text-xs text-slate-500 mt-2">Principal Amount to Disburse</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(showDisburseModal.principalAmount)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Disbursement Account Source *</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setDisburseSource('BANK')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      disburseSource === 'BANK'
                        ? 'bg-brand-600 text-white border-brand-600 shadow'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisburseSource('CASH')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      disburseSource === 'CASH'
                        ? 'bg-brand-600 text-white border-brand-600 shadow'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Cash In Hand
                  </button>
                </div>

                {disburseSource === 'BANK' && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Select Operating Bank Account</label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.accountNumber.slice(-4)}) - Bal: ₹{b.currentBalance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowDisburseModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisburseLoan}
                  disabled={isDisbursing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium shadow-md flex items-center space-x-2"
                >
                  {isDisbursing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isDisbursing ? 'Processing...' : 'Confirm & Post Disbursement'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Loan Details Modal Drawer */}
      {selectedViewLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-brand-600">{selectedViewLoan.loanNumber}</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {selectedViewLoan.customer?.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedViewLoan(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
                <div>
                  <div className="text-xs text-slate-500">Loan Type & Frequency</div>
                  <div className="font-semibold">{selectedViewLoan.loanType} LOAN</div>
                  <div className="text-xs text-brand-600 font-bold uppercase mt-0.5">
                    {selectedViewLoan.installmentType || 'MONTHLY'} ({selectedViewLoan.tenureValue || selectedViewLoan.tenureMonths}{' '}
                    {selectedViewLoan.installmentType === 'DAILY' ? 'Days' : selectedViewLoan.installmentType === 'WEEKLY' ? 'Weeks' : 'Months'})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Principal Amount</div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">
                    {formatCurrency(selectedViewLoan.principalAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Interest Rate & Total</div>
                  <div className="font-semibold text-emerald-600">
                    {selectedViewLoan.interestRate}% p.a. ({selectedViewLoan.interestType})
                  </div>
                  {selectedViewLoan.totalInterestAmount && (
                    <div className="text-xs font-bold text-emerald-600">
                      Total Interest: {formatCurrency(selectedViewLoan.totalInterestAmount)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-500">Installment Repayment</div>
                  {selectedViewLoan.installmentAmount ? (
                    <div className="font-extrabold text-cyan-600">
                      {formatCurrency(selectedViewLoan.installmentAmount)} /{' '}
                      {selectedViewLoan.installmentType === 'DAILY' ? 'Day' : selectedViewLoan.installmentType === 'WEEKLY' ? 'Week' : 'Month'}
                    </div>
                  ) : (
                    <div className="font-extrabold text-cyan-600">
                      {formatCurrency(selectedViewLoan.outstandingBalance)}
                    </div>
                  )}
                </div>
              </div>

              {selectedViewLoan.mortgageDetail && (
                <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 space-y-2">
                  <div className="font-bold text-xs text-violet-900 dark:text-violet-300">
                    Mortgage Collateral Details
                  </div>
                  <div className="text-xs">
                    Category: <span className="font-semibold">{selectedViewLoan.mortgageDetail.assetType}</span>
                  </div>
                  <div className="text-xs">
                    Valuation:{' '}
                    <span className="font-bold">
                      ₹{selectedViewLoan.mortgageDetail.estimatedValue?.toLocaleString()}
                    </span>{' '}
                    (LTV: {selectedViewLoan.mortgageDetail.ltvPercentage}%)
                  </div>
                  <div className="text-xs text-slate-500">{selectedViewLoan.mortgageDetail.assetDescription}</div>
                </div>
              )}

              {selectedViewLoan.notes && (
                <div>
                  <h4 className="font-bold text-xs text-slate-500 mb-1">Notes & Internal Remarks</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                    {selectedViewLoan.notes}
                  </div>
                </div>
              )}
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

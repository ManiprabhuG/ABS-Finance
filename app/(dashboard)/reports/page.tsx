'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, FileSpreadsheet, Printer, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { exportToExcel, formatCurrency, formatDate } from '@/lib/export-utils';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<
    'TRIAL_BALANCE' | 'DAY_BOOK' | 'CASH_BOOK' | 'BANK_BOOK' | 'PROFIT_LOSS' | 'LOAN_OUTSTANDING'
  >('TRIAL_BALANCE');

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [printModal, setPrintModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/financial?type=${reportType}`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const handleExportExcel = () => {
    if (!data) return;
    if (reportType === 'TRIAL_BALANCE') {
      const rows = [
        { Account: 'Loan Assets (Total Outstanding)', Amount: data.summary?.totalOutstanding, Type: 'Debit' },
        { Account: 'Cash In Hand', Amount: data.cashInHand, Type: 'Debit' },
        { Account: 'Bank Balances', Amount: data.summary?.totalBankBalance, Type: 'Debit' },
        { Account: 'Interest & Fees Income', Amount: data.summary?.totalIncome, Type: 'Credit' },
        { Account: 'Operational Expenses', Amount: data.summary?.totalExpense, Type: 'Debit' },
      ];
      exportToExcel(rows, `Trial_Balance_${new Date().toISOString().slice(0, 10)}`);
    } else if (reportType === 'LOAN_OUTSTANDING') {
      const rows = data.loans?.map((l: any) => ({
        'Loan No': l.loanNumber,
        Customer: l.customer?.name,
        Type: l.loanType,
        Principal: l.principalAmount,
        Outstanding: l.outstandingBalance,
        Status: l.status,
      }));
      exportToExcel(rows || [], `Loan_Outstanding_Report_${new Date().toISOString().slice(0, 10)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" /> Financial Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Generate Trial Balance, Day Book, Cash/Bank Books, Profit & Loss, and Outstanding Loan statements.
          </p>
        </div>

        <div className="flex items-center space-x-2 no-print">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setPrintModal({ isOpen: true, title: 'Statement of Cash Flows', url: '/print/cash-flow' })}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cash Flow Statement</span>
          </button>
          <button
            onClick={() => setPrintModal({ isOpen: true, title: 'Overdue NPA Loan Audit Report', url: '/print/overdue-report' })}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Overdue NPA Report</span>
          </button>
          <button
            onClick={() => setPrintModal({ isOpen: true, title: 'Interest Earnings Audit Report', url: '/print/interest-report' })}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-xl shadow flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Interest Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold no-print">
        <button
          onClick={() => setReportType('TRIAL_BALANCE')}
          className={`pb-2.5 transition-colors border-b-2 ${
            reportType === 'TRIAL_BALANCE'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Trial Balance
        </button>
        <button
          onClick={() => setReportType('PROFIT_LOSS')}
          className={`pb-2.5 transition-colors border-b-2 ${
            reportType === 'PROFIT_LOSS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setReportType('DAY_BOOK')}
          className={`pb-2.5 transition-colors border-b-2 ${
            reportType === 'DAY_BOOK'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Day Book
        </button>
        <button
          onClick={() => setReportType('LOAN_OUTSTANDING')}
          className={`pb-2.5 transition-colors border-b-2 ${
            reportType === 'LOAN_OUTSTANDING'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Loan Outstanding Report
        </button>
      </div>

      {/* Trial Balance Report */}
      {reportType === 'TRIAL_BALANCE' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">ABS FINANCE MANAGEMENT</h2>
            <p className="text-xs text-slate-500">TRIAL BALANCE SHEET (Financial Year 2026-2027)</p>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                <th className="py-3">Particulars / Account Head</th>
                <th className="py-3 text-right">Debit (₹)</th>
                <th className="py-3 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 font-semibold">Loan Advances Outstanding (Assets)</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(data?.summary?.totalOutstanding || 0)}
                </td>
                <td className="py-3 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Cash In Hand Account</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(data?.cashInHand || 0)}
                </td>
                <td className="py-3 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Bank Balances (HDFC / ICICI)</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(data?.summary?.totalBankBalance || 0)}
                </td>
                <td className="py-3 text-right text-slate-400">-</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Interest & Processing Fee Income</td>
                <td className="py-3 text-right text-slate-400">-</td>
                <td className="py-3 text-right font-bold text-emerald-600">
                  {formatCurrency(data?.summary?.totalIncome || 0)}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Operational Expenses</td>
                <td className="py-3 text-right font-bold text-rose-600">
                  {formatCurrency(data?.summary?.totalExpense || 0)}
                </td>
                <td className="py-3 text-right text-slate-400">-</td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-extrabold text-base">
                <td className="py-4">TOTAL BALANCE</td>
                <td className="py-4 text-right font-mono text-brand-600">
                  {formatCurrency(
                    (data?.summary?.totalOutstanding || 0) +
                      (data?.cashInHand || 0) +
                      (data?.summary?.totalBankBalance || 0) +
                      (data?.summary?.totalExpense || 0)
                  )}
                </td>
                <td className="py-4 text-right font-mono text-brand-600">
                  {formatCurrency(data?.summary?.totalIncome || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Profit & Loss Report */}
      {reportType === 'PROFIT_LOSS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">PROFIT & LOSS STATEMENT</h2>
            <p className="text-xs text-slate-500">Income vs Expenditure Breakdown</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
              <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-2">Total Operating Income</h3>
              <div className="text-2xl font-black text-emerald-600">
                {formatCurrency(data?.summary?.totalIncome || 0)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
              <h3 className="font-bold text-rose-900 dark:text-rose-300 text-sm mb-2">Total Operating Expense</h3>
              <div className="text-2xl font-black text-rose-600">
                {formatCurrency(data?.summary?.totalExpense || 0)}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">NET FINANCIAL PROFIT / (LOSS)</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency(data?.summary?.netProfit || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Book Report */}
      {reportType === 'DAY_BOOK' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="p-3">Ref ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Particulars</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.ledgerEntries?.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="p-3 font-mono font-bold text-brand-600">{entry.ledgerId}</td>
                  <td className="p-3">{formatDate(entry.date)}</td>
                  <td className="p-3 font-medium">{entry.remarks}</td>
                  <td className="p-3 text-right font-bold text-rose-600">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loan Outstanding Report */}
      {reportType === 'LOAN_OUTSTANDING' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="p-3">Loan No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Type</th>
                <th className="p-3">Principal Amount</th>
                <th className="p-3">Outstanding Balance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.loans?.map((loan: any) => (
                <tr key={loan.id}>
                  <td className="p-3 font-mono font-bold text-brand-600">{loan.loanNumber}</td>
                  <td className="p-3 font-semibold">{loan.customer?.name}</td>
                  <td className="p-3">{loan.loanType}</td>
                  <td className="p-3 font-bold">{formatCurrency(loan.principalAmount)}</td>
                  <td className="p-3 font-bold text-cyan-600">{formatCurrency(loan.outstandingBalance)}</td>
                  <td className="p-3 font-semibold">{loan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

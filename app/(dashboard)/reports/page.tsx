'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Landmark,
  Layers,
  FileText,
  MapPin,
  Percent,
  Receipt,
  FileCheck2,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Building2,
  TrendingUp,
  Download,
  Filter,
  FileDown,
} from 'lucide-react';
import { exportToExcel, exportToCSV, formatCurrency, formatDate } from '@/lib/export-utils';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';

type CategoryType = 'FINANCIAL' | 'PORTFOLIO' | 'GST';

type ReportType =
  | 'TRIAL_BALANCE'
  | 'PROFIT_LOSS'
  | 'DAY_BOOK'
  | 'DAILY_CASH_FLOW'
  | 'LOAN_OUTSTANDING'
  | 'PENDING_COLLECTION_LOCATION'
  | 'MASTER_GST'
  | 'GSTR1_OUTWARD'
  | 'ITC_REGISTER'
  | 'MIXED_SUPPLY';

const PRINT_ROUTES: Record<ReportType, { title: string; route: string }> = {
  TRIAL_BALANCE: { title: 'Trial Balance Sheet', route: '/print/trial-balance' },
  PROFIT_LOSS: { title: 'Profit & Loss Statement', route: '/print/profit-loss' },
  DAY_BOOK: { title: 'Daily Transaction Journal (Day Book)', route: '/print/day-book' },
  DAILY_CASH_FLOW: { title: 'Statement of Cash Flows & Liquidity', route: '/print/cash-flow' },
  LOAN_OUTSTANDING: { title: 'Loan Outstanding Portfolio Statement', route: '/print/loan-outstanding' },
  PENDING_COLLECTION_LOCATION: { title: 'Location Pending Recovery Report', route: '/print/location-collections' },
  MASTER_GST: { title: 'Statutory Master GST Summary Statement', route: '/print/master-gst' },
  GSTR1_OUTWARD: { title: 'GSTR-1 Outward Taxable Supply Ledger', route: '/print/gstr1-outward' },
  ITC_REGISTER: { title: 'Inward Input Tax Credit (ITC) Register', route: '/print/itc-register' },
  MIXED_SUPPLY: { title: 'Mixed & Composite Supply Segregation Audit', route: '/print/mixed-supply' },
};

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('FINANCIAL');
  const [reportType, setReportType] = useState<ReportType>('TRIAL_BALANCE');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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
      let url = `/api/reports/financial?type=${reportType}`;
      if (fromDate) url += `&from=${fromDate}`;
      if (toDate) url += `&to=${toDate}`;
      const res = await fetch(url);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error('Failed to load report data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, fromDate, toDate]);

  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    if (cat === 'FINANCIAL') setReportType('TRIAL_BALANCE');
    if (cat === 'PORTFOLIO') setReportType('LOAN_OUTSTANDING');
    if (cat === 'GST') setReportType('MASTER_GST');
  };

  // Quick Date Preset Helpers
  const applyDatePreset = (preset: 'TODAY' | 'THIS_MONTH' | 'FY' | 'ALL') => {
    const now = new Date();
    if (preset === 'TODAY') {
      const todayStr = now.toISOString().slice(0, 10);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'FY') {
      setFromDate('2026-04-01');
      setToDate('2027-03-31');
    } else if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    }
  };

  // Construct structured rows for Exporting (Excel & CSV)
  const getExportRows = () => {
    if (!data) return [];
    if (reportType === 'TRIAL_BALANCE') {
      return [
        { Account: 'Loan Assets (Total Outstanding)', Amount: data.summary?.totalOutstanding, Type: 'Debit' },
        { Account: 'Cash In Hand', Amount: data.cashInHand, Type: 'Debit' },
        { Account: 'Bank Balances', Amount: data.summary?.totalBankBalance, Type: 'Debit' },
        { Account: 'Interest & Direct Fee Income', Amount: data.summary?.totalIncome, Type: 'Credit' },
        { Account: 'Operational Expenses', Amount: data.summary?.totalExpense, Type: 'Debit' },
      ];
    } else if (reportType === 'DAILY_CASH_FLOW') {
      return [
        { Metric: 'Opening Cash Balance', Amount: data.openingCash },
        { Metric: 'Total Cash Collections Received', Amount: data.totalCashInflow },
        { Metric: 'Total Cash Disbursements & Expenses', Amount: data.totalCashOutflow },
        { Metric: 'Net Cash Flow for Period', Amount: data.netCashMovement },
        { Metric: 'Closing Physical Cash in Hand', Amount: data.closingCash },
      ];
    } else if (reportType === 'PENDING_COLLECTION_LOCATION') {
      const rows: any[] = [];
      data.locations?.forEach((loc: any) => {
        loc.items?.forEach((item: any) => {
          rows.push({
            Location: loc.location,
            LoanNo: item.loanNumber,
            Customer: item.customerName,
            Mobile: item.mobile,
            Principal: item.principalAmount,
            Outstanding: item.outstandingBalance,
            Status: item.status,
            NPADays: item.npaDays,
            RiskLevel: item.riskCategory,
          });
        });
      });
      return rows;
    } else if (reportType === 'MASTER_GST') {
      return [
        { Head: 'Company GSTIN', Value: data.gstin },
        { Head: 'Gross Aggregate Turnover', Value: data.totalTurnover },
        { Head: 'Exempt Turnover (Interest Income)', Value: data.exemptTurnover },
        { Head: 'Taxable Turnover (Processing/Penal Fees)', Value: data.taxableTurnover },
        { Head: 'Output GST (18%)', Value: data.outputGst?.total },
        { Head: 'Eligible Inward ITC (50% NBFC Rule)', Value: data.inputTaxCredit?.eligibleItc },
        { Head: 'Net GST Payable to Govt', Value: data.netGstPayable },
      ];
    } else if (reportType === 'GSTR1_OUTWARD') {
      return data.items?.map((i: any) => ({
        'Invoice No': i.invoiceNo,
        Date: formatDate(i.date),
        Customer: i.customerName,
        GSTIN: i.customerGstin,
        'Place of Supply': i.pos,
        'SAC Code': i.sacCode,
        'Service Description': i.serviceDescription,
        'Taxable Value': i.taxableValue,
        'GST Rate': i.rate,
        'CGST (9%)': i.cgst,
        'SGST (9%)': i.sgst,
        'Total Invoice Value': i.totalAmount,
      })) || [];
    } else if (reportType === 'ITC_REGISTER') {
      return data.items?.map((i: any) => ({
        'Voucher No': i.voucherNo,
        Date: formatDate(i.date),
        Vendor: i.vendorName,
        'Vendor GSTIN': i.vendorGstin,
        Category: i.category,
        'Taxable Value': i.taxableValue,
        'Gross GST (18%)': i.cgst + i.sgst,
        'Eligibility Rule': i.itcEligibility,
        'Eligible ITC (50%)': i.eligibleItc,
        'Ineligible ITC (50%)': i.ineligibleItc,
      })) || [];
    } else if (reportType === 'MIXED_SUPPLY') {
      return data.logs?.map((l: any) => ({
        'Bundle ID': l.bundleId,
        'Loan No': l.loanNumber,
        Customer: l.customerName,
        Date: formatDate(l.date),
        'Principal Disbursed (Exempt)': l.loanPrincipalExempt,
        'Total Taxable Bundle Fee': l.totalTaxableFee,
        'Total GST (18%)': l.totalGstLevied,
        Classification: l.supplyClassification,
        Status: l.complianceStatus,
      })) || [];
    } else if (reportType === 'LOAN_OUTSTANDING') {
      return data.loans?.map((l: any) => ({
        'Loan No': l.loanNumber,
        Customer: l.customer?.name,
        Type: l.loanType,
        Principal: l.principalAmount,
        Outstanding: l.outstandingBalance,
        Status: l.status,
      })) || [];
    } else if (reportType === 'PROFIT_LOSS') {
      return [
        { Category: 'Total Operating Income', Amount: data.summary?.totalIncome },
        { Category: 'Total Operating Expenses', Amount: data.summary?.totalExpense },
        { Category: 'Net Financial Operating Profit', Amount: data.summary?.netProfit },
      ];
    } else if (reportType === 'DAY_BOOK') {
      return data.ledgerEntries?.map((e: any) => ({
        'Ref ID': e.ledgerId,
        Date: formatDate(e.date),
        Particulars: e.remarks,
        Debit: e.debit,
        Credit: e.credit,
      })) || [];
    }
    return [];
  };

  const handleExportExcel = () => {
    const rows = getExportRows();
    if (rows.length === 0) return;
    const dateStamp = new Date().toISOString().slice(0, 10);
    exportToExcel(rows, `${reportType}_Report_${dateStamp}`);
  };

  const handleExportCSV = () => {
    const rows = getExportRows();
    if (rows.length === 0) return;
    const dateStamp = new Date().toISOString().slice(0, 10);
    exportToCSV(rows, `${reportType}_Report_${dateStamp}`);
  };

  const handleOpenPrintPreview = () => {
    const config = PRINT_ROUTES[reportType] || { title: 'Report Statement', route: '/print/cash-flow' };
    let printUrl = config.route;
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const qs = params.toString();
    if (qs) printUrl += `?${qs}`;

    setPrintModal({
      isOpen: true,
      title: config.title,
      url: printUrl,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Reports & Financial Analytics Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Statutory Financial Books, Portfolio Field Audits, and Automated GST Returns.
            </p>
          </div>
        </div>

        {/* Action Controls for Current Report */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
            title="Reload Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center space-x-1.5 shadow-sm"
            title="Download CSV file"
          >
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5"
            title="Download Excel Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleOpenPrintPreview}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/20 transition flex items-center space-x-2"
            title="Open Clean Print Preview & Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print & PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Category Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleCategoryChange('FINANCIAL')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'FINANCIAL'
              ? 'bg-brand-600/15 border-brand-500 text-brand-400 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Category 1</span>
            <Landmark className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-base font-bold text-white">Financial & Ledger Books</div>
          <div className="text-[11px] text-slate-400 mt-1">Trial Balance, P&L, Day Book, Cash Flow</div>
        </button>

        <button
          onClick={() => handleCategoryChange('PORTFOLIO')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'PORTFOLIO'
              ? 'bg-cyan-600/15 border-cyan-500 text-cyan-400 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Category 2</span>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-white">Portfolio & Field Audits</div>
          <div className="text-[11px] text-slate-400 mt-1">Outstanding Loans, Branch Pending Dues</div>
        </button>

        <button
          onClick={() => handleCategoryChange('GST')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'GST'
              ? 'bg-amber-600/15 border-amber-500 text-amber-400 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Category 3</span>
            <Percent className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white">Taxation & GST Compliance</div>
          <div className="text-[11px] text-slate-400 mt-1">Master GST, GSTR-1, ITC Register, Mixed Supply</div>
        </button>
      </div>

      {/* Sub-Report Tabs and Enhanced Date Range Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Sub tabs switcher */}
        <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-800/80">
          {activeCategory === 'FINANCIAL' && (
            <>
              {[
                { id: 'TRIAL_BALANCE', label: 'Trial Balance Sheet' },
                { id: 'PROFIT_LOSS', label: 'Profit & Loss Statement' },
                { id: 'DAY_BOOK', label: 'Day Book Journal' },
                { id: 'DAILY_CASH_FLOW', label: 'Daily Cash Flow Statement' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id as ReportType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    reportType === tab.id
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}

          {activeCategory === 'PORTFOLIO' && (
            <>
              {[
                { id: 'LOAN_OUTSTANDING', label: 'Loan Outstanding Portfolio' },
                { id: 'PENDING_COLLECTION_LOCATION', label: 'Location Pending Collections' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id as ReportType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    reportType === tab.id
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}

          {activeCategory === 'GST' && (
            <>
              {[
                { id: 'MASTER_GST', label: '1. Master GST Summary' },
                { id: 'GSTR1_OUTWARD', label: '2. GSTR-1 Outward Ledger' },
                { id: 'ITC_REGISTER', label: '3. ITC Register (Sec 17(4))' },
                { id: 'MIXED_SUPPLY', label: '4. Mixed Supply Log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id as ReportType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    reportType === tab.id
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Date Filter & Preset Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-400 mr-1 flex items-center gap-1 text-[11px] uppercase">
              <Clock className="w-3.5 h-3.5 text-brand-400" /> Quick Date Range:
            </span>
            <button
              onClick={() => applyDatePreset('TODAY')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Today
            </button>
            <button
              onClick={() => applyDatePreset('THIS_MONTH')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              This Month
            </button>
            <button
              onClick={() => applyDatePreset('FY')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              FY 2026-27
            </button>
            <button
              onClick={() => applyDatePreset('ALL')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              All Time
            </button>
          </div>

          {/* Exact Date Pickers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs border-none outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs border-none outline-none cursor-pointer"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-semibold"
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REPORT CONTENT VIEWS */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
          <p className="text-sm font-semibold">Loading Report Calculations...</p>
        </div>
      ) : (
        <>
          {/* 1. DAILY CASH FLOW REPORT */}
          {reportType === 'DAILY_CASH_FLOW' && (
            <div className="space-y-6">
              {/* Cash Flow Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-medium">Opening Physical Cash</div>
                  <div className="text-2xl font-black text-white mt-2">
                    {formatCurrency(data?.openingCash || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Starting Vault Float</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Total Cash Inflows
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-2">
                    +{formatCurrency(data?.totalCashInflow || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Collections & Fees</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Total Cash Outflows
                  </div>
                  <div className="text-2xl font-black text-rose-400 mt-2">
                    -{formatCurrency(data?.totalCashOutflow || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Disbursements & Expenses</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-cyan-400 font-medium">Net Movement</div>
                  <div className={`text-2xl font-black mt-2 ${(data?.netCashMovement || 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {formatCurrency(data?.netCashMovement || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Net Cash Delta</div>
                </div>

                <div className="bg-slate-900 border border-brand-500/30 rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-brand-950/40">
                  <div className="text-xs text-brand-300 font-bold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-brand-400" /> Closing Cash In Hand
                  </div>
                  <div className="text-2xl font-black text-brand-300 mt-2">
                    {formatCurrency(data?.closingCash || 0)}
                  </div>
                  <div className="text-[10px] text-brand-400/80 mt-1">Verified Master Float</div>
                </div>
              </div>

              {/* Transactions Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Collections */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-emerald-400" /> Doorstep & Counter Cash Collections
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {data?.cashCollections?.length || 0} Entries
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900 uppercase">
                        <tr>
                          <th className="py-2">Receipt</th>
                          <th className="py-2">Borrower</th>
                          <th className="py-2">Date</th>
                          <th className="py-2 text-right">Amount Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {data?.cashCollections?.map((c: any) => (
                          <tr key={c.id}>
                            <td className="py-2 font-mono text-brand-400">{c.collectionId}</td>
                            <td className="py-2 font-medium text-white">{c.customer?.name}</td>
                            <td className="py-2 text-slate-400">{formatDate(c.collectionDate)}</td>
                            <td className="py-2 text-right font-bold text-emerald-400">{formatCurrency(c.amountReceived)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cash Disbursements */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-rose-400" /> Cash Loan Advances Disbursed
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                      {data?.cashDisbursements?.length || 0} Loans
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900 uppercase">
                        <tr>
                          <th className="py-2">Loan No</th>
                          <th className="py-2">Customer</th>
                          <th className="py-2">Date</th>
                          <th className="py-2 text-right">Principal Disbursed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {data?.cashDisbursements?.map((l: any) => (
                          <tr key={l.id}>
                            <td className="py-2 font-mono text-brand-400">{l.loanNumber}</td>
                            <td className="py-2 font-medium text-white">{l.customer?.name}</td>
                            <td className="py-2 text-slate-400">{formatDate(l.loanDate)}</td>
                            <td className="py-2 text-right font-bold text-rose-400">{formatCurrency(l.principalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PENDING COLLECTION BY LOCATION / BRANCH */}
          {reportType === 'PENDING_COLLECTION_LOCATION' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-400" /> Branch & Area-wise Pending Recovery Portfolio
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Geo-clustered outstanding installments, overdue risk profiles, and pending fee arrears.
                  </p>
                </div>
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="text-xs text-slate-400">Total Active Borrowers</div>
                    <div className="text-2xl font-black text-white">{data?.totalPendingLoans || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Total Pending Dues</div>
                    <div className="text-2xl font-black text-rose-400">{formatCurrency(data?.totalPendingAmount || 0)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {data?.locations?.map((loc: any, idx: number) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-500/20">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{loc.location}</h3>
                          <p className="text-xs text-slate-400">{loc.count} Active Borrowers in this cluster</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Cluster Outstanding</span>
                          <span className="font-mono font-bold text-rose-400 text-sm">{formatCurrency(loc.totalOutstanding)}</span>
                        </div>
                        {loc.overdueCount > 0 && (
                          <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {loc.overdueCount} Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-400 border-b border-slate-800 uppercase">
                          <tr>
                            <th className="py-2">Loan No</th>
                            <th className="py-2">Customer & Mobile</th>
                            <th className="py-2">Address</th>
                            <th className="py-2">Risk Rating</th>
                            <th className="py-2 text-right">Principal</th>
                            <th className="py-2 text-right">Outstanding</th>
                            <th className="py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {loc.items?.map((item: any) => (
                            <tr key={item.loanId}>
                              <td className="py-2.5 font-mono text-brand-400 font-bold">{item.loanNumber}</td>
                              <td className="py-2.5">
                                <div className="font-semibold text-white">{item.customerName}</div>
                                <div className="text-slate-400 font-mono text-[11px]">{item.mobile}</div>
                              </td>
                              <td className="py-2.5 text-slate-300 max-w-[200px] truncate">{item.address}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.riskCategory === 'HIGH'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : item.riskCategory === 'MEDIUM'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {item.riskCategory} ({item.riskScore})
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-medium text-slate-300">{formatCurrency(item.principalAmount)}</td>
                              <td className="py-2.5 text-right font-bold text-cyan-400">{formatCurrency(item.outstandingBalance)}</td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.status === 'OVERDUE'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-brand-500/20 text-brand-300'
                                }`}>
                                  {item.status} {item.npaDays > 0 ? `(${item.npaDays}d)` : ''}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MASTER GST SUMMARY */}
          {reportType === 'MASTER_GST' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      Statutory GST Return Preparation
                    </span>
                    <h2 className="text-xl font-black text-white mt-2">
                      Master GST Turnover & Tax Liability Summary
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Segregation of GST Exempt Financial Interest vs 18% Taxable Fee Charges under SAC 9971.
                    </p>
                  </div>
                  <div className="text-right bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Registered GSTIN</div>
                    <div className="font-mono font-black text-amber-400 text-sm mt-0.5">{data?.gstin}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">1. Total Aggregate Turnover</div>
                    <div className="text-2xl font-black text-white mt-2">
                      {formatCurrency(data?.totalTurnover || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Exempt + Taxable Gross</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-emerald-400 font-semibold">2. GST Exempt Turnover (Interest)</div>
                    <div className="text-2xl font-black text-emerald-400 mt-2">
                      {formatCurrency(data?.exemptTurnover || 0)}
                    </div>
                    <div className="text-[10px] text-emerald-500/70 mt-1">0% GST (Lending Interest)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-amber-400 font-semibold">3. Taxable Turnover (Fee & Penal)</div>
                    <div className="text-2xl font-black text-amber-400 mt-2">
                      {formatCurrency(data?.taxableTurnover || 0)}
                    </div>
                    <div className="text-[10px] text-amber-500/70 mt-1">18% Standard GST Rate</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-rose-400 font-semibold">4. Gross Output GST Liability</div>
                    <div className="text-2xl font-black text-rose-400 mt-2">
                      {formatCurrency(data?.outputGst?.total || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">CGST (9%) + SGST (9%)</div>
                  </div>
                </div>

                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-300">Section 17(4) Eligible Input Tax Credit (ITC) Offset:</div>
                    <div className="text-xs text-slate-400">
                      Gross Inward GST: {formatCurrency(data?.inputTaxCredit?.grossInwardGst || 0)} (50% NBFC Apportionment: <span className="text-emerald-400 font-semibold">-{formatCurrency(data?.inputTaxCredit?.eligibleItc || 0)}</span>)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-bold uppercase">Net Cash GST Payable to Govt</div>
                    <div className="text-3xl font-black text-amber-400 mt-1">
                      {formatCurrency(data?.netGstPayable || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. GSTR-1 OUTWARD SUPPLY LEDGER */}
          {reportType === 'GSTR1_OUTWARD' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" /> GSTR-1 Outward Taxable Supply Ledger
                  </h2>
                  <p className="text-xs text-slate-400">
                    B2B & B2C tax invoices for loan processing fees, documentation, and late penalty charges.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block">Total Outward Taxable</span>
                    <span className="font-bold text-amber-400 font-mono">{formatCurrency(data?.totalTaxable || 0)}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block">Total CGST + SGST</span>
                    <span className="font-bold text-rose-400 font-mono">{formatCurrency((data?.totalCgst || 0) + (data?.totalSgst || 0))}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="py-2.5">Invoice No</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Borrower / Client</th>
                      <th className="py-2.5">GSTIN / Ref</th>
                      <th className="py-2.5">SAC Code</th>
                      <th className="py-2.5">Service Description</th>
                      <th className="py-2.5 text-right">Taxable Val</th>
                      <th className="py-2.5 text-right">CGST (9%)</th>
                      <th className="py-2.5 text-right">SGST (9%)</th>
                      <th className="py-2.5 text-right">Gross Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data?.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 font-mono font-bold text-brand-400">{item.invoiceNo}</td>
                        <td className="py-3 text-slate-300">{formatDate(item.date)}</td>
                        <td className="py-3 font-semibold text-white">{item.customerName}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-400">{item.customerGstin}</td>
                        <td className="py-3 font-mono text-amber-400">{item.sacCode}</td>
                        <td className="py-3 text-slate-300">{item.serviceDescription}</td>
                        <td className="py-3 text-right font-medium text-slate-200">{formatCurrency(item.taxableValue)}</td>
                        <td className="py-3 text-right text-rose-400">{formatCurrency(item.cgst)}</td>
                        <td className="py-3 text-right text-rose-400">{formatCurrency(item.sgst)}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. INPUT TAX CREDIT (ITC) REGISTER */}
          {reportType === 'ITC_REGISTER' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-400" /> Inward Input Tax Credit (ITC) Register
                  </h2>
                  <p className="text-xs text-slate-400">
                    Expense GST tracking with Section 17(4) 50% NBFC apportionment eligibility.
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block">Total Expense Inward GST</span>
                    <span className="font-bold text-slate-200 font-mono">{formatCurrency(data?.totalGrossGst || 0)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 block font-semibold">Eligible ITC (50%)</span>
                    <span className="font-bold text-emerald-400 font-mono">{formatCurrency(data?.totalEligibleItc || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="py-2.5">Voucher No</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Vendor / Particulars</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5 text-right">Taxable Val</th>
                      <th className="py-2.5 text-right">Gross GST (18%)</th>
                      <th className="py-2.5">Eligibility Condition</th>
                      <th className="py-2.5 text-right">Eligible ITC (50%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data?.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 font-mono font-bold text-brand-400">{item.voucherNo}</td>
                        <td className="py-3 text-slate-300">{formatDate(item.date)}</td>
                        <td className="py-3 font-medium text-white">{item.vendorName}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-200">{formatCurrency(item.taxableValue)}</td>
                        <td className="py-3 text-right text-rose-400">{formatCurrency(item.cgst + item.sgst)}</td>
                        <td className="py-3 text-[11px] text-slate-400">{item.itcEligibility}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">{formatCurrency(item.eligibleItc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. MIXED SUPPLY SEGREGATION LOG */}
          {reportType === 'MIXED_SUPPLY' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-cyan-400" /> Mixed & Composite Supply Segregation Audit
                  </h2>
                  <p className="text-xs text-slate-400">
                    De-bundling of loan disbursements, insurance packs, collateral appraisals, and legal fees.
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Total Bundled Fees</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">{formatCurrency(data?.totalBundledValue || 0)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {data?.logs?.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs font-bold text-brand-400">{log.bundleId}</span>
                        <span className="text-white font-bold text-sm">{log.customerName}</span>
                        <span className="text-xs text-slate-400">Loan: {log.loanNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          {log.complianceStatus}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          GST Levied: {formatCurrency(log.totalGstLevied)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                      {log.breakdown?.map((comp: any, cidx: number) => (
                        <div key={cidx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px]">{comp.component}</div>
                          <div className="font-bold text-white mt-1">{formatCurrency(comp.amount)}</div>
                          <div className="text-[10px] text-amber-400 font-mono mt-0.5">{comp.taxRate}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STANDARD REPORTS: TRIAL BALANCE */}
          {reportType === 'TRIAL_BALANCE' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="text-center pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">ABS FINANCE MANAGEMENT</h2>
                <p className="text-xs text-slate-400">TRIAL BALANCE STATEMENT</p>
              </div>

              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                    <th className="py-3">Particulars / Account Head</th>
                    <th className="py-3 text-right">Debit (₹)</th>
                    <th className="py-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Loan Advances Outstanding (Assets)</td>
                    <td className="py-3 text-right font-bold text-white">
                      {formatCurrency(data?.summary?.totalOutstanding || 0)}
                    </td>
                    <td className="py-3 text-right text-slate-500">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Cash In Hand Account</td>
                    <td className="py-3 text-right font-bold text-white">
                      {formatCurrency(data?.cashInHand || 0)}
                    </td>
                    <td className="py-3 text-right text-slate-500">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Bank Balances</td>
                    <td className="py-3 text-right font-bold text-white">
                      {formatCurrency(data?.summary?.totalBankBalance || 0)}
                    </td>
                    <td className="py-3 text-right text-slate-500">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Interest & Fees Income</td>
                    <td className="py-3 text-right text-slate-500">-</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      {formatCurrency(data?.summary?.totalIncome || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Operational Expenses</td>
                    <td className="py-3 text-right font-bold text-rose-400">
                      {formatCurrency(data?.summary?.totalExpense || 0)}
                    </td>
                    <td className="py-3 text-right text-slate-500">-</td>
                  </tr>
                  <tr className="bg-slate-950 font-extrabold text-base">
                    <td className="py-4 text-white">TOTAL BALANCE</td>
                    <td className="py-4 text-right font-mono text-brand-400">
                      {formatCurrency(
                        (data?.summary?.totalOutstanding || 0) +
                          (data?.cashInHand || 0) +
                          (data?.summary?.totalBankBalance || 0) +
                          (data?.summary?.totalExpense || 0)
                      )}
                    </td>
                    <td className="py-4 text-right font-mono text-brand-400">
                      {formatCurrency(data?.summary?.totalIncome || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* STANDARD REPORTS: PROFIT & LOSS */}
          {reportType === 'PROFIT_LOSS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="text-center pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">PROFIT & LOSS STATEMENT</h2>
                <p className="text-xs text-slate-400">Income vs Expenditure Breakdown</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                  <h3 className="font-bold text-emerald-400 text-sm mb-2">Total Operating Income</h3>
                  <div className="text-3xl font-black text-emerald-400">
                    {formatCurrency(data?.summary?.totalIncome || 0)}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/30">
                  <h3 className="font-bold text-rose-400 text-sm mb-2">Total Operating Expense</h3>
                  <div className="text-3xl font-black text-rose-400">
                    {formatCurrency(data?.summary?.totalExpense || 0)}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">NET FINANCIAL PROFIT / (LOSS)</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">
                    {formatCurrency(data?.summary?.netProfit || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STANDARD REPORTS: DAY BOOK */}
          {reportType === 'DAY_BOOK' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Particulars</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data?.ledgerEntries?.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="p-3 font-mono font-bold text-brand-400">{entry.ledgerId}</td>
                      <td className="p-3 text-slate-300">{formatDate(entry.date)}</td>
                      <td className="p-3 font-medium text-white">{entry.remarks}</td>
                      <td className="p-3 text-right font-bold text-rose-400">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STANDARD REPORTS: LOAN OUTSTANDING */}
          {reportType === 'LOAN_OUTSTANDING' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="p-3">Loan No</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Principal Amount</th>
                    <th className="p-3 text-right">Outstanding Balance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data?.loans?.map((loan: any) => (
                    <tr key={loan.id}>
                      <td className="p-3 font-mono font-bold text-brand-400">{loan.loanNumber}</td>
                      <td className="p-3 font-semibold text-white">{loan.customer?.name}</td>
                      <td className="p-3 text-slate-300">{loan.loanType}</td>
                      <td className="p-3 text-right font-bold text-slate-200">{formatCurrency(loan.principalAmount)}</td>
                      <td className="p-3 text-right font-bold text-cyan-400">{formatCurrency(loan.outstandingBalance)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold">
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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

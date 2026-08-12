'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart,
  Target,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Building,
  Users,
  Zap,
} from 'lucide-react';

export default function BusinessIntelligencePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBIData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bi');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBIData();
  }, []);

  const kpis = data?.kpis;
  const forecasting = data?.forecasting || [];

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Executive Business Intelligence & CEO Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise portfolio analytics, yield growth forecasting, liquidity tracking, and operational KPIs.
          </p>
        </div>
        <button
          onClick={fetchBIData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh BI Engine</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Portfolio Value</span>
            <DollarSign className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            ₹{(kpis?.totalPortfolioValue || 0).toLocaleString()}
          </div>
          <div className="text-xs text-brand-400 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> Active Portfolio Outstanding
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Net Profit Yield</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">
            ₹{(kpis?.netProfit || 0).toLocaleString()}
          </div>
          <div className="text-xs text-emerald-500 font-semibold mt-1">
            {kpis?.netProfitMargin || '0.0'}% Profit Margin
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Collection Efficiency</span>
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-3">{kpis?.collectionEfficiency || '100.0'}%</div>
          <div className="text-xs text-slate-500 mt-1">Repayment Recovery Yield</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Active Borrowers</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{kpis?.totalActiveLoans || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Across {kpis?.totalCustomers || 0} Customers</div>
        </div>
      </div>

      {/* Revenue & Forecasting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection & Yield Forecasting Chart/List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                6-Month Revenue & Collection Forecasting
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                AI / Algorithmic yield projection based on current active tenure cycles and interest accruals.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-bold">
              AI Forecast Engine
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {forecasting.map((item: any, idx: number) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500 font-medium">{item.month}</div>
                <div className="text-lg font-black text-emerald-400">₹{item.expectedCollection.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 font-mono">Projected Yield</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Health Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-brand-400" />
              Financial Health Index
            </h2>
            <p className="text-xs text-slate-400">Real-time revenue vs expense allocation.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="text-slate-400">Total Interest & Direct Income</span>
              <span className="font-bold text-emerald-400">₹{(kpis?.totalIncome || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="text-slate-400">Direct Operating Expenses</span>
              <span className="font-bold text-rose-400">₹{(kpis?.totalExpense || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-semibold text-slate-200">Net Operating Surplus</span>
              <span className="font-black text-brand-400 text-sm">₹{(kpis?.netProfit || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> NBFC Audit Compliance
            </div>
            <div>Capital Adequacy Ratio (CAR) and Provisioning Targets strictly enforced.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

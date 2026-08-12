'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UserX,
  Search,
  RefreshCw,
  Activity,
  ChevronRight,
  User,
  Phone,
  FileText,
} from 'lucide-react';

export default function RiskDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState('');
  const [evalResult, setEvalResult] = useState<any>(null);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk/evaluate');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentLogs(data.recentLogs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingId) return;
    try {
      const res = await fetch('/api/risk/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: evaluatingId }),
      });
      const data = await res.json();
      if (data.success) {
        setEvalResult(data.data);
        fetchRiskData();
      } else {
        alert(data.error || 'Evaluation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-brand-400" />
            Customer Risk & Verification Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time identity verification, credit risk scoring, and customer blacklist monitoring.
          </p>
        </div>
        <button
          onClick={fetchRiskData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</span>
            <Activity className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{stats?.totalCustomers || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Active customer records</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Safe Customers</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">{stats?.safeCustomers || 0}</div>
          <div className="text-xs text-emerald-500/80 mt-1">Risk Score 80-100 (Low Risk)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Medium / High Risk</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">
            {(stats?.mediumRisk || 0) + (stats?.highRisk || 0)}
          </div>
          <div className="text-xs text-amber-500/80 mt-1">Requires manual manager review</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Blacklisted</span>
            <UserX className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 mt-3">{stats?.blacklisted || 0}</div>
          <div className="text-xs text-rose-500/80 mt-1">Loan origination blocked</div>
        </div>
      </div>

      {/* Manual Evaluation Form & Result Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-3">Evaluate Customer Risk Score</h2>
        <form onSubmit={handleEvaluate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter Customer Database ID (UUID)..."
              value={evaluatingId}
              onChange={(e) => setEvaluatingId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-brand-600/30"
          >
            <Activity className="w-4 h-4" />
            <span>Run Risk Assessment</span>
          </button>
        </form>

        {evalResult && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Risk Score Output:</span>
                <span className="text-lg font-black text-brand-400">{evalResult.score} / 100</span>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  evalResult.category === 'LOW'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : evalResult.category === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {evalResult.category}
              </span>
            </div>

            {evalResult.riskFactors && evalResult.riskFactors.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Risk Factors Triggered:</div>
                <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
                  {evalResult.riskFactors.map((rf: string, idx: number) => (
                    <li key={idx}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Risk Evaluation Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Customer Evaluation Logs</h2>
          <span className="text-xs text-slate-500">Live TiDB Sync</span>
        </div>

        <div className="divide-y divide-slate-800/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Customer ID</th>
                <th className="px-6 py-3.5">Risk Score</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Evaluated Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {log.customer?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">{log.customer?.customerId}</td>
                  <td className="px-6 py-4 font-bold text-brand-400">{log.riskScore} / 100</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.riskCategory === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.riskCategory === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.riskCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">
                    {new Date(log.evaluatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No risk evaluations recorded yet. Run assessment above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

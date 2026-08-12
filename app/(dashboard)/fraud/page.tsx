'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

export default function FraudAlertsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fraud/alerts');
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
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: string, status: string) => {
    try {
      const res = await fetch('/api/fraud/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts =
    data?.alerts?.filter((a: any) => {
      if (filterSeverity === 'ALL') return true;
      return a.severity === filterSeverity;
    }) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <AlertOctagon className="w-7 h-7 text-rose-500" />
            Fraud Detection & Operations Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated duplicate identifier detection, abnormal transaction monitoring, and risk mitigation.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Fraud Scan</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Fraud Alerts</div>
          <div className="text-3xl font-black text-rose-400 mt-2">{data?.stats?.openAlerts || 0}</div>
          <div className="text-xs text-rose-500/80 mt-1">Action required by compliance officer</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Critical Severity</div>
          <div className="text-3xl font-black text-rose-500 mt-2">{data?.stats?.criticalAlerts || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Immediate loan freeze triggered</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">High Severity</div>
          <div className="text-3xl font-black text-amber-400 mt-2">{data?.stats?.highAlerts || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Abnormal collections / high risk</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Resolved Alerts</div>
          <div className="text-3xl font-black text-emerald-400 mt-2">{data?.stats?.resolvedAlerts || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Cleared by manager</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2">
        <div className="flex items-center space-x-1">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterSeverity === sev ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-mono px-3">
          Showing {filteredAlerts.length} of {data?.alerts?.length || 0} Alerts
        </div>
      </div>

      {/* Fraud Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert: any) => (
          <div
            key={alert.id}
            className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              alert.severity === 'CRITICAL'
                ? 'border-rose-500/40 bg-rose-950/10'
                : alert.severity === 'HIGH'
                ? 'border-amber-500/40 bg-amber-950/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : alert.severity === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{alert.type.replace('_', ' ')}</span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                      alert.status === 'OPEN'
                        ? 'bg-rose-500/10 text-rose-300'
                        : alert.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{alert.details}</p>
                <div className="text-[11px] text-slate-500 mt-2 font-mono">
                  Triggered: {new Date(alert.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {alert.status === 'OPEN' && (
              <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve Alert</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus(alert.id, 'DISMISSED')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-300">No active fraud alerts detected</h3>
            <p className="text-xs text-slate-500 mt-1">All customer identifiers and transactions are clean.</p>
          </div>
        )}
      </div>
    </div>
  );
}

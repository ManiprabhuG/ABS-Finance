'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Gavel,
  PhoneCall,
  UserCheck,
  Building,
  RefreshCw,
  Plus,
  Clock,
  Calendar,
} from 'lucide-react';

export default function NPARecoveryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Recovery Logger State
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [actionType, setActionType] = useState('CALL');
  const [officerName, setOfficerName] = useState('Senior Recovery Officer');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  // Legal Case Modal / Form State
  const [showLegalForm, setShowLegalForm] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('District Magistrate Court');
  const [advocate, setAdvocate] = useState('Adv. R. Sharma & Associates');
  const [claimAmount, setClaimAmount] = useState('');
  const [legalRemarks, setLegalRemarks] = useState('');

  const fetchNPAData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/npa');
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
    fetchNPAData();
  }, []);

  const handleLogRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      alert('Please select a loan');
      return;
    }

    try {
      const res = await fetch('/api/npa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'RECOVERY',
          loanId: selectedLoanId,
          actionType,
          officerName,
          notes,
          nextFollowUp,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotes('');
        setNextFollowUp('');
        fetchNPAData();
        alert('Recovery action logged successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileLegalCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      alert('Please select a loan to file legal case');
      return;
    }

    try {
      const res = await fetch('/api/npa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LEGAL',
          loanId: selectedLoanId,
          caseNumber: caseNumber || `LC-${Date.now()}`,
          courtName,
          advocate,
          claimAmount,
          remarks: legalRemarks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowLegalForm(false);
        setCaseNumber('');
        setClaimAmount('');
        setLegalRemarks('');
        fetchNPAData();
        alert('Legal Proceeding filed successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const summary = data?.summary;
  const npaLoans = data?.npaLoans || [];
  const legalCases = data?.legalCases || [];

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Gavel className="w-7 h-7 text-amber-500" />
            NPA Portfolio & Recovery Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overdue classification buckets (Substandard, Doubtful, NPA), recovery tracking, and legal proceeding registers.
          </p>
        </div>
        <button
          onClick={fetchNPAData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Portfolio</span>
        </button>
      </div>

      {/* NPA Classification Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Standard Portfolio</div>
          <div className="text-2xl font-black text-white mt-2">
            ₹{(summary?.standardPortfolio?.balance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary?.standardPortfolio?.count || 0} Loans (0.4% Provision)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Substandard (31-90d)</div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            ₹{(summary?.substandardPortfolio?.balance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary?.substandardPortfolio?.count || 0} Loans (15% Provision)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Doubtful (91-180d)</div>
          <div className="text-2xl font-black text-rose-400 mt-2">
            ₹{(summary?.doubtfulPortfolio?.balance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary?.doubtfulPortfolio?.count || 0} Loans (30% Provision)
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 bg-rose-950/10 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Gross NPA Ratio %</div>
          <div className="text-2xl font-black text-rose-400 mt-2">{summary?.grossNPAPercentage || '0.0'}%</div>
          <div className="text-xs text-slate-500 mt-1">100% Loss Provision Target</div>
        </div>
      </div>

      {/* Recovery Logger Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-brand-400" />
            Log Recovery Follow-up Action
          </h2>
          <form onSubmit={handleLogRecovery} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Overdue Loan</label>
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Choose Overdue / NPA Loan --</option>
                {npaLoans.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.loanNumber} - {l.customer.name} (Bal: ₹{l.outstandingBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="VISIT">Field Inspection Visit</option>
                  <option value="NOTICE">Legal Demand Notice</option>
                  <option value="LEGAL">Court Action</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Officer Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Interaction Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter field observation or borrower commitment..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-600/30 transition"
              >
                Log Action Record
              </button>
            </div>
          </form>
        </div>

        {/* Legal Action Logger */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-rose-400" />
              Legal Case Proceeding Register
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Track court summons, legal notices, advocate assignments, and asset recovery decrees under SARFAESI / Civil Court.
            </p>
          </div>

          <form onSubmit={handleFileLegalCase} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Case Number (e.g. LC-2026-88)"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <input
                type="number"
                placeholder="Claim Amount (₹)"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Court Name"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <input
                type="text"
                placeholder="Advocate Name"
                value={advocate}
                onChange={(e) => setAdvocate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/30 transition"
            >
              Register Court Case Proceeding
            </button>
          </form>
        </div>
      </div>

      {/* Overdue Loans List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Overdue & NPA Loans Portfolio</h2>
          <span className="text-xs text-slate-500">{npaLoans.length} Loans Requiring Recovery</span>
        </div>

        <div className="divide-y divide-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="px-6 py-3.5">Loan No</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Overdue Days</th>
                <th className="px-6 py-3.5">NPA Category</th>
                <th className="px-6 py-3.5">Outstanding Bal</th>
                <th className="px-6 py-3.5">Recent Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {npaLoans.map((loan: any) => (
                <tr key={loan.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-mono font-bold text-white">{loan.loanNumber}</td>
                  <td className="px-6 py-4 font-medium">{loan.customer?.name}</td>
                  <td className="px-6 py-4 font-bold text-rose-400">{loan.npaDays} Days</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        loan.npaCategory === 'NPA'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : loan.npaCategory === 'DOUBTFUL'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {loan.npaCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">₹{loan.outstandingBalance.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-400">
                    {loan.npaRecoveries?.[0] ? (
                      <span className="text-[11px]">
                        {loan.npaRecoveries[0].actionType}: {loan.npaRecoveries[0].notes || 'Logged'}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">No action logged</span>
                    )}
                  </td>
                </tr>
              ))}
              {npaLoans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No NPA or overdue loans in the portfolio.
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

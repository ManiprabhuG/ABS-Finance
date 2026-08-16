'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  FileCheck,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Search,
  DollarSign,
  Printer,
  ShieldCheck,
  Percent,
  Sliders,
  Landmark,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export default function ForeclosureSettlementPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [eligibleLoans, setEligibleLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Loan Quotation State
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [quotation, setQuotation] = useState<any | null>(null);
  const [waiver, setWaiver] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'BANK_TRANSFER' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // NOC Certificate Viewer Modal
  const [viewNoc, setViewNoc] = useState<any | null>(null);

  const fetchSettlementData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/foreclosure');
      const data = await res.json();
      if (data.success) {
        setSettlements(data.settlements || []);
        setEligibleLoans(data.eligibleLoans || []);
      }
    } catch (err) {
      console.error('Failed to load foreclosure data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementData();
  }, []);

  const handleLoanSelect = async (loanId: string) => {
    setSelectedLoanId(loanId);
    if (!loanId) {
      setQuotation(null);
      return;
    }

    try {
      const res = await fetch(`/api/foreclosure?loanId=${loanId}`);
      const data = await res.json();
      if (data.success) {
        setQuotation(data);
        setWaiver(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const calculateFinalPayable = () => {
    if (!quotation) return 0;
    const standard = quotation.quotation.standardSettlementAmount;
    return Math.max(0, standard - waiver);
  };

  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation || !selectedLoanId) return;

    setSubmitting(true);
    try {
      const finalAmount = calculateFinalPayable();
      const q = quotation.quotation;

      const res = await fetch('/api/foreclosure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoanId,
          customerId: quotation.loan.customerId,
          principalOutstanding: q.principalOutstanding,
          interestAccrued: q.proRataInterest,
          penalCharges: q.penalCharges,
          foreclosureFee: q.foreclosureFee,
          waiverDiscount: Number(waiver),
          finalSettlementAmount: finalAmount,
          paymentMode,
          remarks,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setViewNoc(json.settlement);
        setSelectedLoanId('');
        setQuotation(null);
        setWaiver(0);
        setRemarks('');
        fetchSettlementData();
      } else {
        alert(json.error || 'Failed to execute settlement');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing settlement');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSettledAmount = settlements.reduce((acc, s) => acc + s.finalSettlementAmount, 0);
  const totalWaiversGranted = settlements.reduce((acc, s) => acc + s.waiverDiscount, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Loan Foreclosure & One-Time Settlement (OTS) Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Accrued interest recalculation, penalty waiver concessions, and instant No Objection Certificate (NOC) generation.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettlementData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Settlements</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-purple-400 font-bold uppercase">
            <span>Total Settled Recovery</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{formatCurrency(totalSettledAmount)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recovered via Foreclosures</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
            <span>Closed Loans (NOCs Issued)</span>
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">{settlements.length} Accounts</div>
          <div className="text-[11px] text-slate-400 mt-1">100% Legally discharged</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
            <span>Total Waivers Conceded</span>
            <Percent className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">{formatCurrency(totalWaiversGranted)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Approved OTS concessions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
            <span>Eligible Active Portfolio</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{eligibleLoans.length} Loans</div>
          <div className="text-[11px] text-slate-400 mt-1">Open for pre-closure / OTS</div>
        </div>
      </div>

      {/* Main Foreclosure Settlement Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Loan Selector & Input Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Foreclosure Quotation Calculator
            </h2>
            <p className="text-xs text-slate-400">Select borrower loan to generate real-time settlement quotation</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Active Borrower Loan*</label>
              <select
                value={selectedLoanId}
                onChange={(e) => handleLoanSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-semibold outline-none focus:border-purple-500"
              >
                <option value="">-- Choose Loan Account --</option>
                {eligibleLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.loanNumber} • {l.customer?.name} (Bal: {formatCurrency(l.outstandingBalance)})
                  </option>
                ))}
              </select>
            </div>

            {quotation && (
              <>
                {/* Concession / Waiver Adjustment */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>Approved Waiver / Concession (₹):</span>
                    <span className="text-amber-400 font-mono text-sm">{formatCurrency(waiver)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={quotation.quotation.suggestedMaxWaiver}
                    step="500"
                    value={waiver}
                    onChange={(e) => setWaiver(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>₹0 (Standard)</span>
                    <span>Max Suggested: {formatCurrency(quotation.quotation.suggestedMaxWaiver)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Settlement Payment Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BANK_TRANSFER', 'CASH', 'CHEQUE'] as const).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          paymentMode === mode
                            ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {mode.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Committee Approval Note</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g., OTS Approved under special recovery scheme"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Live Settlement Breakdown & Execution Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Settlement Computation Breakdown
              </h2>
              {quotation && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  Quotation Valid for 7 Days
                </span>
              )}
            </div>

            {!quotation ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Calculator className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">No Loan Account Selected</p>
                <p className="text-xs text-slate-500">Please select an active loan from the left console to compute settlement charges.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{quotation.loan.customer?.name}</div>
                    <div className="text-xs text-slate-400">Loan: <span className="font-mono text-brand-400">{quotation.loan.loanNumber}</span> • Type: {quotation.loan.loanType}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Original Principal</span>
                    <span className="font-bold text-white font-mono">{formatCurrency(quotation.loan.principalAmount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">1. Principal Outstanding</div>
                    <div className="font-black text-white text-base mt-1 font-mono">
                      {formatCurrency(quotation.quotation.principalOutstanding)}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">2. Pro-Rata Interest</div>
                    <div className="font-black text-white text-base mt-1 font-mono">
                      +{formatCurrency(quotation.quotation.proRataInterest)}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">3. Accrued Penal Charges</div>
                    <div className="font-black text-rose-400 text-base mt-1 font-mono">
                      +{formatCurrency(quotation.quotation.penalCharges)}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">4. Foreclosure Fee (2.5%)</div>
                    <div className="font-black text-amber-400 text-base mt-1 font-mono">
                      +{formatCurrency(quotation.quotation.foreclosureFee)}
                    </div>
                  </div>
                </div>

                {/* Final Net Settlement Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-purple-950/60 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                      Net One-Time Settlement (OTS) Amount Payable:
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Standard: {formatCurrency(quotation.quotation.standardSettlementAmount)} − Approved Waiver: <span className="text-amber-400 font-bold">{formatCurrency(waiver)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {formatCurrency(calculateFinalPayable())}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Full & Final Discharge</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {quotation && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedLoanId('');
                  setQuotation(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSettlement}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center space-x-2 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Executing Settlement...' : 'Approve Settlement & Issue NOC'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completed Settlements & NOC History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Settled Accounts & NOC Registry
            </h2>
            <p className="text-xs text-slate-400">Official record of all closed loans and issued No Objection Certificates</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
            {settlements.length} Closed Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="py-2.5">NOC Number</th>
                <th className="py-2.5">Settlement No</th>
                <th className="py-2.5">Borrower</th>
                <th className="py-2.5">Date Settled</th>
                <th className="py-2.5 text-right">Principal</th>
                <th className="py-2.5 text-right">Waiver Conceded</th>
                <th className="py-2.5 text-right">Settled Amount</th>
                <th className="py-2.5 text-center">NOC Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 font-mono font-bold text-emerald-400">{s.nocNumber}</td>
                  <td className="py-3 font-mono text-brand-400">{s.settlementNo}</td>
                  <td className="py-3">
                    <div className="font-semibold text-white">{s.customer?.name}</div>
                    <div className="text-slate-500 text-[10px] font-mono">{s.loan?.loanNumber}</div>
                  </td>
                  <td className="py-3 text-slate-300">{formatDate(s.createdAt)}</td>
                  <td className="py-3 text-right text-slate-300">{formatCurrency(s.principalOutstanding)}</td>
                  <td className="py-3 text-right font-bold text-amber-400">
                    {s.waiverDiscount > 0 ? `-${formatCurrency(s.waiverDiscount)}` : '₹0'}
                  </td>
                  <td className="py-3 text-right font-black text-white font-mono text-sm">
                    {formatCurrency(s.finalSettlementAmount)}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => setViewNoc(s)}
                      className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-[11px] border border-purple-500/30 flex items-center space-x-1 mx-auto"
                    >
                      <Printer className="w-3 h-3" />
                      <span>View & Print NOC</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official NOC Certificate Print Modal */}
      {viewNoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 print:p-0">
            {/* NOC Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <div className="text-2xl font-black tracking-wider text-slate-900">
                ABS FINANCE MANAGEMENT LTD.
              </div>
              <div className="text-xs text-slate-600">
                123 Financial District, Tech City • GSTIN: 33AAAAA0000A1Z5 • Contact: +91 98765 43210
              </div>
              <div className="inline-block mt-3 px-4 py-1 bg-slate-900 text-white font-bold text-sm tracking-widest uppercase rounded">
                NO OBJECTION & LOAN CLEARANCE CERTIFICATE
              </div>
            </div>

            {/* NOC Body */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="flex justify-between font-mono font-bold text-slate-700">
                <span>Ref No: {viewNoc.nocNumber || 'NOC-2026-001'}</span>
                <span>Date: {formatDate(viewNoc.nocIssuedDate || new Date())}</span>
              </div>

              <p>
                <strong>TO WHOMSOEVER IT MAY CONCERN</strong>
              </p>

              <p>
                This is to certify that <strong>{viewNoc.customer?.name || 'Borrower'}</strong> holding Loan Account Number <strong>{viewNoc.loan?.loanNumber || 'LN-XXXX'}</strong> has cleared all outstanding dues in full and final settlement of the loan facility.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Settlement Agreement No:</span>
                  <span className="font-mono font-bold">{viewNoc.settlementNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settled Amount Received:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(viewNoc.finalSettlementAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding Balance as on Date:</span>
                  <span className="font-bold text-emerald-700">₹0.00 (NIL Dues)</span>
                </div>
              </div>

              <p>
                As on date, there are <strong>NO DUES PENDING</strong> against the borrower for the aforementioned loan account. Any physical collateral, property title deeds, or gold items pledged against this loan stand released to the borrower.
              </p>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-center">
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Branch Operations Manager</div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase mx-auto mb-1">
                    Official Seal
                  </div>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Authorized Signatory</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 no-print">
              <button
                onClick={() => setViewNoc(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official NOC Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

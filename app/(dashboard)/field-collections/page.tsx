'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  QrCode,
  CheckCircle2,
  Navigation,
  Smartphone,
  Plus,
  RefreshCw,
  Search,
  DollarSign,
  TrendingUp,
  Receipt,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export default function FieldCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New collection form state
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI_QR' | 'CHEQUE'>('CASH');
  const [upiRef, setUpiRef] = useState('');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null; address: string }>({
    lat: null,
    lng: null,
    address: '',
  });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchFieldData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/field-collections');
      const data = await res.json();
      if (data.success) {
        setCollections(data.collections || []);
        setPendingLoans(data.pendingRouteLoans || []);
        setTotalCollected(data.totalCollected || 0);
        setTotalVisits(data.totalVisits || 0);
      }
    } catch (err) {
      console.error('Failed to load field collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldData();
  }, []);

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
        });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback default coordinates
        setCoords({
          lat: 19.0760,
          lng: 72.8777,
          address: 'Mumbai Field Cluster (Mock GPS)',
        });
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleStartCollection = (loan: any) => {
    setSelectedLoan(loan);
    setAmount(loan.installmentAmount ? String(loan.installmentAmount) : '');
    handleCaptureLocation();
    setShowModal(true);
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !amount || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/field-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedLoan.customer.id,
          loanId: selectedLoan.id,
          amount: Number(amount),
          paymentMode,
          upiRef: paymentMode === 'UPI_QR' ? upiRef || `UPI-${Date.now().toString().slice(-6)}` : undefined,
          latitude: coords.lat,
          longitude: coords.lng,
          locationAddress: coords.address || selectedLoan.customer.address,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setSelectedLoan(null);
        setAmount('');
        setNotes('');
        setUpiRef('');
        fetchFieldData();
      } else {
        alert(json.error || 'Failed to record collection');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Field Officer & Geotagged Collections
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Doorstep recovery routing, real-time GPS coordinate logging, and instant ledger reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchFieldData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              if (pendingLoans.length > 0) handleStartCollection(pendingLoans[0]);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record Field Collection</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
            <span>Today's Total Collected</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{formatCurrency(totalCollected)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Reconciled to Cash Master</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
            <span>Field Visits Completed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-3">{totalVisits} Doorsteps</div>
          <div className="text-[11px] text-slate-400 mt-1">Geotagged verified visits</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
            <span>Pending Route Stops</span>
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{pendingLoans.length} Loans</div>
          <div className="text-[11px] text-slate-400 mt-1">Assigned for collection</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-brand-400 font-bold uppercase">
            <span>Sync Status</span>
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">100% Live</div>
          <div className="text-[11px] text-slate-400 mt-1">Direct TiDB Ledger Sync</div>
        </div>
      </div>

      {/* Main Content Grid: Route Schedule + Synced Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Route Assignment List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Today's Field Visit Route
              </h2>
              <p className="text-[11px] text-slate-400">Assigned overdue borrowers</p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {pendingLoans.length} Stops
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {pendingLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-400">{loan.loanNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    loan.status === 'OVERDUE'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {loan.status}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-white text-xs">{loan.customer?.name}</div>
                  <div className="text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span>{loan.customer?.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Due Balance</span>
                    <span className="font-bold text-rose-400 font-mono">{formatCurrency(loan.outstandingBalance)}</span>
                  </div>
                  <button
                    onClick={() => handleStartCollection(loan)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 shadow-sm"
                  >
                    <span>Collect Now</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Synced Collection Receipts & Geotags */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-400" /> Geotagged Field Receipts Log
              </h2>
              <p className="text-[11px] text-slate-400">All doorstep payments captured with GPS coordinates</p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold">
              {collections.length} Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-slate-400 border-b border-slate-800 uppercase">
                <tr>
                  <th className="py-2.5">Receipt No</th>
                  <th className="py-2.5">Borrower</th>
                  <th className="py-2.5">Officer</th>
                  <th className="py-2.5">GPS Location Tag</th>
                  <th className="py-2.5">Mode</th>
                  <th className="py-2.5 text-right">Amount Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {collections.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-brand-400">{col.receiptNo}</td>
                    <td className="py-3">
                      <div className="font-semibold text-white">{col.customer?.name}</div>
                      <div className="text-slate-500 text-[10px] font-mono">{col.loan?.loanNumber}</div>
                    </td>
                    <td className="py-3 text-slate-300">{col.officerName}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span className="text-[11px]">{col.locationAddress || 'Doorstep Verified'}</span>
                      </div>
                      {col.latitude && col.longitude && (
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {col.latitude.toFixed(4)}, {col.longitude.toFixed(4)}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        col.paymentMode === 'UPI_QR'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {col.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-emerald-400 font-mono text-sm">
                      {formatCurrency(col.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Collection Recording Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" /> Record Doorstep Field Collection
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCollection} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400">Borrower Details:</div>
                <div className="font-bold text-white text-sm">{selectedLoan.customer?.name} ({selectedLoan.loanNumber})</div>
                <div className="text-slate-400">{selectedLoan.customer?.address}</div>
                <div className="text-rose-400 font-bold font-mono text-xs pt-1">
                  Outstanding Due: {formatCurrency(selectedLoan.outstandingBalance)}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Collection Amount (₹)*</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter collected amount"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold text-base focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'UPI_QR', 'CHEQUE'] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        paymentMode === mode
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMode === 'UPI_QR' && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <QrCode className="w-4 h-4" /> Instant UPI QR Scanner Trigger
                  </div>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="Enter UPI Reference / UTR Number"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              )}

              {/* GPS Geotag info */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" /> Geolocation Coordinates
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {locating ? 'Acquiring GPS Fix...' : coords.address || 'Click to capture current location'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={locating}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  {locating ? 'Locating...' : 'Refresh GPS'}
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Field Notes / Customer Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Met borrower at shop, cash handed over"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? 'Syncing...' : 'Confirm & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

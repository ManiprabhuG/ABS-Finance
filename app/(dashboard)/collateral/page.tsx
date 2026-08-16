'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Gem,
  Building,
  Car,
  FileText,
  CheckCircle2,
  AlertTriangle,
  History,
  Archive,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';

export default function CollateralVaultPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState('AUDIT_INSPECTED');
  const [actionNote, setActionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Deposit Form
  const [loanNumber, setLoanNumber] = useState('');
  const [assetType, setAssetType] = useState('GOLD');
  const [assetDescription, setAssetDescription] = useState('');
  const [itemCount, setItemCount] = useState('1');
  const [grossWeight, setGrossWeight] = useState('');
  const [purityKarat, setPurityKarat] = useState('22K');
  const [marketValue, setMarketValue] = useState('');
  const [lockerNumber, setLockerNumber] = useState('LOCKER-A-01');
  const [sealNumber, setSealNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      let url = '/api/collateral?';
      if (assetFilter) url += `assetType=${assetFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load vault items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [assetFilter, statusFilter]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Find loan ID from loanNumber or use default
      let loanId = 'loan-sample-id';
      const loanRes = await fetch(`/api/loans?search=${encodeURIComponent(loanNumber)}`);
      const loanData = await loanRes.json();
      if (loanData.loans && loanData.loans.length > 0) {
        loanId = loanData.loans[0].id;
      }

      const res = await fetch('/api/collateral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId,
          assetType,
          assetDescription,
          itemCount: Number(itemCount),
          grossWeight: grossWeight ? Number(grossWeight) : null,
          purityKarat,
          marketValue: Number(marketValue),
          lockerNumber,
          sealNumber: sealNumber || `SEAL-${Date.now().toString().slice(-5)}`,
          remarks,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowDepositModal(false);
        setAssetDescription('');
        setMarketValue('');
        setGrossWeight('');
        setLoanNumber('');
        fetchVaultData();
      } else {
        alert(json.error || 'Failed to deposit item');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/collateral', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          status: targetStatus,
          actionNote,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowActionModal(false);
        setSelectedItem(null);
        setActionNote('');
        fetchVaultData();
      } else {
        alert(json.error || 'Failed to update custody status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'GOLD':
        return <Gem className="w-5 h-5 text-amber-400" />;
      case 'PROPERTY_DEED':
        return <Building className="w-5 h-5 text-cyan-400" />;
      case 'VEHICLE_RC':
        return <Car className="w-5 h-5 text-emerald-400" />;
      default:
        return <FileText className="w-5 h-5 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Collateral Vault & Safe Custody Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure physical custody tracking of Gold Jewelry, Property Title Deeds, Vehicle RC Books, and Locker Barcodes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVaultData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Vault</span>
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Deposit Collateral</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase">
            <span>Total Vault Valuation</span>
            <Gem className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{formatCurrency(stats?.totalMarketValue || 0)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Appraised Market Value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
            <span>Active Packets In Vault</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">{stats?.activeInVault || 0} Sealed Packets</div>
          <div className="text-[11px] text-slate-400 mt-1">Dual-custody verified</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-yellow-400 font-bold uppercase">
            <span>Total Gold In Custody</span>
            <Archive className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-yellow-400 mt-3">{stats?.totalGoldWeightGrams || 0} g</div>
          <div className="text-[11px] text-slate-400 mt-1">Net Fine Weight</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
            <span>Released / Closed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-3">{stats?.releasedCount || 0} Returned</div>
          <div className="text-[11px] text-slate-400 mt-1">Handed back upon closure</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Asset Type:
          </span>
          {['', 'GOLD', 'PROPERTY_DEED', 'VEHICLE_RC'].map((t) => (
            <button
              key={t}
              onClick={() => setAssetFilter(t)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                assetFilter === t
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t === '' ? 'All Assets' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">Status:</span>
          {['', 'IN_VAULT', 'AUDIT_INSPECTED', 'RELEASED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s === '' ? 'All Status' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                    {getAssetIcon(item.assetType)}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400">{item.packetNumber}</span>
                    <div className="text-[10px] text-slate-400">Locker: {item.lockerNumber}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  item.status === 'IN_VAULT'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : item.status === 'AUDIT_INSPECTED'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">{item.assetDescription}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Loan: <span className="text-brand-400 font-mono font-semibold">{item.loan?.loanNumber || 'Linked Loan'}</span> • Borrower: {item.customer?.name || 'Borrower'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Market Valuation</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">{formatCurrency(item.marketValue)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">
                    {item.assetType === 'GOLD' ? 'Weight & Karat' : 'Security Seal'}
                  </span>
                  <span className="font-bold text-white text-xs font-mono">
                    {item.assetType === 'GOLD' ? `${item.grossWeight || 0}g (${item.purityKarat || '22K'})` : item.sealNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-[11px] text-slate-500 font-mono">Deposited {formatDate(item.depositDate)}</span>
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setShowActionModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1"
              >
                <span>Custody Action</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" /> Inward Collateral Safe Custody Deposit
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Loan Number / Customer Ref*</label>
                <input
                  type="text"
                  required
                  value={loanNumber}
                  onChange={(e) => setLoanNumber(e.target.value)}
                  placeholder="e.g., LN-2026-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Collateral Asset Category*</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-semibold outline-none"
                >
                  <option value="GOLD">Gold Jewelry / Bullion</option>
                  <option value="PROPERTY_DEED">Original Property Title Deed</option>
                  <option value="VEHICLE_RC">Vehicle Original RC Book</option>
                  <option value="FIXED_DEPOSIT">Fixed Deposit Bond</option>
                  <option value="OTHER">Other Valuable Asset</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Asset Description & Item Spec*</label>
                <textarea
                  required
                  rows={2}
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  placeholder="e.g., 22K Gold Chain & Bangles (Total 4 pcs) in sealed tamper-proof bag"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                />
              </div>

              {assetType === 'GOLD' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gross Weight (Grams)*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                      placeholder="e.g., 34.50"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purity Karat</label>
                    <select
                      value={purityKarat}
                      onChange={(e) => setPurityKarat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="24K">24K (99.9%)</option>
                      <option value="22K">22K (91.6%)</option>
                      <option value="18K">18K (75.0%)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Appraised Market Value (₹)*</label>
                  <input
                    type="number"
                    required
                    value={marketValue}
                    onChange={(e) => setMarketValue(e.target.value)}
                    placeholder="e.g., 250000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Locker Box*</label>
                  <input
                    type="text"
                    required
                    value={lockerNumber}
                    onChange={(e) => setLockerNumber(e.target.value)}
                    placeholder="e.g., LOCKER-B-14"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Security Tamper Seal Barcode</label>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  placeholder="e.g., SEAL-99824 (Auto-generated if blank)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/20"
                >
                  {submitting ? 'Depositing...' : 'Confirm Safe Custody Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custody Action Modal */}
      {showActionModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Vault Custody Action</h3>
              <button onClick={() => setShowActionModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-mono text-amber-400 font-bold">{selectedItem.packetNumber}</div>
                <div className="font-semibold text-white">{selectedItem.assetDescription}</div>
                <div className="text-slate-400">Current Locker: {selectedItem.lockerNumber}</div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Action</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-semibold outline-none"
                >
                  <option value="AUDIT_INSPECTED">Audit Inspected & Re-Sealed</option>
                  <option value="RELEASED">Release Collateral to Borrower (Loan Closed)</option>
                  <option value="AUCTIONED">Transfer to Legal Auction Custody</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Notes / Officer Remarks</label>
                <input
                  type="text"
                  required
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g., Annual internal audit verification completed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {submitting ? 'Updating...' : 'Update Custody Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

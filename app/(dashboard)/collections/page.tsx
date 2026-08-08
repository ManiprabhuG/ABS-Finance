'use client';

import React, { useState, useEffect } from 'react';
import { ReceiptText, Plus, Printer, Search, CheckCircle, X, Eye, Edit, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const [printModal, setPrintModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  // Form State
  const [formData, setFormData] = useState({
    loanId: '',
    amountReceived: '',
    principalPaid: '',
    interestPaid: '',
    penaltyPaid: '0',
    paymentMode: 'CASH',
    bankAccountId: '',
    referenceNo: '',
    notes: '',
  });

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const [colRes, loanRes, accRes] = await Promise.all([
        fetch('/api/collections').then((r) => r.json()),
        fetch('/api/loans?status=ACTIVE').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
      ]);

      if (Array.isArray(colRes)) setCollections(colRes);
      if (Array.isArray(loanRes)) setLoans(loanRes);
      if (accRes.bankAccounts) {
        setBankAccounts(accRes.bankAccounts);
        if (accRes.bankAccounts.length > 0) setFormData((prev) => ({ ...prev, bankAccountId: accRes.bankAccounts[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleOpenEditCollection = (collection: any) => {
    setEditingCollection(collection);
    setFormData({
      loanId: collection.loanId || '',
      amountReceived: collection.amountReceived?.toString() || '',
      principalPaid: collection.principalPaid?.toString() || '',
      interestPaid: collection.interestPaid?.toString() || '',
      penaltyPaid: collection.penaltyPaid?.toString() || '0',
      paymentMode: collection.paymentMode || 'CASH',
      bankAccountId: collection.bankAccountId || '',
      referenceNo: collection.referenceNo || '',
      notes: collection.notes || '',
    });
    setShowModal(true);
  };

  const handleDeleteCollection = async (id: string, collectionId: string) => {
    if (!confirm(`Are you sure you want to delete collection record "${collectionId}"?`)) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCollections();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete collection');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAmountChange = (amountStr: string) => {
    const total = parseFloat(amountStr || '0');
    const intEst = Math.round(total * 0.15);
    const priEst = total - intEst;

    setFormData((prev) => ({
      ...prev,
      amountReceived: amountStr,
      principalPaid: priEst > 0 ? priEst.toString() : '0',
      interestPaid: intEst > 0 ? intEst.toString() : '0',
    }));
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCollection ? `/api/collections/${editingCollection.id}` : '/api/collections';
      const method = editingCollection ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingCollection(null);
        fetchCollections();
      } else {
        const err = await res.json();
        alert(err.error || 'Collection entry failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-brand-600" /> Collection Management & Receipts
          </h1>
          <p className="text-xs text-slate-500">
            Record EMI, partial, advance, and overdue repayments with automated accounting ledger credit.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Collection</span>
        </button>
      </div>

      {/* Collections Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="p-4">Collection ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer & Loan</th>
                <th className="p-4">Amount Received</th>
                <th className="p-4">Breakdown (Principal/Interest/Penalty)</th>
                <th className="p-4">Payment Mode</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    Loading collection records...
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    No collection entries recorded
                  </td>
                </tr>
              ) : (
                collections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {c.collectionId}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(c.collectionDate)}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{c.customer?.name}</div>
                      <div className="text-xs font-mono text-brand-600">{c.loan?.loanNumber}</div>
                    </td>
                    <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.amountReceived)}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      <div>Principal: ₹{c.principalPaid?.toLocaleString()}</div>
                      <div>Interest: ₹{c.interestPaid?.toLocaleString()}</div>
                      {c.penaltyPaid > 0 && <div className="text-rose-500 font-bold">Penalty: ₹{c.penaltyPaid}</div>}
                    </td>
                    <td className="p-4 font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {c.paymentMode}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedReceipt(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="View / Print Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditCollection(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Edit Collection"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(c.id, c.collectionId)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete Collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintModal({ isOpen: true, title: `Collection Receipt - ${c.collectionId}`, url: `/print/receipt/${c.id}` })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 transition-colors"
                          title="Print Official Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Collection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-600" /> Record Loan EMI / Collection
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCollection} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Active Loan Account *</label>
                <select
                  required
                  value={formData.loanId}
                  onChange={(e) => setFormData({ ...formData, loanId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="">-- Choose Loan Account --</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loanNumber} - {l.customer?.name} (Outstanding: ₹{l.outstandingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Total Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.amountReceived}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-lg font-extrabold text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Principal Paid (₹)</label>
                  <input
                    type="number"
                    value={formData.principalPaid}
                    onChange={(e) => setFormData({ ...formData, principalPaid: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Interest Paid (₹)</label>
                  <input
                    type="number"
                    value={formData.interestPaid}
                    onChange={(e) => setFormData({ ...formData, interestPaid: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Penalty (₹)</label>
                  <input
                    type="number"
                    value={formData.penaltyPaid}
                    onChange={(e) => setFormData({ ...formData, penaltyPaid: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Payment Mode *</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                {formData.paymentMode !== 'CASH' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Deposit To Bank Account *</label>
                    <select
                      value={formData.bankAccountId}
                      onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.accountNumber.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md"
                >
                  Record & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 no-print text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-200">
              <div className="font-extrabold text-xl tracking-wide text-slate-900">
                ABS FINANCE MANAGEMENT
              </div>
              <div className="text-xs text-slate-500">Official Payment Receipt</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Receipt No: {selectedReceipt.collectionId}
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-semibold">{formatDate(selectedReceipt.collectionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold">{selectedReceipt.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Number:</span>
                <span className="font-mono font-bold text-brand-600">{selectedReceipt.loan?.loanNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold">{selectedReceipt.paymentMode}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 space-y-1.5 my-2">
                <div className="flex justify-between text-slate-600">
                  <span>Principal Amount:</span>
                  <span>₹{selectedReceipt.principalPaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Interest Amount:</span>
                  <span>₹{selectedReceipt.interestPaid?.toLocaleString()}</span>
                </div>
                {selectedReceipt.penaltyPaid > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Late Penalty:</span>
                    <span>₹{selectedReceipt.penaltyPaid?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-300 font-extrabold text-sm text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600">₹{selectedReceipt.amountReceived?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-3">
              <div>Thank you for your payment. System generated computer receipt.</div>
              <button
                onClick={() => window.print()}
                className="no-print w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
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

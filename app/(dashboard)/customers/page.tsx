'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  FileText,
  UserCheck,
  CheckCircle,
  X,
  Printer,
  Camera,
  Image as ImageIcon,
  Upload,
  Paperclip,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [printModal, setPrintModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  // File Input References
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Proof Documents Array State for Customer Form
  const [proofs, setProofs] = useState<Array<{ title: string; category: string; fileUrl: string }>>([]);
  const [showProofFields, setShowProofFields] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    aadhaar: '',
    pan: '',
    address: '',
    email: '',
    occupation: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeMobile: '',
    remarks: '',
    photoUrl: '',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      mobile: customer.mobile || '',
      aadhaar: customer.aadhaar || '',
      pan: customer.pan || '',
      address: customer.address || '',
      email: customer.email || '',
      occupation: customer.occupation || '',
      nomineeName: customer.nomineeName || '',
      nomineeRelation: customer.nomineeRelation || '',
      nomineeMobile: customer.nomineeMobile || '',
      remarks: customer.remarks || '',
      photoUrl: customer.photoUrl || '',
    });
    setProofs([]);
    setShowProofFields(false);
    setShowModal(true);
  };

  // Handle Photo File Upload (Converts file directly to Data URL for database storage)
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, photoUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Dynamic Proof Attachment Field
  const handleAddProofField = () => {
    setShowProofFields(true);
    setProofs([...proofs, { title: '', category: 'AADHAAR', fileUrl: '' }]);
  };

  const handleRemoveProofField = (index: number) => {
    const updated = [...proofs];
    updated.splice(index, 1);
    setProofs(updated);
  };

  const handleProofChange = (index: number, field: string, value: string) => {
    const updated = [...proofs];
    (updated[index] as any)[field] = value;
    setProofs(updated);
  };

  // Handle Proof Document File Upload (Converts file directly to Data URL for database storage)
  const handleProofFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const updated = [...proofs];
        updated[index].fileUrl = event.target!.result as string;
        if (!updated[index].title) {
          updated[index].title = file.name.replace(/\.[^/.]+$/, '');
        }
        setProofs(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer record for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete customer');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        proofs: proofs.filter((p) => p.title.trim() && p.fileUrl.trim()),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({
          name: '',
          mobile: '',
          aadhaar: '',
          pan: '',
          address: '',
          email: '',
          occupation: '',
          nomineeName: '',
          nomineeRelation: '',
          nomineeMobile: '',
          remarks: '',
          photoUrl: '',
        });
        setProofs([]);
        setShowProofFields(false);
        fetchCustomers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save customer');
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
            <Users className="w-6 h-6 text-brand-600" /> Customer Master Directory
          </h1>
          <p className="text-xs text-slate-500">
            Manage KYC profiles, photo identification upload, proof attachments, loan history, and print customer files.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({
              name: '',
              mobile: '',
              aadhaar: '',
              pan: '',
              address: '',
              email: '',
              occupation: '',
              nomineeName: '',
              nomineeRelation: '',
              nomineeMobile: '',
              remarks: '',
              photoUrl: '',
            });
            setProofs([]);
            setShowProofFields(false);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search by customer name, ID (CUST-1001), mobile number, or Aadhaar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      {/* Customers DataTable */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="p-4">Photo</th>
                <th className="p-4">Customer ID</th>
                <th className="p-4">Name & Address</th>
                <th className="p-4">Mobile & Email</th>
                <th className="p-4">KYC (Aadhaar/PAN)</th>
                <th className="p-4">Total Loans</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    No customers found matching search filter
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Customer Photo Column */}
                    <td className="p-4">
                      {c.photoUrl ? (
                        <img
                          src={c.photoUrl}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-500/20">
                          {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {c.customerId}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{c.address}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-slate-900 dark:text-slate-200">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {c.mobile}
                      </div>
                      {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <div>Aadhaar: {c.aadhaar}</div>
                      {c.pan && <div className="text-slate-500">PAN: {c.pan}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                        {c.loans?.length || 0} Loans
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="View Customer Profile & Documents"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Edit Customer Details & Photo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPrintModal({
                              isOpen: true,
                              title: `Customer Profile - ${c.name}`,
                              url: `/print/customer/${c.id}`,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Print Customer Profile & Photo"
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

      {/* Customer Create & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-600" />
                {editingCustomer ? 'Edit Customer Master Record' : 'Add New Customer Master Record'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Customer Photo Upload Section (Default Visible File Input) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  {formData.photoUrl ? (
                    <div className="relative group">
                      <img
                        src={formData.photoUrl}
                        alt="Customer Preview"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-lg hover:bg-rose-500 transition"
                        title="Remove Photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <Camera className="w-8 h-8 mb-1 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase text-slate-500">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Customer Photo Upload *
                  </label>

                  {/* Hidden File Input & Custom Upload Button */}
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{formData.photoUrl ? 'Change Photo File' : 'Upload Photo File'}</span>
                    </button>
                    {formData.photoUrl && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Photo Loaded
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    Upload image file (JPG, PNG, WebP). Image is stored directly in database and displayed on official Loan Agreements.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="10 digit mobile"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                    placeholder="12 digit Aadhaar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">PAN Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Residential Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address with pincode..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@email.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Business / Salaried"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Nominee details */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-xs text-brand-600 dark:text-brand-400">
                  Nominee Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nominee Name"
                    value={formData.nomineeName}
                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={formData.nomineeRelation}
                    onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Nominee Mobile"
                    value={formData.nomineeMobile}
                    onChange={(e) => setFormData({ ...formData, nomineeMobile: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* "Add Proof" Button & Dynamic Proof File Upload Fields */}
              <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Identity & Document Proof Attachments
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProofField}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-lg shadow-sm transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Proof Document</span>
                  </button>
                </div>

                {proofs.map((proof, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveProofField(idx)}
                      className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Proof Title (e.g. Aadhaar Card Front)"
                        value={proof.title}
                        onChange={(e) => handleProofChange(idx, 'title', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                      <select
                        value={proof.category}
                        onChange={(e) => handleProofChange(idx, 'category', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="PROPERTY_DOC">Property Document</option>
                        <option value="PHOTO">Customer Photo</option>
                        <option value="OTHER">Other Proof</option>
                      </select>

                      {/* Proof File Picker */}
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                          <Paperclip className="w-3.5 h-3.5 text-brand-600" />
                          <span className="truncate">
                            {proof.fileUrl ? 'Change File' : 'Upload Proof File'}
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleProofFileUpload(idx, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {proof.fileUrl && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> File attached & ready for database upload
                      </div>
                    )}
                  </div>
                ))}

                {proofs.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">
                    Click "Add Proof Document" above to upload extra identity proof files (Aadhaar, PAN, Property Deed).
                  </p>
                )}
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
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md"
                >
                  Save Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                {selectedCustomer.photoUrl ? (
                  <img
                    src={selectedCustomer.photoUrl}
                    alt={selectedCustomer.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-lg border border-brand-500/20">
                    {selectedCustomer.name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-xs font-mono font-bold text-brand-600">
                    {selectedCustomer.customerId}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedCustomer.name}
                  </h2>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
                <div>
                  <div className="text-xs text-slate-500">Mobile Number</div>
                  <div className="font-semibold">{selectedCustomer.mobile}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Aadhaar</div>
                  <div className="font-semibold">{selectedCustomer.aadhaar}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">PAN Number</div>
                  <div className="font-semibold">{selectedCustomer.pan || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Occupation</div>
                  <div className="font-semibold">{selectedCustomer.occupation || 'N/A'}</div>
                </div>
              </div>

              {/* Uploaded Documents & Proofs */}
              {selectedCustomer.documents && selectedCustomer.documents.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-600" /> Attached Proof Documents ({selectedCustomer.documents.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCustomer.documents.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 flex items-center space-x-3 transition bg-slate-50 dark:bg-slate-800/40"
                      >
                        <ImageIcon className="w-5 h-5 text-brand-600 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">{doc.category}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Loan History ({selectedCustomer.loans?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedCustomer.loans?.map((l: any) => (
                    <div key={l.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-brand-600">{l.loanNumber}</div>
                        <div className="text-xs text-slate-500">{l.loanType} Loan | {l.interestRate}% Interest</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(l.principalAmount)}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                          {l.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

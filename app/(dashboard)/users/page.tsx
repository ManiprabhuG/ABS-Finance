'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, UserPlus, X, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/export-utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedViewUser, setSelectedViewUser] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: 'admin123',
    name: '',
    email: '',
    role: 'LOAN_OFFICER',
    branch: 'Main Mumbai Branch',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      role: user.role,
      branch: user.branch || 'Main Branch',
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete system user account "@${username}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ username: '', password: 'admin123', name: '', email: '', role: 'LOAN_OFFICER', branch: 'Main Mumbai Branch' });
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'User operation failed');
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
            <ShieldCheck className="w-6 h-6 text-brand-600" /> User Management & RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Manage system access accounts across Super Admin, Admin, Accountant, Collection Officer, Loan Officer, and Viewer roles.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', password: 'admin123', name: '', email: '', role: 'LOAN_OFFICER', branch: 'Main Mumbai Branch' });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4">Username</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Role Designation</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    Loading system user accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-600">@{u.username}</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">{u.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold text-xs border border-brand-200 dark:border-brand-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{u.branch}</td>
                    <td className="p-4 font-bold text-xs text-emerald-600">{u.status}</td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedViewUser(u)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="View User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Edit User Account"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600" /> Create System User Account
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-sm">
              <input
                type="text"
                required
                placeholder="Username (e.g. jdoe)"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
              <input
                type="text"
                required
                placeholder="Full Name (e.g. John Doe)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
              />
              <div>
                <label className="block text-xs font-semibold mb-1">Assign Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="COLLECTION_OFFICER">Collection Officer</option>
                  <option value="LOAN_OFFICER">Loan Officer</option>
                  <option value="VIEWER">Auditor / Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {selectedViewUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" /> User Profile: @{selectedViewUser.username}
              </h3>
              <button onClick={() => setSelectedViewUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
              <div className="flex justify-between"><span className="text-slate-400">Username:</span><span className="font-bold text-brand-600">@{selectedViewUser.username}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Full Name:</span><span className="font-semibold">{selectedViewUser.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email:</span><span>{selectedViewUser.email || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Role:</span><span className="font-bold text-emerald-600">{selectedViewUser.role}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Branch:</span><span>{selectedViewUser.branch}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="font-bold">{selectedViewUser.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Created:</span><span>{formatDate(selectedViewUser.createdAt)}</span></div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedViewUser(null)}
                className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl shadow text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

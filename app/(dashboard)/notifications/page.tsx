'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  Clock,
  Mail,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/lib/export-utils';

export default function NotificationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [overdueBorrowers, setOverdueBorrowers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<
    'EMI_DUE_REMINDER' | 'PAYMENT_RECEIPT' | 'OVERDUE_PENALTY' | 'LEGAL_NOTICE' | 'OTS_OFFER'
  >('EMI_DUE_REMINDER');

  // Send form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>('WHATSAPP');
  const [customText, setCustomText] = useState('');
  const [sending, setSending] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');

  const fetchNotificationData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setOverdueBorrowers(data.overdueBorrowers || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const getTemplatePreview = () => {
    const name = recipientName || 'Rajesh Sharma';
    switch (activeTemplate) {
      case 'EMI_DUE_REMINDER':
        return `Dear ${name}, gentle reminder from ABS Finance that your upcoming loan installment is scheduled for payment. Kindly keep sufficient balance or pay via UPI. Contact: +91 98765 43210. Thank you!`;
      case 'PAYMENT_RECEIPT':
        return `Dear ${name}, your repayment has been received and credited successfully to your ABS Finance Loan account. Thank you for your timely payment!`;
      case 'OVERDUE_PENALTY':
        return `URGENT NOTICE: Dear ${name}, your loan repayment is OVERDUE with ABS Finance. Penal interest is accruing daily. Please clear arrears immediately to avoid legal action & CIBIL reporting.`;
      case 'LEGAL_NOTICE':
        return `LEGAL RECOVERY NOTICE: To ${name}, despite multiple reminders, your loan account remains defaulted. Formal notice under Section 138 / Recovery Proceedings is being initiated. Contact Branch Manager urgently.`;
      case 'OTS_OFFER':
        return `Special One-Time Settlement (OTS) Offer: Dear ${name}, ABS Finance is offering up to 50% waiver on penal charges for full loan closure this month. Contact us for your settlement quote.`;
    }
  };

  const handleSelectBorrower = (b: any) => {
    setRecipientName(b.customer?.name || '');
    setRecipientMobile(b.customer?.mobile || '');
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientMobile || !recipientName) return;

    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientMobile,
          channel,
          templateType: activeTemplate,
          customMessage: customText || getTemplatePreview(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (json.whatsappUrl && channel === 'WHATSAPP') {
          setWhatsappLink(json.whatsappUrl);
          // Open WhatsApp web in new tab
          window.open(json.whatsappUrl, '_blank');
        }
        setCustomText('');
        fetchNotificationData();
      } else {
        alert(json.error || 'Failed to send notification');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Automated WhatsApp & SMS Notification Gateway
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-channel customer communication for EMI reminders, receipt dispatches, and overdue legal notices.
            </p>
          </div>
        </div>

        <button
          onClick={fetchNotificationData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-green-400 font-bold uppercase">
            <span>Total Messages Dispatched</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{stats?.totalSent || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across WhatsApp & SMS</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
            <span>Delivery Success Rate</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">{stats?.deliveryRate || 100}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Instant delivery confirmed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold uppercase">
            <span>Overdue Alert Queue</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-rose-400 mt-3">{overdueBorrowers.length} Borrowers</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending recovery alert</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-brand-400 font-bold uppercase">
            <span>Gateway Health</span>
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">Active 24/7</div>
          <div className="text-[11px] text-slate-400 mt-1">WhatsApp Cloud API & SMS Node</div>
        </div>
      </div>

      {/* Main Dispatch Center & Quick Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Dispatch Console */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" /> Send Multi-Channel Notification
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold">
              Direct Trigger Active
            </span>
          </div>

          {/* Template Switcher */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Message Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
              {[
                { id: 'EMI_DUE_REMINDER', label: 'EMI Due Reminder' },
                { id: 'PAYMENT_RECEIPT', label: 'Payment Receipt' },
                { id: 'OVERDUE_PENALTY', label: 'Overdue Penalty Alert' },
                { id: 'LEGAL_NOTICE', label: 'Legal Recovery Notice' },
                { id: 'OTS_OFFER', label: 'OTS Settlement Offer' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTemplate(t.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    activeTemplate === t.id
                      ? 'bg-green-600/20 border-green-500 text-green-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recipient Name*</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., Rajesh Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Number (10 Digits)*</label>
                <input
                  type="tel"
                  required
                  value={recipientMobile}
                  onChange={(e) => setRecipientMobile(e.target.value)}
                  placeholder="e.g., 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Delivery Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {(['WHATSAPP', 'SMS', 'EMAIL'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      channel === ch
                        ? 'bg-green-600/20 border-green-500 text-green-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Message Preview */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Message Content (Auto-generated or Custom Edit)
              </label>
              <textarea
                rows={3}
                value={customText || getTemplatePreview()}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-green-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500">
                Messages will include verified business profile sender headers.
              </div>
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow-lg shadow-green-600/20 flex items-center space-x-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Dispatching...' : `Dispatch via ${channel}`}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Quick Overdue Target List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" /> Overdue Candidates
              </h2>
              <p className="text-[11px] text-slate-400">Click to autofill reminder</p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-mono font-bold">
              {overdueBorrowers.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {overdueBorrowers.map((loan) => (
              <div
                key={loan.id}
                onClick={() => handleSelectBorrower(loan)}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-green-500/60 cursor-pointer transition space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs group-hover:text-green-400 transition">
                    {loan.customer?.name}
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                    {loan.npaDays}d Overdue
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{loan.customer?.mobile}</span>
                  <span className="font-bold text-slate-300">{loan.loanNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Dispatch History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Notification Delivery Log
            </h2>
            <p className="text-xs text-slate-400">Real-time audit trail of all messages sent to borrowers</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
            {logs.length} Total Logs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="py-2.5">Date & Time</th>
                <th className="py-2.5">Recipient</th>
                <th className="py-2.5">Mobile</th>
                <th className="py-2.5">Channel</th>
                <th className="py-2.5">Template Type</th>
                <th className="py-2.5">Message Snippet</th>
                <th className="py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 text-slate-400 font-mono">{formatDate(log.createdAt)}</td>
                  <td className="py-3 font-semibold text-white">{log.recipientName}</td>
                  <td className="py-3 font-mono text-slate-300">{log.recipientMobile}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.channel === 'WHATSAPP'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {log.channel}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-medium">{log.templateType.replace(/_/g, ' ')}</td>
                  <td className="py-3 text-slate-400 max-w-[280px] truncate">{log.messageContent}</td>
                  <td className="py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

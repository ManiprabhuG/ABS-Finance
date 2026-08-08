'use client';

import React from 'react';
import {
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Calendar,
  Wallet,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  ShieldAlert,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '@/lib/export-utils';

interface StatCardsProps {
  stats: {
    totalCustomers: number;
    activeLoans: number;
    closedLoans: number;
    pendingLoans: number;
    overdueLoans: number;
    todayCollection: number;
    monthlyCollection: number;
    totalOutstanding: number;
    totalMortgageValue: number;
    cashInHand: number;
    bankBalance: number;
    totalIncome: number;
    totalExpense: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    { label: 'Total Customers', value: stats.totalCustomers, type: 'number', icon: Users, color: 'from-blue-600 to-indigo-600', text: 'text-blue-500' },
    { label: 'Active Loans', value: stats.activeLoans, type: 'number', icon: CreditCard, color: 'from-emerald-600 to-teal-600', text: 'text-emerald-500' },
    { label: 'Closed Loans', value: stats.closedLoans, type: 'number', icon: CheckCircle2, color: 'from-slate-600 to-gray-600', text: 'text-slate-500' },
    { label: 'Pending Approval', value: stats.pendingLoans, type: 'number', icon: Clock, color: 'from-amber-500 to-orange-500', text: 'text-amber-500' },
    { label: 'Overdue Loans', value: stats.overdueLoans, type: 'number', icon: AlertOctagon, color: 'from-rose-600 to-red-600', text: 'text-rose-500' },
    { label: "Today's Collection", value: stats.todayCollection, type: 'currency', icon: Calendar, color: 'from-emerald-500 to-green-600', text: 'text-emerald-500' },
    { label: 'Monthly Collection', value: stats.monthlyCollection, type: 'currency', icon: PiggyBank, color: 'from-teal-600 to-emerald-700', text: 'text-teal-500' },
    { label: 'Total Outstanding', value: stats.totalOutstanding, type: 'currency', icon: Wallet, color: 'from-cyan-600 to-blue-700', text: 'text-cyan-500' },
    { label: 'Total Mortgage Value', value: stats.totalMortgageValue, type: 'currency', icon: Building, color: 'from-violet-600 to-purple-700', text: 'text-violet-500' },
    { label: 'Cash In Hand', value: stats.cashInHand, type: 'currency', icon: Landmark, color: 'from-amber-600 to-yellow-600', text: 'text-amber-500' },
    { label: 'Bank Balance', value: stats.bankBalance, type: 'currency', icon: Building, color: 'from-blue-700 to-indigo-800', text: 'text-blue-500' },
    { label: 'Total Income', value: stats.totalIncome, type: 'currency', icon: ArrowUpRight, color: 'from-emerald-600 to-teal-600', text: 'text-emerald-500' },
    { label: 'Total Expense', value: stats.totalExpense, type: 'currency', icon: ArrowDownRight, color: 'from-rose-600 to-pink-600', text: 'text-rose-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {c.label}
              </span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${c.color} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {c.type === 'currency' ? formatCurrency(c.value) : c.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

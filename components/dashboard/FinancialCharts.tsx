'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ChartsProps {
  collectionData?: Array<{ month: string; amount: number }>;
  loanTypeData?: Array<{ name: string; value: number }>;
  financialData?: Array<{ month: string; income: number; expense: number }>;
}

const COLORS = ['#0c8ee9', '#10b981', '#facc15', '#f43f5e', '#8b5cf6'];

export function FinancialCharts({
  collectionData = [
    { month: 'Mar', amount: 320000 },
    { month: 'Apr', amount: 410000 },
    { month: 'May', amount: 380000 },
    { month: 'Jun', amount: 520000 },
    { month: 'Jul', amount: 610000 },
    { month: 'Aug', amount: 740000 },
  ],
  loanTypeData = [
    { name: 'Mortgage Loan', value: 65 },
    { name: 'Normal Loan', value: 25 },
    { name: 'Custom Loan', value: 10 },
  ],
  financialData = [
    { month: 'Mar', income: 45000, expense: 22000 },
    { month: 'Apr', income: 58000, expense: 28000 },
    { month: 'May', income: 62000, expense: 31000 },
    { month: 'Jun', income: 75000, expense: 29000 },
    { month: 'Jul', income: 89000, expense: 34000 },
    { month: 'Aug', income: 94000, expense: 35000 },
  ],
}: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* 1. Collection Trend Area Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Collection Growth Trend
            </h3>
            <p className="text-xs text-slate-500">Monthly EMI & Principal Recovery (INR)</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={collectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8ee9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0c8ee9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Collections']} />
              <Area type="monotone" dataKey="amount" stroke="#0c8ee9" strokeWidth={3} fillOpacity={1} fill="url(#colorCol)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Income vs Expense Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Income vs Expenses
            </h3>
            <p className="text-xs text-slate-500">Financial Performance Comparison</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" name="Interest & Fees Income" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Operational Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Loan Portfolio Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Loan Type Portfolio Distribution
            </h3>
            <p className="text-xs text-slate-500">Mortgage vs Normal vs Custom Asset Backed Loans</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={loanTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {loanTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

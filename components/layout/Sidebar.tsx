'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ReceiptText,
  Landmark,
  SlidersHorizontal,
  BarChart3,
  Settings,
  History,
  ShieldCheck,
  Building,
  ShieldAlert,
  AlertOctagon,
  Gavel,
  TrendingUp,
} from 'lucide-react';
import { hasPermission } from '@/lib/auth';

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role = 'SUPER_ADMIN' }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'COLLECTION_OFFICER', 'LOAN_OFFICER', 'VIEWER'] },
    { label: 'Customer Master', href: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'COLLECTION_OFFICER', 'LOAN_OFFICER', 'VIEWER'] },
    { label: 'Loan Management', href: '/loans', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'LOAN_OFFICER', 'VIEWER'] },
    { label: 'Collection Entry', href: '/collections', icon: ReceiptText, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'COLLECTION_OFFICER', 'VIEWER'] },
    { label: 'Finance & Accounts', href: '/finance', icon: Landmark, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'VIEWER'] },
    { label: 'Risk Engine', href: '/risk', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'LOAN_OFFICER'] },
    { label: 'Fraud Alerts', href: '/fraud', icon: AlertOctagon, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { label: 'NPA & Recovery', href: '/npa', icon: Gavel, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'COLLECTION_OFFICER'] },
    { label: 'CEO Dashboard (BI)', href: '/bi', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { label: 'Slabs & Rates', href: '/slabs', icon: SlidersHorizontal, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'LOAN_OFFICER'] },
    { label: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'VIEWER'] },
    { label: 'Audit Logs', href: '/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { label: 'User Management', href: '/users', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role) || role === 'SUPER_ADMIN');

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center space-x-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-black text-xl">
          ABS
        </div>
        <div>
          <div className="font-bold text-white tracking-wide text-base leading-tight">
            ABS Finance
          </div>
          <div className="text-[10px] font-semibold text-brand-400 tracking-wider uppercase">
            Management Suite
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Core Navigation
        </div>
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        <div>ABS Financial Systems v2.4</div>
        <div className="text-[10px] text-slate-600 mt-0.5">TiDB Database & Ledger Sync Active</div>
      </div>
    </aside>
  );
}

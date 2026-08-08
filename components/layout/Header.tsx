'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Building2,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { useRouter } from 'next/navigation';

export function Header({ user }: { user?: { username: string; name: string; role: string; branch: string } }) {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch || 'Main Mumbai Branch');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors">
        {/* Left: Global Search trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-2 rounded-xl text-sm transition-colors border border-slate-200 dark:border-slate-700/50 min-w-[240px] md:min-w-[320px]"
          >
            <Search className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="flex-1 text-left">Search customers, loans, collections...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
              Ctrl K
            </kbd>
          </button>

          {/* Branch Selector */}
          <div className="hidden lg:flex items-center space-x-1 text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800/50">
            <Building2 className="w-3.5 h-3.5 mr-1 text-brand-600" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent font-medium border-none outline-none cursor-pointer"
            >
              <option value="Main Mumbai Branch">Main Mumbai Branch</option>
              <option value="Thane Regional Office">Thane Regional Office</option>
              <option value="Navi Mumbai Branch">Navi Mumbai Branch</option>
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gold-400 animate-pulse" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Notifications
                  </span>
                  <span className="text-[11px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-medium">
                    3 New
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-orange-900 dark:text-orange-300">
                        Overdue Payment Alert
                      </div>
                      <div className="text-orange-700 dark:text-orange-400 mt-0.5">
                        Loan LN-2026-003 (Vikram Singh) EMI overdue by 12 days.
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/40 flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-brand-900 dark:text-brand-300">
                        Loan Approval Pending
                      </div>
                      <div className="text-brand-700 dark:text-brand-400 mt-0.5">
                        Mortgage Loan request for Rajesh Sharma requires review.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/60"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name || 'Super Admin'}
                </div>
                <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                  {user?.role || 'SUPER_ADMIN'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                    {user?.name || 'Administrator'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    @{user?.username || 'admin'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

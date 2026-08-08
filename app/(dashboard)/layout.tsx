import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar role={session?.role || 'SUPER_ADMIN'} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={session || { username: 'admin', name: 'Super Admin', role: 'SUPER_ADMIN', branch: 'Main Mumbai Branch' }} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

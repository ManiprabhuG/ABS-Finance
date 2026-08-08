import React from 'react';
import './globals.css';

export const metadata = {
  title: 'ABS Finance Management Software',
  description: 'Enterprise NBFC Loan, Mortgage & Accounting Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}

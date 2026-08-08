import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(['SUPER_ADMIN']);
    if (error) return error;

    const [
      settings,
      users,
      customers,
      loans,
      mortgageDetails,
      interestSlabs,
      ltvSlabs,
      collections,
      bankAccounts,
      cashAccount,
      ledgerEntries,
      incomes,
      expenses,
      fundTransfers,
      auditLogs,
    ] = await Promise.all([
      db.systemSettings.findMany(),
      db.user.findMany({ select: { id: true, username: true, name: true, email: true, role: true, branch: true, status: true, createdAt: true } }),
      db.customer.findMany(),
      db.loan.findMany(),
      db.mortgageDetail.findMany(),
      db.interestSlab.findMany(),
      db.lTVInterestSlab.findMany(),
      db.collection.findMany(),
      db.bankAccount.findMany(),
      db.cashAccount.findMany(),
      db.ledgerEntry.findMany(),
      db.income.findMany(),
      db.expense.findMany(),
      db.fundTransfer.findMany(),
      db.auditLog.findMany({ take: 1000, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      exportTimestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'abs_finance',
      tables: {
        settings,
        users,
        customers,
        loans,
        mortgageDetails,
        interestSlabs,
        ltvSlabs,
        collections,
        bankAccounts,
        cashAccount,
        ledgerEntries,
        incomes,
        expenses,
        fundTransfers,
        auditLogs,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="abs_finance_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

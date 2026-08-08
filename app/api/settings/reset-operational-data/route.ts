import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    // Only SUPER_ADMIN can execute operational data purge
    const { session, error } = await requireRole(['SUPER_ADMIN']);
    if (error) return error;

    await db.$transaction(async (tx) => {
      // 1. Delete operational records in order of dependency
      await tx.document.deleteMany();
      await tx.ledgerEntry.deleteMany();
      await tx.collection.deleteMany();
      await tx.mortgageDetail.deleteMany();
      await tx.loan.deleteMany();
      await tx.income.deleteMany();
      await tx.expense.deleteMany();
      await tx.fundTransfer.deleteMany();
      await tx.auditLog.deleteMany();

      // 2. Reset bank account current balances back to their opening balances
      const bankAccounts = await tx.bankAccount.findMany();
      for (const bank of bankAccounts) {
        await tx.bankAccount.update({
          where: { id: bank.id },
          data: { currentBalance: bank.openingBalance },
        });
      }

      // 3. Reset Cash In Hand to zero
      await tx.cashAccount.upsert({
        where: { id: 'cash-master' },
        update: { currentBalance: 0 },
        create: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 0 },
      });

      // 4. Log the purge event
      await tx.auditLog.create({
        data: {
          userId: session!.id,
          username: session!.username,
          action: 'DELETE',
          module: 'SETTINGS',
          details: 'PURGE OPERATIONAL DATA: Reset all loans, collections, ledger entries, incomes, expenses, and fund transfers. Customers, Users, Slabs, and Settings preserved.',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Operational data successfully reset. Customers, Users, Slabs, and Settings preserved.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

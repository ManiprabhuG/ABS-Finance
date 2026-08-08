import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const bankAccounts = await db.bankAccount.findMany({
      orderBy: { createdAt: 'asc' },
    });

    let cashAccount = await db.cashAccount.findUnique({ where: { id: 'cash-master' } });
    if (!cashAccount) {
      cashAccount = await db.cashAccount.create({
        data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 485000 },
      });
    }

    return NextResponse.json({
      bankAccounts,
      cashAccount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.accountName || !data.accountNumber || !data.bankName || !data.ifsc) {
      return NextResponse.json({ error: 'All bank account details are required' }, { status: 400 });
    }

    const opening = parseFloat(data.openingBalance || '0');

    const bankAcc = await db.bankAccount.create({
      data: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        branch: data.branch || 'Main Branch',
        ifsc: data.ifsc,
        openingBalance: opening,
        currentBalance: opening,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'CREATE',
        module: 'FINANCE',
        details: `Added Bank Account ${bankAcc.bankName} (${bankAcc.accountNumber})`,
      },
    });

    return NextResponse.json(bankAcc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

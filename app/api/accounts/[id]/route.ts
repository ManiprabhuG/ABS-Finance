import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bank = await db.bankAccount.findUnique({ where: { id } });
    if (!bank) return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    return NextResponse.json(bank);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const data = await request.json();

    const updated = await db.bankAccount.update({
      where: { id },
      data: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        branch: data.branch,
        ifsc: data.ifsc,
        openingBalance: data.openingBalance ? parseFloat(data.openingBalance) : undefined,
        currentBalance: data.currentBalance ? parseFloat(data.currentBalance) : undefined,
        status: data.status || undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'UPDATE',
        module: 'FINANCE',
        details: `Updated bank account ${updated.bankName} (${updated.accountNumber})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const bank = await db.bankAccount.findUnique({ where: { id } });
    if (!bank) return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });

    await db.bankAccount.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'FINANCE',
        details: `Deleted bank account ${bank.bankName} (${bank.accountNumber})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

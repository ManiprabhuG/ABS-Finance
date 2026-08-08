import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = await db.expense.findUnique({ where: { id } });
    if (!expense) return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });
    return NextResponse.json(expense);
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

    const updated = await db.expense.update({
      where: { id },
      data: {
        category: data.category,
        amount: parseFloat(data.amount),
        paymentMode: data.paymentMode,
        remarks: data.remarks || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'UPDATE',
        module: 'FINANCE',
        details: `Updated expense entry ${updated.expenseNo}`,
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

    const exp = await db.expense.findUnique({ where: { id } });
    if (!exp) return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });

    await db.expense.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'FINANCE',
        details: `Deleted expense entry ${exp.expenseNo}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

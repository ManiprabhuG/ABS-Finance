import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const entry = await db.ledgerEntry.findUnique({
      where: { id },
      include: { loan: true, collection: true, bankAccount: true },
    });

    if (!entry) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']);
    if (error) return error;

    const { id } = await params;
    const data = await request.json();

    const existing = await db.ledgerEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 });

    const updateData: any = {};
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.referenceNo !== undefined) updateData.referenceNo = data.referenceNo || null;
    if (data.debit !== undefined) updateData.debit = parseFloat(data.debit || '0');
    if (data.credit !== undefined) updateData.credit = parseFloat(data.credit || '0');

    const updated = await db.ledgerEntry.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'UPDATE',
        module: 'FINANCE',
        details: `Updated master ledger entry ${updated.ledgerId}`,
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
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    if (error) return error;

    const { id } = await params;

    const entry = await db.ledgerEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 });

    await db.ledgerEntry.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'DELETE',
        module: 'FINANCE',
        details: `Deleted master ledger entry ${entry.ledgerId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

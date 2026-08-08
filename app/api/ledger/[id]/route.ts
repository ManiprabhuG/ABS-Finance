import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const session = await getSession();
    const data = await request.json();

    const updated = await db.ledgerEntry.update({
      where: { id },
      data: {
        remarks: data.remarks,
        referenceNo: data.referenceNo || undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'UPDATE',
        module: 'FINANCE',
        details: `Updated ledger entry ${updated.ledgerId}`,
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

    const entry = await db.ledgerEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 });

    await db.ledgerEntry.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'FINANCE',
        details: `Deleted ledger entry ${entry.ledgerId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

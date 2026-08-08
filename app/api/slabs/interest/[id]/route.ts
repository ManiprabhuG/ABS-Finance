import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slab = await db.interestSlab.findUnique({ where: { id } });
    if (!slab) return NextResponse.json({ error: 'Interest slab not found' }, { status: 404 });
    return NextResponse.json(slab);
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

    const updated = await db.interestSlab.update({
      where: { id },
      data: {
        name: data.name,
        fromAmount: parseFloat(data.fromAmount),
        toAmount: parseFloat(data.toAmount),
        interestRate: parseFloat(data.interestRate),
        status: data.status || 'ACTIVE',
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'UPDATE',
        module: 'SETTINGS',
        details: `Updated Interest Slab ${updated.name}`,
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

    const slab = await db.interestSlab.findUnique({ where: { id } });
    if (!slab) return NextResponse.json({ error: 'Interest slab not found' }, { status: 404 });

    await db.interestSlab.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'SETTINGS',
        details: `Deleted Interest Slab ${slab.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

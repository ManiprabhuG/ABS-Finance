import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slab = await db.lTVInterestSlab.findUnique({ where: { id } });
    if (!slab) return NextResponse.json({ error: 'LTV slab not found' }, { status: 404 });
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

    const updated = await db.lTVInterestSlab.update({
      where: { id },
      data: {
        ltvRange: data.ltvRange,
        minLtv: parseFloat(data.minLtv),
        maxLtv: parseFloat(data.maxLtv),
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
        details: `Updated LTV Slab ${updated.ltvRange}`,
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

    const slab = await db.lTVInterestSlab.findUnique({ where: { id } });
    if (!slab) return NextResponse.json({ error: 'LTV slab not found' }, { status: 404 });

    await db.lTVInterestSlab.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'SETTINGS',
        details: `Deleted LTV Slab ${slab.ltvRange}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

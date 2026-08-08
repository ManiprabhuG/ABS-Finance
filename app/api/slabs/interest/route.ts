import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const slabs = await db.interestSlab.findMany({
      orderBy: { fromAmount: 'asc' },
    });
    return NextResponse.json(slabs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.name || !data.fromAmount || !data.toAmount || !data.interestRate) {
      return NextResponse.json({ error: 'Slab Name, Amount Range, and Interest Rate are required' }, { status: 400 });
    }

    const slab = await db.interestSlab.create({
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
        action: 'CREATE',
        module: 'SETTINGS',
        details: `Created Interest Slab ${slab.name}`,
      },
    });

    return NextResponse.json(slab);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.interestSlab.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

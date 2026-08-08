import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const slabs = await db.lTVInterestSlab.findMany({
      orderBy: { minLtv: 'asc' },
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

    if (!data.ltvRange || data.minLtv === undefined || data.maxLtv === undefined || !data.interestRate) {
      return NextResponse.json({ error: 'LTV Range, Min/Max %, and Interest Rate are required' }, { status: 400 });
    }

    const slab = await db.lTVInterestSlab.create({
      data: {
        ltvRange: data.ltvRange,
        minLtv: parseFloat(data.minLtv),
        maxLtv: parseFloat(data.maxLtv),
        interestRate: parseFloat(data.interestRate),
        loanCategory: data.loanCategory || 'MORTGAGE',
        status: data.status || 'ACTIVE',
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'CREATE',
        module: 'SETTINGS',
        details: `Created LTV Slab ${slab.ltvRange} @ ${slab.interestRate}%`,
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

    await db.lTVInterestSlab.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

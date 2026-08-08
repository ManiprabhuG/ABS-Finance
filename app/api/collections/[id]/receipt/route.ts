import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await db.collection.findUnique({
      where: { id },
      include: {
        customer: true,
        loan: true,
        recordedBy: { select: { name: true, username: true } },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection receipt not found' }, { status: 404 });
    }

    const settings = await db.systemSettings.findUnique({ where: { id: 'default-settings' } });

    return NextResponse.json({
      collection,
      settings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

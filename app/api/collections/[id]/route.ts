import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await db.collection.findUnique({
      where: { id },
      include: {
        loan: true,
        customer: true,
        recordedBy: true,
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection record not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
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

    const updated = await db.collection.update({
      where: { id },
      data: {
        amountReceived: parseFloat(data.amountReceived),
        principalPaid: parseFloat(data.principalPaid || '0'),
        interestPaid: parseFloat(data.interestPaid || '0'),
        penaltyPaid: parseFloat(data.penaltyPaid || '0'),
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo || null,
        notes: data.notes || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'UPDATE',
        module: 'COLLECTION',
        details: `Updated collection entry ${updated.collectionId}`,
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

    const col = await db.collection.findUnique({ where: { id } });
    if (!col) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    await db.collection.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'COLLECTION',
        details: `Deleted collection entry ${col.collectionId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

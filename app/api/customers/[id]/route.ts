import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            mortgageDetail: true,
            collections: { orderBy: { collectionDate: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        collections: {
          include: { loan: true },
          orderBy: { collectionDate: 'desc' },
        },
        documents: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
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

    const updated = await db.customer.update({
      where: { id },
      data: {
        name: data.name,
        mobile: data.mobile,
        aadhaar: data.aadhaar,
        pan: data.pan || null,
        address: data.address,
        email: data.email || null,
        occupation: data.occupation || null,
        nomineeName: data.nomineeName || null,
        nomineeRelation: data.nomineeRelation || null,
        nomineeMobile: data.nomineeMobile || null,
        remarks: data.remarks || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'UPDATE',
        module: 'CUSTOMER',
        details: `Updated details for customer ${updated.name} (${updated.customerId})`,
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

    const customer = await db.customer.findUnique({ where: { id }, include: { loans: true } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    if (customer.loans.some((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')) {
      return NextResponse.json(
        { error: 'Cannot delete customer with active or overdue loans' },
        { status: 400 }
      );
    }

    await db.customer.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'CUSTOMER',
        details: `Deleted customer ${customer.name} (${customer.customerId})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

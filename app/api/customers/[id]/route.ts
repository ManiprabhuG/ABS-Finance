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
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER']);
    if (error) return error;

    const { id } = await params;
    const data = await request.json();

    // Input validation
    if (!data.name || !data.mobile || !data.aadhaar) {
      return NextResponse.json({ error: 'Name, Mobile, and Aadhaar are required' }, { status: 400 });
    }
    if (data.mobile && !/^\d{10}$/.test(data.mobile)) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits' }, { status: 400 });
    }
    if (data.aadhaar && !/^\d{12}$/.test(data.aadhaar)) {
      return NextResponse.json({ error: 'Aadhaar number must be exactly 12 digits' }, { status: 400 });
    }

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
        photoUrl: data.photoUrl !== undefined ? data.photoUrl : undefined,
      },
    });

    if (data.proofs && Array.isArray(data.proofs)) {
      for (const proof of data.proofs) {
        if (proof.fileUrl && proof.title) {
          await db.document.create({
            data: {
              title: proof.title,
              category: proof.category || 'OTHER',
              fileUrl: proof.fileUrl,
              customerId: updated.id,
              isEncrypted: true,
              watermarkText: `CONFIDENTIAL - ABS FINANCE - ${updated.name}`,
            },
          });
        }
      }
    }

    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
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
    // Only SUPER_ADMIN can delete customers
    const { session, error } = await requireRole(['SUPER_ADMIN']);
    if (error) return error;

    const { id } = await params;

    const customer = await db.customer.findUnique({ where: { id }, include: { loans: true } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    if (customer.loans.some((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')) {
      return NextResponse.json(
        { error: 'Cannot delete customer with active or overdue loans' },
        { status: 400 }
      );
    }

    await db.customer.delete({ where: { id } });

    // BUG-019 FIX: Audit log for DELETE
    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
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

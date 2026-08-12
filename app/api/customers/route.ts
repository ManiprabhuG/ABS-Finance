import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

// BUG-001 FIX: MAX-based customer ID
async function getNextCustomerId(): Promise<string> {
  const last = await db.customer.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!last) return 'CUST-0001';
  const match = last.customerId.match(/(\d+)$/);
  const lastNum = match ? parseInt(match[1]) : 0;
  return `CUST-${(lastNum + 1).toString().padStart(4, '0')}`;
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    const customers = await db.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { customerId: { contains: query } },
              { mobile: { contains: query } },
              { aadhaar: { contains: query } },
              { pan: { contains: query } },
            ],
          }
        : undefined,
      include: {
        loans: { select: { id: true, loanNumber: true, status: true, principalAmount: true } },
        _count: { select: { collections: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER']);
    if (error) return error;

    const data = await request.json();

    // BUG-005 FIX: Required field validation
    if (!data.name || !data.mobile || !data.aadhaar) {
      return NextResponse.json({ error: 'Name, Mobile, and Aadhaar are required fields' }, { status: 400 });
    }

    // BUG-005 FIX: Format validation
    if (!/^\d{10}$/.test(data.mobile)) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits' }, { status: 400 });
    }
    if (!/^\d{12}$/.test(data.aadhaar)) {
      return NextResponse.json({ error: 'Aadhaar number must be exactly 12 digits' }, { status: 400 });
    }
    if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid PAN format (e.g. ABCDE1234F)' }, { status: 400 });
    }

    // Check duplicate mobile
    const existingMobile = await db.customer.findUnique({ where: { mobile: data.mobile } });
    if (existingMobile) {
      return NextResponse.json({ error: 'A customer with this mobile number already exists' }, { status: 400 });
    }

    const customerId = await getNextCustomerId();

    const customer = await db.customer.create({
      data: {
        customerId,
        name: data.name.trim(),
        mobile: data.mobile,
        aadhaar: data.aadhaar,
        pan: data.pan ? data.pan.toUpperCase() : null,
        address: data.address || '',
        email: data.email || null,
        occupation: data.occupation || null,
        nomineeName: data.nomineeName || null,
        nomineeRelation: data.nomineeRelation || null,
        nomineeMobile: data.nomineeMobile || null,
        remarks: data.remarks || null,
        photoUrl: data.photoUrl || null,
      },
    });

    // Save proof documents if provided
    if (data.proofs && Array.isArray(data.proofs)) {
      for (const proof of data.proofs) {
        if (proof.fileUrl && proof.title) {
          await db.document.create({
            data: {
              title: proof.title,
              category: proof.category || 'OTHER',
              fileUrl: proof.fileUrl,
              customerId: customer.id,
              isEncrypted: true,
              watermarkText: `CONFIDENTIAL - ABS FINANCE - ${customer.name}`,
            },
          });
        }
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'CREATE',
        module: 'CUSTOMER',
        details: `Created Customer ${customer.name} (${customer.customerId})`,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

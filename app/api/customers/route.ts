import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getNextSequenceNumber } from '@/lib/ledger-engine';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
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
        loans: true,
        collections: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.name || !data.mobile || !data.aadhaar) {
      return NextResponse.json({ error: 'Name, Mobile, and Aadhaar are required fields' }, { status: 400 });
    }

    // Check duplicate mobile
    const existing = await db.customer.findUnique({ where: { mobile: data.mobile } });
    if (existing) {
      return NextResponse.json({ error: 'A customer with this mobile number already exists' }, { status: 400 });
    }

    const customerId = await getNextSequenceNumber('CUST', 'customer');

    const customer = await db.customer.create({
      data: {
        customerId,
        name: data.name,
        mobile: data.mobile,
        aadhaar: data.aadhaar,
        pan: data.pan || null,
        address: data.address || '',
        email: data.email || null,
        occupation: data.occupation || null,
        nomineeName: data.nomineeName || null,
        nomineeRelation: data.nomineeRelation || null,
        nomineeMobile: data.nomineeMobile || null,
        remarks: data.remarks || null,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
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

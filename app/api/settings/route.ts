import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

export async function GET() {
  try {
    let settings = await db.systemSettings.findUnique({ where: { id: 'default-settings' } });
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          id: 'default-settings',
          companyName: 'ABS Finance Management Ltd.',
          logoUrl: '/logo.png',
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    if (error) return error;

    const data = await request.json();

    const updated = await db.systemSettings.upsert({
      where: { id: 'default-settings' },
      update: {
        companyName: data.companyName,
        logoUrl: data.logoUrl || '/logo.png',
        address: data.address,
        gstNumber: data.gstNumber,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        loanPrefix: data.loanPrefix,
        receiptPrefix: data.receiptPrefix,
        defaultPenalty: parseFloat(data.defaultPenalty || '2.0'),
        gracePeriodDays: parseInt(data.gracePeriodDays || '5'),
        financialYear: data.financialYear,
        currencySymbol: data.currencySymbol || '₹',
      },
      create: {
        id: 'default-settings',
        companyName: data.companyName || 'ABS Finance Management Ltd.',
        logoUrl: data.logoUrl || '/logo.png',
      },
    });

    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'UPDATE',
        module: 'SETTINGS',
        details: 'Updated System Settings & Company Profile',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

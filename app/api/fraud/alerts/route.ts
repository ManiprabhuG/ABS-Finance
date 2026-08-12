import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scanForFraud } from '@/lib/fraud';

export async function GET() {
  try {
    // Run real-time scan for new fraud anomalies
    await scanForFraud();

    const alerts = await prisma.fraudAlert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { customerId: true, name: true, mobile: true } },
        loan: { select: { loanNumber: true, principalAmount: true, status: true } },
      },
    });

    const openAlerts = alerts.filter((a) => a.status === 'OPEN').length;
    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
    const highAlerts = alerts.filter((a) => a.severity === 'HIGH' && a.status === 'OPEN').length;
    const resolvedAlerts = alerts.filter((a) => a.status === 'RESOLVED').length;

    return NextResponse.json({
      success: true,
      stats: {
        openAlerts,
        criticalAlerts,
        highAlerts,
        resolvedAlerts,
        totalAlerts: alerts.length,
      },
      alerts,
    });
  } catch (error: any) {
    console.error('Fraud Alerts API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) {
      return NextResponse.json({ error: 'alertId and status are required' }, { status: 400 });
    }

    const updated = await prisma.fraudAlert.update({
      where: { id: alertId },
      data: { status },
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error: any) {
    console.error('Fraud Alert PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

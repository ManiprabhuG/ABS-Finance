import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evaluateCustomerRisk } from '@/lib/risk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const result = await evaluateCustomerRisk(customerId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Risk Evaluation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    const safeCustomers = await prisma.customer.count({ where: { riskCategory: 'LOW' } });
    const mediumRisk = await prisma.customer.count({ where: { riskCategory: 'MEDIUM' } });
    const highRisk = await prisma.customer.count({ where: { riskCategory: 'HIGH' } });
    const blacklisted = await prisma.customer.count({ where: { isBlacklisted: true } });

    const recentRiskLogs = await prisma.customerRiskLog.findMany({
      take: 10,
      orderBy: { evaluatedAt: 'desc' },
      include: {
        customer: {
          select: { id: true, customerId: true, name: true, mobile: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        safeCustomers,
        mediumRisk,
        highRisk,
        blacklisted,
      },
      recentLogs: recentRiskLogs,
    });
  } catch (error: any) {
    console.error('Risk Dashboard GET API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

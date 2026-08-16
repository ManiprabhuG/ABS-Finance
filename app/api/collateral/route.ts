import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assetType = searchParams.get('assetType');

    const where: any = {};
    if (status) where.status = status;
    if (assetType) where.assetType = assetType;

    const [items, stats] = await Promise.all([
      db.collateralVault.findMany({
        where,
        include: {
          loan: { select: { loanNumber: true, loanType: true, principalAmount: true, outstandingBalance: true, status: true } },
          customer: { select: { name: true, mobile: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.collateralVault.aggregate({
        _sum: { estimatedValue: true, marketValue: true, grossWeight: true },
        _count: { id: true },
      }),
    ]);

    const activeCount = await db.collateralVault.count({ where: { status: 'IN_VAULT' } });
    const releasedCount = await db.collateralVault.count({ where: { status: 'RELEASED' } });

    return NextResponse.json({
      success: true,
      items,
      stats: {
        totalItems: stats._count.id || 0,
        activeInVault: activeCount,
        releasedCount,
        totalMarketValue: stats._sum.marketValue || 0,
        totalEstimatedValue: stats._sum.estimatedValue || 0,
        totalGoldWeightGrams: stats._sum.grossWeight || 0,
      },
    });
  } catch (err: any) {
    console.error('Error in collateral GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const {
      loanId,
      customerId,
      assetType,
      assetDescription,
      itemCount = 1,
      grossWeight,
      netWeight,
      purityKarat,
      estimatedValue,
      marketValue,
      vaultNumber = 'VAULT-01',
      lockerNumber,
      sealNumber,
      remarks,
    } = body;

    if (!loanId || !assetType || !assetDescription || !marketValue || !lockerNumber) {
      return NextResponse.json({ error: 'Loan ID, Asset Type, Description, Market Value, and Locker Number are required' }, { status: 400 });
    }

    const packetNumber = `PKT-${Date.now().toString().slice(-6)}`;
    const seal = sealNumber || `SEAL-${Date.now().toString().slice(-5)}`;
    const custodian = session.name || 'Senior Vault Custodian';

    const item = await db.collateralVault.create({
      data: {
        loanId,
        customerId: customerId || undefined,
        assetType,
        assetDescription,
        itemCount: Number(itemCount),
        grossWeight: grossWeight ? Number(grossWeight) : null,
        netWeight: netWeight ? Number(netWeight) : null,
        purityKarat: purityKarat || null,
        estimatedValue: Number(estimatedValue || marketValue),
        marketValue: Number(marketValue),
        vaultNumber,
        lockerNumber,
        packetNumber,
        sealNumber: seal,
        custodianName: custodian,
        status: 'IN_VAULT',
        custodyLogs: JSON.stringify([
          {
            timestamp: new Date().toISOString(),
            action: 'INITIAL_DEPOSIT',
            officer: custodian,
            locker: lockerNumber,
            sealNumber: seal,
            note: 'Asset securely deposited into vault safe custody.',
          },
        ]),
        remarks,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Collateral safely deposited in vault',
      item,
    });
  } catch (err: any) {
    console.error('Error in collateral POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { id, status, remarks, actionNote } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Item ID and target status are required' }, { status: 400 });
    }

    const existing = await db.collateralVault.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Collateral item not found' }, { status: 404 });
    }

    let logs: any[] = [];
    try {
      if (existing.custodyLogs) logs = JSON.parse(existing.custodyLogs);
    } catch (e) {}

    logs.push({
      timestamp: new Date().toISOString(),
      action: status,
      officer: session.name || 'Vault Officer',
      note: actionNote || remarks || `Status updated to ${status}`,
    });

    const updated = await db.collateralVault.update({
      where: { id },
      data: {
        status,
        releaseDate: status === 'RELEASED' ? new Date() : existing.releaseDate,
        custodyLogs: JSON.stringify(logs),
        ...(remarks && { remarks }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Collateral status successfully updated to ${status}`,
      item: updated,
    });
  } catch (err: any) {
    console.error('Error in collateral PATCH:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

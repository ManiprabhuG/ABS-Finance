import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loan = await db.loan.findUnique({
      where: { id },
      include: {
        customer: true,
        mortgageDetail: true,
        collections: { orderBy: { collectionDate: 'desc' } },
        ledgerEntries: { orderBy: { date: 'desc' } },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json(loan);
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

    const updated = await db.$transaction(async (tx) => {
      const loan = await tx.loan.update({
        where: { id },
        data: {
          loanType: data.loanType,
          principalAmount: parseFloat(data.principalAmount),
          interestType: data.interestType,
          interestRate: parseFloat(data.interestRate),
          tenureMonths: parseInt(data.tenureMonths || '12'),
          notes: data.notes || null,
          status: data.status || undefined,
        },
      });

      if (data.loanType === 'MORTGAGE' && data.assetValue) {
        const estValue = parseFloat(data.assetValue);
        const mktValue = parseFloat(data.marketValue || data.assetValue);
        const ltv = Number(((parseFloat(data.principalAmount) / estValue) * 100).toFixed(2));

        await tx.mortgageDetail.upsert({
          where: { loanId: id },
          update: {
            assetType: data.assetType,
            assetDescription: data.assetDescription || 'Collateral Asset',
            estimatedValue: estValue,
            marketValue: mktValue,
            ltvPercentage: ltv,
          },
          create: {
            loanId: id,
            assetType: data.assetType,
            assetDescription: data.assetDescription || 'Collateral Asset',
            estimatedValue: estValue,
            marketValue: mktValue,
            ltvPercentage: ltv,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session?.id,
          username: session?.username || 'System',
          action: 'UPDATE',
          module: 'LOAN',
          details: `Updated loan record ${loan.loanNumber}`,
        },
      });

      return loan;
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

    const loan = await db.loan.findUnique({ where: { id } });
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

    await db.loan.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'DELETE',
        module: 'LOAN',
        details: `Deleted loan record ${loan.loanNumber}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

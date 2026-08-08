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
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER']);
    if (error) return error;

    const { id } = await params;
    const data = await request.json();

    // Input validation
    const principal = parseFloat(data.principalAmount);
    const interestRate = parseFloat(data.interestRate);
    if (isNaN(principal) || principal <= 0) {
      return NextResponse.json({ error: 'Principal amount must be a positive number' }, { status: 400 });
    }
    if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
      return NextResponse.json({ error: 'Interest rate must be between 0 and 100' }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const loan = await tx.loan.update({
        where: { id },
        data: {
          loanType: data.loanType,
          principalAmount: principal,
          interestType: data.interestType,
          interestRate,
          tenureMonths: parseInt(data.tenureMonths || '12'),
          notes: data.notes || null,
          status: data.status || undefined,
        },
      });

      if (data.loanType === 'MORTGAGE' && data.assetValue) {
        const estValue = parseFloat(data.assetValue);
        const mktValue = parseFloat(data.marketValue || data.assetValue);
        const ltv = Number(((principal / estValue) * 100).toFixed(2));

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
          userId: session!.id,
          username: session!.username,
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
    // Only SUPER_ADMIN can delete loans
    const { session, error } = await requireRole(['SUPER_ADMIN']);
    if (error) return error;

    const { id } = await params;

    const loan = await db.loan.findUnique({ where: { id } });
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

    // Prevent deletion of active/disbursed loans
    if (['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
      return NextResponse.json(
        { error: `Cannot delete an ${loan.status} loan. Close the loan first.` },
        { status: 400 }
      );
    }

    await db.loan.delete({ where: { id } });

    // BUG-019 FIX: Audit log for DELETE operation
    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'DELETE',
        module: 'LOAN',
        details: `Deleted loan record ${loan.loanNumber} (was ${loan.status})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

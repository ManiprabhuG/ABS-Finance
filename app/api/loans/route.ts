import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

// BUG-001 FIX: Use MAX-based ID to avoid duplicates after deletion
async function getNextLoanNumber(): Promise<string> {
  const lastLoan = await db.loan.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!lastLoan) return 'LN-2026-0001';

  const match = lastLoan.loanNumber.match(/(\d+)$/);
  const lastNum = match ? parseInt(match[1]) : 0;
  return `LN-2026-${(lastNum + 1).toString().padStart(4, '0')}`;
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const loanType = searchParams.get('type');
    const query = searchParams.get('q')?.toLowerCase() || '';

    const loans = await db.loan.findMany({
      where: {
        status: status && status !== 'ALL' ? status : undefined,
        loanType: loanType && loanType !== 'ALL' ? loanType : undefined,
        OR: query
          ? [
              { loanNumber: { contains: query } },
              { customer: { name: { contains: query } } },
              { customer: { mobile: { contains: query } } },
            ]
          : undefined,
      },
      include: {
        customer: true,
        mortgageDetail: true,
        // BUG-016 FIX: Select only needed fields, avoid loading all sub-relations
        _count: { select: { collections: true, ledgerEntries: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Pagination safety limit
    });

    return NextResponse.json(loans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER']);
    if (error) return error;

    const data = await request.json();

    if (!data.customerId || !data.loanType || !data.principalAmount || !data.interestRate) {
      return NextResponse.json(
        { error: 'Customer, Loan Type, Principal Amount, and Interest Rate are required' },
        { status: 400 }
      );
    }

    // Validate numeric inputs
    const principal = parseFloat(data.principalAmount);
    const interestRate = parseFloat(data.interestRate);
    const installmentType = data.installmentType || 'MONTHLY'; // DAILY, WEEKLY, MONTHLY
    const tenureVal = parseInt(data.tenureValue || data.tenureMonths || '12');
    
    // Compute tenureMonths for backwards compatibility
    let tenureMonths = tenureVal;
    if (installmentType === 'DAILY') {
      tenureMonths = Math.max(1, Math.ceil(tenureVal / 30));
    } else if (installmentType === 'WEEKLY') {
      tenureMonths = Math.max(1, Math.ceil(tenureVal / 4.33));
    }

    const totalInterestAmount = data.totalInterestAmount ? parseFloat(data.totalInterestAmount) : null;
    const installmentAmount = data.installmentAmount ? parseFloat(data.installmentAmount) : null;

    if (isNaN(principal) || principal <= 0) {
      return NextResponse.json({ error: 'Principal amount must be a positive number' }, { status: 400 });
    }
    if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
      return NextResponse.json({ error: 'Interest rate must be between 0 and 100' }, { status: 400 });
    }
    if (isNaN(tenureVal) || tenureVal <= 0 || tenureVal > 1000) {
      return NextResponse.json({ error: 'Tenure must be a valid positive number' }, { status: 400 });
    }

    const loanNumber = await getNextLoanNumber();

    const newLoan = await db.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          loanNumber,
          customerId: data.customerId,
          loanType: data.loanType,
          principalAmount: principal,
          interestType: data.interestType || 'FLAT',
          interestRate,
          tenureMonths,
          installmentType,
          tenureValue: tenureVal,
          totalInterestAmount,
          installmentAmount,
          status: 'PENDING',
          outstandingBalance: principal,
          notes: data.notes || null,
        },
      });

      if (data.loanType === 'MORTGAGE' && data.assetType && data.assetValue) {
        const estValue = parseFloat(data.assetValue);
        const mktValue = parseFloat(data.marketValue || data.assetValue);
        if (isNaN(estValue) || estValue <= 0) {
          throw new Error('Asset value must be a positive number');
        }
        const ltv = Number(((principal / estValue) * 100).toFixed(2));

        await tx.mortgageDetail.create({
          data: {
            loanId: loan.id,
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
          action: 'CREATE',
          module: 'LOAN',
          details: `Created ${data.loanType} loan ${loanNumber} of ₹${principal} for customer ID ${data.customerId}`,
        },
      });

      return loan;
    });

    return NextResponse.json(newLoan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

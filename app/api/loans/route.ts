import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getNextSequenceNumber } from '@/lib/ledger-engine';
import { calculateLTVAndSuggestRate } from '@/lib/ltv-calculator';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
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
        collections: { orderBy: { collectionDate: 'desc' } },
        ledgerEntries: { orderBy: { date: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(loans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.customerId || !data.loanType || !data.principalAmount || !data.interestRate) {
      return NextResponse.json(
        { error: 'Customer, Loan Type, Principal Amount, and Interest Rate are required' },
        { status: 400 }
      );
    }

    const principal = parseFloat(data.principalAmount);
    const interestRate = parseFloat(data.interestRate);
    const tenureMonths = parseInt(data.tenureMonths || '12');

    const loanNumber = await getNextSequenceNumber('LN-2026', 'loan');

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
          status: 'PENDING', // Created loans start as PENDING until Disbursed
          outstandingBalance: principal,
          notes: data.notes || null,
        },
      });

      // If Mortgage Loan, create Mortgage Details
      if (data.loanType === 'MORTGAGE' && data.assetType && data.assetValue) {
        const estValue = parseFloat(data.assetValue);
        const mktValue = parseFloat(data.marketValue || data.assetValue);
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
          userId: session?.id,
          username: session?.username || 'System',
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

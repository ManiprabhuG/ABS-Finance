import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordLoanCollection } from '@/lib/ledger-engine';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    const collections = await db.collection.findMany({
      where: query
        ? {
            OR: [
              { collectionId: { contains: query } },
              { customer: { name: { contains: query } } },
              { loan: { loanNumber: { contains: query } } },
            ],
          }
        : undefined,
      include: {
        customer: true,
        loan: true,
        recordedBy: { select: { name: true, username: true } },
      },
      orderBy: { collectionDate: 'desc' },
    });

    return NextResponse.json(collections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.loanId || !data.amountReceived || !data.paymentMode) {
      return NextResponse.json(
        { error: 'Loan, Amount Received, and Payment Mode are required' },
        { status: 400 }
      );
    }

    const collectionRecord = await recordLoanCollection({
      loanId: data.loanId,
      amountReceived: parseFloat(data.amountReceived),
      principalPaid: parseFloat(data.principalPaid || data.amountReceived),
      interestPaid: parseFloat(data.interestPaid || '0'),
      penaltyPaid: parseFloat(data.penaltyPaid || '0'),
      paymentMode: data.paymentMode,
      bankAccountId: data.bankAccountId || undefined,
      referenceNo: data.referenceNo || undefined,
      notes: data.notes || undefined,
      userId: session?.id,
      username: session?.username || 'System',
    });

    return NextResponse.json(collectionRecord);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Collection failed' }, { status: 500 });
  }
}

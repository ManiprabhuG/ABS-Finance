import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q')?.toLowerCase() || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};

    if (type && type !== 'ALL') {
      whereClause.transactionType = type;
    }

    if (query) {
      whereClause.OR = [
        { ledgerId: { contains: query } },
        { referenceNo: { contains: query } },
        { remarks: { contains: query } },
      ];
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const entries = await db.ledgerEntry.findMany({
      where: whereClause,
      include: {
        bankAccount: { select: { bankName: true, accountNumber: true } },
        loan: { select: { loanNumber: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Compute total debit & credit stats
    const totalDebit = entries.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = entries.reduce((sum, item) => sum + item.credit, 0);

    return NextResponse.json({
      entries,
      totalDebit,
      totalCredit,
      netDifference: totalCredit - totalDebit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordIncome } from '@/lib/ledger-engine';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const incomes = await db.income.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(incomes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.category || !data.amount || !data.paymentMode) {
      return NextResponse.json(
        { error: 'Category, Amount, and Payment Mode are required' },
        { status: 400 }
      );
    }

    const income = await recordIncome({
      category: data.category,
      amount: parseFloat(data.amount),
      paymentMode: data.paymentMode,
      bankAccountId: data.bankAccountId,
      referenceNo: data.referenceNo,
      remarks: data.remarks,
      userId: session?.id,
      username: session?.username || 'System',
    });

    return NextResponse.json(income);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

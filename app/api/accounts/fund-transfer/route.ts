import { NextResponse } from 'next/server';
import { recordFundTransfer } from '@/lib/ledger-engine';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.amount || !data.fromAccountType || !data.toAccountType) {
      return NextResponse.json(
        { error: 'Transfer amount, source account, and destination account are required' },
        { status: 400 }
      );
    }

    const transfer = await recordFundTransfer({
      amount: parseFloat(data.amount),
      fromAccountType: data.fromAccountType,
      fromAccountId: data.fromAccountId,
      toAccountType: data.toAccountType,
      toAccountId: data.toAccountId,
      referenceNo: data.referenceNo,
      remarks: data.remarks,
      userId: session?.id,
      username: session?.username || 'System',
    });

    return NextResponse.json(transfer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Fund transfer failed' }, { status: 500 });
  }
}

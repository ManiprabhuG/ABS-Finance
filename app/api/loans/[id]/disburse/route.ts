import { NextResponse } from 'next/server';
import { recordLoanDisbursement } from '@/lib/ledger-engine';
import { getSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const { disbursedFrom, bankAccountId } = await request.json();

    if (!disbursedFrom || (disbursedFrom === 'BANK' && !bankAccountId)) {
      return NextResponse.json(
        { error: 'Please select valid disbursement source (Cash or Bank Account)' },
        { status: 400 }
      );
    }

    const updatedLoan = await recordLoanDisbursement({
      loanId: id,
      disbursedFrom,
      bankAccountId,
      userId: session?.id,
      username: session?.username || 'System',
    });

    return NextResponse.json({ success: true, loan: updatedLoan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Disbursement failed' }, { status: 500 });
  }
}

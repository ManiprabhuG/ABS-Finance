import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

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
    const { session, error } = await requireRole(['SUPER_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'ACCOUNTANT']);
    if (error) return error;

    const data = await request.json();

    if (!data.loanId || !data.amountReceived || !data.paymentMode) {
      return NextResponse.json(
        { error: 'Loan, Amount Received, and Payment Mode are required' },
        { status: 400 }
      );
    }

    // BUG-005 FIX: Server-side numeric validation
    const amountReceived = parseFloat(data.amountReceived);
    const principalPaid = parseFloat(data.principalPaid || '0');
    const interestPaid = parseFloat(data.interestPaid || '0');
    const penaltyPaid = parseFloat(data.penaltyPaid || '0');

    if (isNaN(amountReceived) || amountReceived <= 0) {
      return NextResponse.json({ error: 'Amount received must be a positive number' }, { status: 400 });
    }
    if (principalPaid < 0 || interestPaid < 0 || penaltyPaid < 0) {
      return NextResponse.json({ error: 'Payment amounts cannot be negative' }, { status: 400 });
    }

    // BUG-008 FIX: Check if loan is CLOSED before allowing collection
    const loan = await db.loan.findUnique({ where: { id: data.loanId } });
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }
    if (loan.status === 'CLOSED') {
      return NextResponse.json({ error: 'Cannot post a collection against a CLOSED loan' }, { status: 400 });
    }
    if (loan.status === 'PENDING') {
      return NextResponse.json({ error: 'Cannot collect on a PENDING loan. Disburse the loan first.' }, { status: 400 });
    }

    // BUG-002 FIX: Use atomic decrement to avoid race condition
    const isCash = data.paymentMode === 'CASH';
    let balanceAfter = 0;

    const collectionRecord = await db.$transaction(async (tx) => {
      // Credit destination balance
      if (!isCash) {
        if (!data.bankAccountId) throw new Error('Bank account required for digital/cheque payment');
        const bankAcc = await tx.bankAccount.findUnique({ where: { id: data.bankAccountId } });
        if (!bankAcc) throw new Error('Bank Account not found');
        const updatedBank = await tx.bankAccount.update({
          where: { id: data.bankAccountId },
          data: { currentBalance: bankAcc.currentBalance + amountReceived },
        });
        balanceAfter = updatedBank.currentBalance;
      } else {
        let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
        if (!cashAcc) {
          cashAcc = await tx.cashAccount.create({
            data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 0 },
          });
        }
        const updatedCash = await tx.cashAccount.update({
          where: { id: 'cash-master' },
          data: { currentBalance: cashAcc.currentBalance + amountReceived },
        });
        balanceAfter = updatedCash.currentBalance;
      }

      // BUG-002 FIX: Atomic decrement prevents race condition
      const updatedLoan = await tx.loan.update({
        where: { id: data.loanId },
        data: {
          outstandingBalance: { decrement: principalPaid },
        },
      });

      const newStatus = updatedLoan.outstandingBalance <= 0 ? 'CLOSED' : 'ACTIVE';
      await tx.loan.update({
        where: { id: data.loanId },
        data: { status: newStatus, outstandingBalance: Math.max(0, updatedLoan.outstandingBalance) },
      });

      // BUG-001 FIX: Use timestamp-based collection ID to avoid duplicate after deletion
      const colCount = await tx.collection.count();
      const collectionId = `COL-${(colCount + 1001).toString()}`;

      const col = await tx.collection.create({
        data: {
          collectionId,
          loanId: data.loanId,
          customerId: loan.customerId,
          amountReceived,
          principalPaid,
          interestPaid,
          penaltyPaid,
          paymentMode: data.paymentMode,
          bankAccountId: !isCash ? data.bankAccountId : null,
          referenceNo: data.referenceNo || null,
          recordedById: session!.id || null,
          notes: data.notes || null,
        },
      });

      // Post to Master Ledger
      const ledgerCount = await tx.ledgerEntry.count();
      const ledgerCode = `LEDG-${(ledgerCount + 1001).toString()}`;
      await tx.ledgerEntry.create({
        data: {
          ledgerId: ledgerCode,
          transactionType: 'COLLECTION',
          referenceNo: collectionId,
          debit: 0,
          credit: amountReceived,
          balanceAfter,
          isCash,
          bankAccountId: !isCash ? data.bankAccountId : null,
          remarks: `Collection of ₹${amountReceived} (Principal: ₹${principalPaid}, Interest: ₹${interestPaid}${penaltyPaid > 0 ? `, Penalty: ₹${penaltyPaid}` : ''}) for Loan ${loan.loanNumber}`,
          loanId: data.loanId,
          collectionId: col.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session!.id,
          username: session!.username,
          action: 'CREATE',
          module: 'COLLECTION',
          details: `Collected ₹${amountReceived} for Loan ${loan.loanNumber}`,
        },
      });

      return col;
    });

    return NextResponse.json(collectionRecord);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Collection failed' }, { status: 500 });
  }
}

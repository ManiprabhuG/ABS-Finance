import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const officerId = searchParams.get('officerId');

    const where: any = {};
    if (dateParam) {
      const start = new Date(dateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59, 999);
      where.collectedAt = { gte: start, lte: end };
    }
    if (officerId) where.officerId = officerId;

    const [collections, activeLoans, summary] = await Promise.all([
      db.fieldCollection.findMany({
        where,
        include: {
          customer: { select: { name: true, mobile: true, address: true } },
          loan: { select: { loanNumber: true, loanType: true, outstandingBalance: true } },
        },
        orderBy: { collectedAt: 'desc' },
        take: 100,
      }),
      db.loan.findMany({
        where: {
          status: { in: ['ACTIVE', 'OVERDUE'] },
          outstandingBalance: { gt: 0 },
        },
        include: {
          customer: { select: { id: true, name: true, mobile: true, address: true, riskCategory: true } },
        },
        orderBy: { outstandingBalance: 'desc' },
        take: 50,
      }),
      db.fieldCollection.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where,
      }),
    ]);

    return NextResponse.json({
      success: true,
      collections,
      pendingRouteLoans: activeLoans,
      totalCollected: summary._sum.amount || 0,
      totalVisits: summary._count.id || 0,
    });
  } catch (err: any) {
    console.error('Error in field collections GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const {
      customerId,
      loanId,
      amount,
      paymentMode = 'CASH',
      upiRef,
      latitude,
      longitude,
      locationAddress,
      customerSignature,
      notes,
    } = body;

    if (!customerId || !loanId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Customer ID, Loan ID, and positive amount are required' }, { status: 400 });
    }

    const receiptNo = `FLD-${Date.now().toString().slice(-6)}`;
    const officerName = session.name || session.username || 'Field Collection Officer';

    // 1. Create FieldCollection record
    const fieldEntry = await db.fieldCollection.create({
      data: {
        receiptNo,
        officerId: session.id,
        officerName,
        customerId,
        loanId,
        amount: Number(amount),
        paymentMode,
        upiRef,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        locationAddress: locationAddress || 'GPS Captured On-Field',
        customerSignature,
        notes,
        status: 'SYNCED',
      },
    });

    // 2. Also register in main Collection model for ledger reconciliation
    const mainColId = `COL-${Date.now().toString().slice(-6)}`;
    const loan = await db.loan.findUnique({ where: { id: loanId } });
    if (loan) {
      const interestRatio = (loan.interestRate / 100) / 12;
      const estimatedInterest = Math.min(amount, loan.outstandingBalance * interestRatio);
      const principalPaid = Math.max(0, amount - estimatedInterest);
      const newOutstanding = Math.max(0, loan.outstandingBalance - principalPaid);

      await db.collection.create({
        data: {
          collectionId: mainColId,
          loanId,
          customerId,
          amountReceived: Number(amount),
          principalPaid,
          interestPaid: estimatedInterest,
          paymentMode,
          referenceNo: receiptNo,
          notes: `Field collection by ${officerName}. Lat: ${latitude || 'N/A'}, Lng: ${longitude || 'N/A'}`,
          recordedById: session.id,
        },
      });

      await db.loan.update({
        where: { id: loanId },
        data: {
          outstandingBalance: newOutstanding,
          status: newOutstanding <= 0 ? 'CLOSED' : loan.status,
        },
      });

      // Post to Cash Ledger if CASH
      if (paymentMode === 'CASH') {
        const cashAcc = await db.cashAccount.findUnique({ where: { id: 'cash-master' } });
        if (cashAcc) {
          const newBal = cashAcc.currentBalance + Number(amount);
          await db.cashAccount.update({
            where: { id: 'cash-master' },
            data: { currentBalance: newBal },
          });

          await db.ledgerEntry.create({
            data: {
              ledgerId: `LEDG-${Date.now().toString().slice(-6)}`,
              transactionType: 'COLLECTION',
              isCash: true,
              credit: Number(amount),
              balanceAfter: newBal,
              remarks: `Field Cash Collection [${receiptNo}] by ${officerName}`,
              loanId,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Field collection recorded and synchronized successfully',
      receiptNo,
      entry: fieldEntry,
    });
  } catch (err: any) {
    console.error('Error in field collections POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

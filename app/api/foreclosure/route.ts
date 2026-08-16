import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');

    if (loanId) {
      const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
          customer: true,
          mortgageDetail: true,
          collections: { orderBy: { collectionDate: 'desc' }, take: 5 },
        },
      });

      if (!loan) {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
      }

      // Calculation of settlement figures
      const principalOutstanding = loan.outstandingBalance;
      // Pro-rata interest (approx 1 month interest on outstanding balance)
      const monthlyRate = (loan.interestRate / 100) / 12;
      const proRataInterest = Math.round(principalOutstanding * monthlyRate);
      // Penal charges based on npaDays
      const penalRate = 0.02; // 2%
      const penalCharges = loan.npaDays > 0 ? Math.round(principalOutstanding * penalRate * (loan.npaDays / 30)) : 0;
      // Foreclosure charges (2.5% on principal outstanding)
      const foreclosureFeePercent = 2.5;
      const foreclosureFee = Math.round(principalOutstanding * (foreclosureFeePercent / 100));

      const standardSettlementAmount = principalOutstanding + proRataInterest + penalCharges + foreclosureFee;

      return NextResponse.json({
        success: true,
        loan,
        quotation: {
          principalOutstanding,
          proRataInterest,
          penalCharges,
          foreclosureFee,
          foreclosureFeePercent,
          standardSettlementAmount,
          suggestedMaxWaiver: Math.round(penalCharges + foreclosureFee * 0.5),
        },
      });
    }

    // List all past settlements
    const settlements = await db.loanSettlement.findMany({
      include: {
        customer: { select: { name: true, mobile: true, customerId: true } },
        loan: { select: { loanNumber: true, loanType: true, principalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const activeLoans = await db.loan.findMany({
      where: { status: { in: ['ACTIVE', 'OVERDUE'] }, outstandingBalance: { gt: 0 } },
      include: { customer: { select: { name: true, customerId: true, mobile: true } } },
      orderBy: { outstandingBalance: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      settlements,
      eligibleLoans: activeLoans,
    });
  } catch (err: any) {
    console.error('Error in foreclosure GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const {
      loanId,
      customerId,
      principalOutstanding,
      interestAccrued = 0,
      penalCharges = 0,
      foreclosureFee = 0,
      waiverDiscount = 0,
      finalSettlementAmount,
      paymentMode = 'BANK_TRANSFER',
      bankAccountId,
      referenceNo,
      remarks,
    } = body;

    if (!loanId || !customerId || finalSettlementAmount === undefined) {
      return NextResponse.json({ error: 'Loan ID, Customer ID, and Final Settlement Amount are required' }, { status: 400 });
    }

    const loan = await db.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const settlementNo = `OTS-${Date.now().toString().slice(-6)}`;
    const nocNumber = `NOC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const approver = session.name || session.username || 'Chief Credit Officer';

    // 1. Create LoanSettlement
    const settlement = await db.loanSettlement.create({
      data: {
        settlementNo,
        loanId,
        customerId,
        principalOutstanding: Number(principalOutstanding || loan.outstandingBalance),
        interestAccrued: Number(interestAccrued),
        penalCharges: Number(penalCharges),
        foreclosureFee: Number(foreclosureFee),
        waiverDiscount: Number(waiverDiscount),
        finalSettlementAmount: Number(finalSettlementAmount),
        paymentMode,
        bankAccountId: bankAccountId || undefined,
        referenceNo: referenceNo || settlementNo,
        nocNumber,
        nocIssuedDate: new Date(),
        status: 'COMPLETED',
        approvedBy: approver,
        remarks: remarks || `Full & Final OTS Foreclosure approved with waiver ₹${waiverDiscount}`,
      },
    });

    // 2. Mark Loan as CLOSED with 0 balance
    await db.loan.update({
      where: { id: loanId },
      data: {
        outstandingBalance: 0,
        status: 'CLOSED',
        notes: `Foreclosed via OTS ${settlementNo} on ${new Date().toLocaleDateString()}. NOC: ${nocNumber}`,
      },
    });

    // 3. Create Collection Entry for the settlement payment
    const colId = `COL-OTS-${Date.now().toString().slice(-5)}`;
    await db.collection.create({
      data: {
        collectionId: colId,
        loanId,
        customerId,
        amountReceived: Number(finalSettlementAmount),
        principalPaid: Number(principalOutstanding || loan.outstandingBalance) - Number(waiverDiscount),
        interestPaid: Number(interestAccrued),
        penaltyPaid: Math.max(0, Number(penalCharges) - Number(waiverDiscount)),
        paymentMode,
        bankAccountId: bankAccountId || undefined,
        referenceNo: settlementNo,
        notes: `OTS Foreclosure Settlement [${settlementNo}]. NOC Issued: ${nocNumber}`,
        recordedById: session.id,
      },
    });

    // 4. Update Cash or Bank ledger
    if (paymentMode === 'CASH') {
      const cashAcc = await db.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (cashAcc) {
        const newBal = cashAcc.currentBalance + Number(finalSettlementAmount);
        await db.cashAccount.update({
          where: { id: 'cash-master' },
          data: { currentBalance: newBal },
        });

        await db.ledgerEntry.create({
          data: {
            ledgerId: `LEDG-${Date.now().toString().slice(-6)}`,
            transactionType: 'COLLECTION',
            isCash: true,
            credit: Number(finalSettlementAmount),
            balanceAfter: newBal,
            remarks: `OTS Foreclosure Full Payment [${settlementNo}] - Loan ${loan.loanNumber}`,
            loanId,
          },
        });
      }
    } else if (bankAccountId) {
      const bank = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (bank) {
        const newBal = bank.currentBalance + Number(finalSettlementAmount);
        await db.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: newBal },
        });

        await db.ledgerEntry.create({
          data: {
            ledgerId: `LEDG-${Date.now().toString().slice(-6)}`,
            transactionType: 'COLLECTION',
            bankAccountId,
            credit: Number(finalSettlementAmount),
            balanceAfter: newBal,
            remarks: `OTS Foreclosure Bank Credit [${settlementNo}] - Loan ${loan.loanNumber}`,
            loanId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Loan successfully foreclosed and NOC issued',
      settlement,
      nocNumber,
    });
  } catch (err: any) {
    console.error('Error in foreclosure POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

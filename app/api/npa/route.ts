import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evaluateNPAPortfolio } from '@/lib/npa';

export async function GET() {
  try {
    const summary = await evaluateNPAPortfolio();

    const npaLoans = await prisma.loan.findMany({
      where: {
        npaCategory: { in: ['SUBSTANDARD', 'DOUBTFUL', 'NPA'] },
      },
      include: {
        customer: true,
        npaRecoveries: { orderBy: { actionDate: 'desc' } },
        legalCases: true,
      },
      orderBy: { npaDays: 'desc' },
    });

    const legalCases = await prisma.legalCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          include: { customer: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      summary,
      npaLoans,
      legalCases,
    });
  } catch (error: any) {
    console.error('NPA API GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'RECOVERY') {
      const { loanId, actionType, officerName, notes, nextFollowUp, npaCategory, daysOverdue } = body;

      const recovery = await prisma.nPARecovery.create({
        data: {
          loanId,
          npaCategory: npaCategory || 'SUBSTANDARD',
          daysOverdue: daysOverdue || 30,
          actionType: actionType || 'CALL',
          officerName: officerName || 'System Officer',
          notes,
          nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        },
      });

      return NextResponse.json({ success: true, data: recovery });
    } else if (type === 'LEGAL') {
      const { loanId, caseNumber, courtName, advocate, filingDate, hearingDate, claimAmount, remarks } = body;

      const legalCase = await prisma.legalCase.create({
        data: {
          loanId,
          caseNumber: caseNumber || `LC-${Date.now()}`,
          courtName: courtName || 'District Court',
          advocate: advocate || 'Legal Counsel',
          filingDate: filingDate ? new Date(filingDate) : new Date(),
          hearingDate: hearingDate ? new Date(hearingDate) : null,
          claimAmount: parseFloat(claimAmount) || 0,
          remarks,
        },
      });

      return NextResponse.json({ success: true, data: legalCase });
    } else {
      return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('NPA API POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

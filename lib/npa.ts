import { prisma } from './db';

export interface NPAReportSummary {
  totalActiveLoans: number;
  totalOutstandingBalance: number;
  standardPortfolio: { count: number; balance: number; provision: number };
  substandardPortfolio: { count: number; balance: number; provision: number };
  doubtfulPortfolio: { count: number; balance: number; provision: number };
  npaPortfolio: { count: number; balance: number; provision: number };
  grossNPAPercentage: number;
}

/**
 * Evaluates active loans, calculates overdue aging days, updates NPA categories,
 * and computes regulatory loss provisioning.
 */
export async function evaluateNPAPortfolio(): Promise<NPAReportSummary> {
  const activeLoans = await prisma.loan.findMany({
    where: {
      status: { in: ['ACTIVE', 'DISBURSED', 'OVERDUE'] },
    },
    include: {
      customer: true,
      collections: {
        orderBy: { collectionDate: 'desc' },
        take: 1,
      },
    },
  });

  const now = new Date();
  let totalOutstanding = 0;

  const summary = {
    totalActiveLoans: activeLoans.length,
    totalOutstandingBalance: 0,
    standardPortfolio: { count: 0, balance: 0, provision: 0 },
    substandardPortfolio: { count: 0, balance: 0, provision: 0 },
    doubtfulPortfolio: { count: 0, balance: 0, provision: 0 },
    npaPortfolio: { count: 0, balance: 0, provision: 0 },
    grossNPAPercentage: 0,
  };

  for (const loan of activeLoans) {
    totalOutstanding += loan.outstandingBalance;

    // Calculate days overdue based on loan creation/last payment date vs expected 30-day EMI cycle
    let lastPaymentDate = loan.loanDate;
    if (loan.collections.length > 0) {
      lastPaymentDate = loan.collections[0].collectionDate;
    }

    const diffDays = Math.floor(
      (now.getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24)
    );
    const overdueDays = Math.max(0, diffDays - 30); // 30-day grace/cycle allowance

    let category: 'STANDARD' | 'SUBSTANDARD' | 'DOUBTFUL' | 'NPA' = 'STANDARD';
    let provisionRate = 0.004; // 0.4% default standard provision

    if (overdueDays > 180) {
      category = 'NPA';
      provisionRate = 1.0; // 100% loss provision
      summary.npaPortfolio.count++;
      summary.npaPortfolio.balance += loan.outstandingBalance;
      summary.npaPortfolio.provision += loan.outstandingBalance * provisionRate;
    } else if (overdueDays > 90) {
      category = 'DOUBTFUL';
      provisionRate = 0.3; // 30% provision
      summary.doubtfulPortfolio.count++;
      summary.doubtfulPortfolio.balance += loan.outstandingBalance;
      summary.doubtfulPortfolio.provision += loan.outstandingBalance * provisionRate;
    } else if (overdueDays > 30) {
      category = 'SUBSTANDARD';
      provisionRate = 0.15; // 15% provision
      summary.substandardPortfolio.count++;
      summary.substandardPortfolio.balance += loan.outstandingBalance;
      summary.substandardPortfolio.provision += loan.outstandingBalance * provisionRate;
    } else {
      category = 'STANDARD';
      provisionRate = 0.004;
      summary.standardPortfolio.count++;
      summary.standardPortfolio.balance += loan.outstandingBalance;
      summary.standardPortfolio.provision += loan.outstandingBalance * provisionRate;
    }

    // Update loan model with NPA category and calculated overdue days
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        npaCategory: category,
        npaDays: overdueDays,
        status: overdueDays > 0 ? 'OVERDUE' : loan.status,
      },
    });
  }

  summary.totalOutstandingBalance = totalOutstanding;
  const npaTotalBalance = summary.doubtfulPortfolio.balance + summary.npaPortfolio.balance;
  summary.grossNPAPercentage = totalOutstanding > 0 ? (npaTotalBalance / totalOutstanding) * 100 : 0;

  return summary;
}

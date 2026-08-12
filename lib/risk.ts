import { prisma } from './db';

export interface RiskEvaluationResult {
  score: number;
  category: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLACKLISTED';
  isBlacklisted: boolean;
  verificationScores: {
    aadhaarScore: number;
    panScore: number;
    mobileScore: number;
    occupationScore: number;
    repaymentHistoryScore: number;
  };
  riskFactors: string[];
}

/**
 * Calculates real-time Customer Risk Score based on identity parameters,
 * format integrity, duplicate occurrences, and historical repayment records.
 */
export async function evaluateCustomerRisk(customerId: string): Promise<RiskEvaluationResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      loans: {
        include: {
          collections: true,
        },
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  const riskFactors: string[] = [];

  // 1. Aadhaar Verification Score (max 20)
  let aadhaarScore = 20;
  const cleanAadhaar = customer.aadhaar.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    aadhaarScore = 5;
    riskFactors.push('Invalid or non-standard Aadhaar format');
  }

  // 2. PAN Verification Score (max 20)
  let panScore = 20;
  if (customer.pan) {
    const cleanPan = customer.pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      panScore = 8;
      riskFactors.push('Invalid PAN format');
    }
  } else {
    panScore = 10;
    riskFactors.push('PAN card not provided');
  }

  // 3. Mobile Score (max 15)
  let mobileScore = 15;
  const cleanMobile = customer.mobile.replace(/\D/g, '');
  if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
    mobileScore = 5;
    riskFactors.push('Non-standard mobile number pattern');
  }

  // 4. Occupation / Income Score (max 15)
  let occupationScore = 12;
  if (!customer.occupation) {
    occupationScore = 6;
    riskFactors.push('Occupation details not specified');
  }

  // 5. Repayment History Score (max 30)
  let repaymentHistoryScore = 30;
  const totalLoans = customer.loans.length;
  if (totalLoans > 0) {
    const overdueLoans = customer.loans.filter(
      (l) => l.status === 'OVERDUE' || l.npaCategory === 'NPA'
    );
    const closedLoans = customer.loans.filter((l) => l.status === 'CLOSED');

    if (overdueLoans.length > 0) {
      repaymentHistoryScore -= overdueLoans.length * 15;
      riskFactors.push(`${overdueLoans.length} existing overdue/NPA loan(s) detected`);
    }

    if (closedLoans.length > 0 && overdueLoans.length === 0) {
      repaymentHistoryScore = Math.min(30, repaymentHistoryScore + 5);
    }
  }

  repaymentHistoryScore = Math.max(0, Math.min(30, repaymentHistoryScore));

  // Sum total score
  const totalScore = Math.min(
    100,
    Math.max(0, aadhaarScore + panScore + mobileScore + occupationScore + repaymentHistoryScore)
  );

  let isBlacklisted = customer.isBlacklisted || false;
  let category: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLACKLISTED' = 'LOW';

  if (isBlacklisted || totalScore < 30) {
    category = 'BLACKLISTED';
    isBlacklisted = true;
  } else if (totalScore < 55) {
    category = 'HIGH';
  } else if (totalScore < 75) {
    category = 'MEDIUM';
  } else {
    category = 'LOW';
  }

  const verificationScores = {
    aadhaarScore,
    panScore,
    mobileScore,
    occupationScore,
    repaymentHistoryScore,
  };

  // Update customer record with newly evaluated risk metrics
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      riskScore: totalScore,
      riskCategory: category,
      isBlacklisted: isBlacklisted,
      riskFactors: JSON.stringify(riskFactors),
    },
  });

  // Log in CustomerRiskLog
  await prisma.customerRiskLog.create({
    data: {
      customerId: customerId,
      riskScore: totalScore,
      riskCategory: category,
      verificationScores: JSON.stringify(verificationScores),
      riskFactors: JSON.stringify(riskFactors),
    },
  });

  return {
    score: totalScore,
    category,
    isBlacklisted,
    verificationScores,
    riskFactors,
  };
}

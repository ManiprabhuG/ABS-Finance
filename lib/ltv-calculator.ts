import { db } from './db';

export interface LTVRecommendation {
  ltvPercentage: number;
  suggestedInterestRate: number;
  matchedSlabName: string;
}

export async function calculateLTVAndSuggestRate(
  principalAmount: number,
  assetValue: number
): Promise<LTVRecommendation> {
  if (!assetValue || assetValue <= 0) {
    return {
      ltvPercentage: 0,
      suggestedInterestRate: 12.0,
      matchedSlabName: 'Default Standard Rate',
    };
  }

  const ltvPercentage = Number(((principalAmount / assetValue) * 100).toFixed(2));

  // Query LTV slabs from DB
  const ltvSlabs = await db.lTVInterestSlab.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { minLtv: 'asc' },
  });

  if (ltvSlabs.length === 0) {
    // Fallback default rules if DB slabs empty
    let rate = 12.0;
    let slab = 'Standard 12%';
    if (ltvPercentage <= 40) {
      rate = 10.0;
      slab = 'Low LTV (0-40%)';
    } else if (ltvPercentage <= 60) {
      rate = 12.0;
      slab = 'Medium LTV (41-60%)';
    } else if (ltvPercentage <= 80) {
      rate = 15.0;
      slab = 'High LTV (61-80%)';
    } else {
      rate = 18.0;
      slab = 'Very High LTV (>80%)';
    }

    return {
      ltvPercentage,
      suggestedInterestRate: rate,
      matchedSlabName: slab,
    };
  }

  const matched = ltvSlabs.find(
    (s) => ltvPercentage >= s.minLtv && ltvPercentage <= s.maxLtv
  );

  if (matched) {
    return {
      ltvPercentage,
      suggestedInterestRate: matched.interestRate,
      matchedSlabName: `LTV Slab: ${matched.ltvRange} @ ${matched.interestRate}%`,
    };
  }

  // If higher than max slab
  const highestSlab = ltvSlabs[ltvSlabs.length - 1];
  return {
    ltvPercentage,
    suggestedInterestRate: highestSlab ? highestSlab.interestRate + 2 : 18.0,
    matchedSlabName: `Custom High LTV (> ${highestSlab ? highestSlab.maxLtv : 80}%)`,
  };
}

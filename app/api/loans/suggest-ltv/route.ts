import { NextResponse } from 'next/server';
import { calculateLTVAndSuggestRate } from '@/lib/ltv-calculator';

export async function POST(request: Request) {
  try {
    const { principalAmount, assetValue } = await request.json();
    const principal = parseFloat(principalAmount || '0');
    const asset = parseFloat(assetValue || '0');

    const result = await calculateLTVAndSuggestRate(principal, asset);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

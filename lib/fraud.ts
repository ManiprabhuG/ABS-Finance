import { prisma } from './db';

export interface FraudScanSummary {
  alertsCreated: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
}

/**
 * Scans the database for anomalies, duplicate identities, abnormal collections,
 * and high-risk lending patterns, generating structured FraudAlert entries.
 */
export async function scanForFraud(): Promise<FraudScanSummary> {
  let alertsCreated = 0;
  let criticalAlerts = 0;
  let highAlerts = 0;
  let mediumAlerts = 0;
  let lowAlerts = 0;

  // 1. Scan for Duplicate PAN numbers
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, pan: true, mobile: true, aadhaar: true },
  });

  const panMap = new Map<string, Array<{ id: string; name: string }>>();
  const mobileMap = new Map<string, Array<{ id: string; name: string }>>();

  for (const c of customers) {
    if (c.pan) {
      const p = c.pan.trim().toUpperCase();
      if (!panMap.has(p)) panMap.set(p, []);
      panMap.get(p)!.push({ id: c.id, name: c.name });
    }
    if (c.mobile) {
      const m = c.mobile.trim();
      if (!mobileMap.has(m)) mobileMap.set(m, []);
      mobileMap.get(m)!.push({ id: c.id, name: c.name });
    }
  }

  // Generate alert for Duplicate PAN
  for (const [pan, users] of panMap.entries()) {
    if (users.length > 1) {
      const existing = await prisma.fraudAlert.findFirst({
        where: {
          type: 'DUPLICATE_IDENTIFIER',
          details: { contains: pan },
        },
      });

      if (!existing) {
        await prisma.fraudAlert.create({
          data: {
            type: 'DUPLICATE_IDENTIFIER',
            severity: 'CRITICAL',
            customerId: users[0].id,
            details: `Duplicate PAN Card [${pan}] detected across ${users.length} customer profiles: ${users.map((u) => u.name).join(', ')}`,
            status: 'OPEN',
          },
        });
        alertsCreated++;
        criticalAlerts++;
      }
    }
  }

  // 2. Scan for Duplicate Mobile Numbers
  for (const [mobile, users] of mobileMap.entries()) {
    if (users.length > 1) {
      const existing = await prisma.fraudAlert.findFirst({
        where: {
          type: 'DUPLICATE_IDENTIFIER',
          details: { contains: mobile },
        },
      });

      if (!existing) {
        await prisma.fraudAlert.create({
          data: {
            type: 'DUPLICATE_IDENTIFIER',
            severity: 'HIGH',
            customerId: users[0].id,
            details: `Duplicate Mobile Number [${mobile}] registered under multiple profiles: ${users.map((u) => u.name).join(', ')}`,
            status: 'OPEN',
          },
        });
        alertsCreated++;
        highAlerts++;
      }
    }
  }

  // 3. Scan for Abnormal Single Collections (e.g. > 500,000 INR)
  const abnormalCollections = await prisma.collection.findMany({
    where: {
      amountReceived: { gte: 500000 },
    },
    include: { customer: true, loan: true },
  });

  for (const col of abnormalCollections) {
    const existing = await prisma.fraudAlert.findFirst({
      where: {
        type: 'ABNORMAL_COLLECTION',
        details: { contains: col.collectionId },
      },
    });

    if (!existing) {
      await prisma.fraudAlert.create({
        data: {
          type: 'ABNORMAL_COLLECTION',
          severity: 'HIGH',
          customerId: col.customerId,
          loanId: col.loanId,
          details: `Abnormal collection spike of ₹${col.amountReceived.toLocaleString()} recorded for Receipt ${col.collectionId} (${col.customer.name}). Requires manager sign-off.`,
          status: 'OPEN',
        },
      });
      alertsCreated++;
      highAlerts++;
    }
  }

  return {
    alertsCreated,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
  };
}

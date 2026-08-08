import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TiDB database with realistic enterprise data...');

  // 1. System Settings
  await prisma.systemSettings.upsert({
    where: { id: 'default-settings' },
    update: {
      companyName: 'ABS Finance Management Ltd.',
      address: 'Suite 401, Financial Tower, Bandra Kurla Complex, Mumbai 400051',
      gstNumber: '27AAACA1234B1Z9',
      contactPhone: '+91 98765 43210',
      contactEmail: 'contact@absfinance.com',
      loanPrefix: 'LN-2026',
      receiptPrefix: 'REC-2026',
      defaultPenalty: 2.0,
      gracePeriodDays: 5,
      financialYear: '2026-2027',
      currencySymbol: '₹',
    },
    create: {
      id: 'default-settings',
      companyName: 'ABS Finance Management Ltd.',
      address: 'Suite 401, Financial Tower, Bandra Kurla Complex, Mumbai 400051',
      gstNumber: '27AAACA1234B1Z9',
      contactPhone: '+91 98765 43210',
      contactEmail: 'contact@absfinance.com',
      loanPrefix: 'LN-2026',
      receiptPrefix: 'REC-2026',
      defaultPenalty: 2.0,
      gracePeriodDays: 5,
      financialYear: '2026-2027',
      currencySymbol: '₹',
    },
  });

  // 2. Users
  const pwdHash = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: pwdHash,
      name: 'Super Admin',
      email: 'admin@absfinance.com',
      role: 'SUPER_ADMIN',
      branch: 'Main Mumbai HQ',
    },
  });

  await prisma.user.upsert({
    where: { username: 'accountant' },
    update: {},
    create: {
      username: 'accountant',
      passwordHash: pwdHash,
      name: 'Suresh Iyer',
      email: 'suresh.accountant@absfinance.com',
      role: 'ACCOUNTANT',
      branch: 'Main Mumbai HQ',
    },
  });

  await prisma.user.upsert({
    where: { username: 'collector' },
    update: {},
    create: {
      username: 'collector',
      passwordHash: pwdHash,
      name: 'Ramesh Pawar',
      email: 'ramesh.collector@absfinance.com',
      role: 'COLLECTION_OFFICER',
      branch: 'Andheri West Branch',
    },
  });

  await prisma.user.upsert({
    where: { username: 'officer_rahul' },
    update: {},
    create: {
      username: 'officer_rahul',
      passwordHash: pwdHash,
      name: 'Rahul Mehta',
      email: 'rahul.mehta@absfinance.com',
      role: 'LOAN_OFFICER',
      branch: 'Bandra BKC Branch',
    },
  });

  // 3. LTV Interest Slabs (Mortgage Collateral Risk Engine)
  await prisma.lTVInterestSlab.deleteMany({});
  await prisma.lTVInterestSlab.createMany({
    data: [
      { ltvRange: '0% - 40% (Low Risk)', minLtv: 0, maxLtv: 40, interestRate: 10.5, status: 'ACTIVE' },
      { ltvRange: '40% - 60% (Moderate Risk)', minLtv: 40, maxLtv: 60, interestRate: 12.0, status: 'ACTIVE' },
      { ltvRange: '60% - 80% (High Risk)', minLtv: 60, maxLtv: 80, interestRate: 14.5, status: 'ACTIVE' },
      { ltvRange: '> 80% (Extreme Risk)', minLtv: 80, maxLtv: 100, interestRate: 18.0, status: 'ACTIVE' },
    ],
  });

  // 4. Amount Interest Slabs
  await prisma.interestSlab.deleteMany({});
  await prisma.interestSlab.createMany({
    data: [
      { name: 'Micro Business Loan (₹10k - ₹1 Lakh)', fromAmount: 10000, toAmount: 100000, interestRate: 14.0, status: 'ACTIVE' },
      { name: 'Small Business Loan (₹1 Lakh - ₹5 Lakhs)', fromAmount: 100001, toAmount: 500000, interestRate: 12.5, status: 'ACTIVE' },
      { name: 'Commercial Loan (₹5 Lakhs - ₹25 Lakhs)', fromAmount: 500001, toAmount: 2500000, interestRate: 11.0, status: 'ACTIVE' },
      { name: 'Enterprise Loan (> ₹25 Lakhs)', fromAmount: 2500001, toAmount: 10000000, interestRate: 9.5, status: 'ACTIVE' },
    ],
  });

  // 5. Bank & Cash Accounts
  const hdfcBank = await prisma.bankAccount.upsert({
    where: { accountNumber: '50200012345678' },
    update: { currentBalance: 4250000 },
    create: {
      accountName: 'ABS Finance Main Operating A/C',
      accountNumber: '50200012345678',
      bankName: 'HDFC Bank',
      branch: 'BKC Branch, Mumbai',
      ifsc: 'HDFC0000240',
      openingBalance: 5000000,
      currentBalance: 4250000,
      status: 'ACTIVE',
    },
  });

  const iciciBank = await prisma.bankAccount.upsert({
    where: { accountNumber: '000405012999' },
    update: { currentBalance: 2800000 },
    create: {
      accountName: 'ABS Finance Disbursement A/C',
      accountNumber: '000405012999',
      bankName: 'ICICI Bank',
      branch: 'Nariman Point, Mumbai',
      ifsc: 'ICIC0000004',
      openingBalance: 3000000,
      currentBalance: 2800000,
      status: 'ACTIVE',
    },
  });

  await prisma.cashAccount.upsert({
    where: { id: 'cash-master' },
    update: { currentBalance: 550000 },
    create: {
      id: 'cash-master',
      name: 'Central Cash Register',
      currentBalance: 550000,
    },
  });

  // 6. Customers
  await prisma.customer.deleteMany({});

  const cust1 = await prisma.customer.create({
    data: {
      customerId: 'CUST-1001',
      name: 'Rajesh Kumar',
      mobile: '+91 98200 11223',
      aadhaar: '4532 8901 2345',
      pan: 'ABCDE1234F',
      address: 'Flat 302, Sunrise Apartments, Andheri West, Mumbai',
      occupation: 'Retail Textile Business Owner',
      nomineeName: 'Sunita Kumar',
      nomineeRelation: 'Wife',
      nomineeMobile: '+91 98200 11224',
      remarks: 'Existing reliable client, 3 previous closed loans',
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      customerId: 'CUST-1002',
      name: 'Priya Sharma',
      mobile: '+91 98700 33445',
      aadhaar: '8901 2345 6789',
      pan: 'PQRSW5678K',
      address: 'Plot 45, Sector 17, Vashi, Navi Mumbai',
      occupation: 'Senior Software Architect',
      nomineeName: 'Amit Sharma',
      nomineeRelation: 'Husband',
      nomineeMobile: '+91 98700 33446',
      remarks: 'Pledged Gold Ornaments as collateral',
    },
  });

  const cust3 = await prisma.customer.create({
    data: {
      customerId: 'CUST-1003',
      name: 'Ankit Patel',
      mobile: '+91 99300 55667',
      aadhaar: '1234 5678 9012',
      pan: 'LMNOP9012M',
      address: 'Shop 12, GIDC Commercial Hub, Bhiwandi, Thane',
      occupation: 'Logistics & Fleet Operator',
      nomineeName: 'Meena Patel',
      nomineeRelation: 'Mother',
      nomineeMobile: '+91 99300 55668',
      remarks: 'Commercial Eicher Truck mortgaged',
    },
  });

  const cust4 = await prisma.customer.create({
    data: {
      customerId: 'CUST-1004',
      name: 'Sunita Verma',
      mobile: '+91 97100 77889',
      aadhaar: '6789 0123 4567',
      pan: 'JKLM7890N',
      address: 'Villa 8, Green Meadows, Chembur, Mumbai',
      occupation: 'Healthcare Entrepreneur',
      nomineeName: 'Dr. Ramesh Verma',
      nomineeRelation: 'Husband',
      nomineeMobile: '+91 97100 77890',
      remarks: 'Residential Villa property document mortgaged',
    },
  });

  // 7. Loans & Mortgages
  await prisma.loan.deleteMany({});

  const loan1 = await prisma.loan.create({
    data: {
      loanNumber: 'LN-2026-001',
      customerId: cust1.id,
      loanType: 'MORTGAGE',
      principalAmount: 1500000,
      interestType: 'FLAT',
      interestRate: 12.0,
      tenureMonths: 24,
      status: 'ACTIVE',
      outstandingBalance: 1250000,
      disbursedFrom: 'BANK',
      bankAccountId: hdfcBank.id,
      notes: 'Commercial Shop Premises Mortgaged in Andheri Market.',
      mortgageDetail: {
        create: {
          assetType: 'PROPERTY',
          assetDescription: 'Commercial Shop No. 5 (350 sq ft) in Andheri Market Complex',
          estimatedValue: 3000000,
          marketValue: 3200000,
          ltvPercentage: 50.0,
        },
      },
    },
  });

  const loan2 = await prisma.loan.create({
    data: {
      loanNumber: 'LN-2026-002',
      customerId: cust2.id,
      loanType: 'MORTGAGE',
      principalAmount: 500000,
      interestType: 'REDUCING',
      interestRate: 10.5,
      tenureMonths: 12,
      status: 'ACTIVE',
      outstandingBalance: 410000,
      disbursedFrom: 'BANK',
      bankAccountId: iciciBank.id,
      notes: 'Gold Ornaments (22K 180 grams) sealed in Branch Safe vault.',
      mortgageDetail: {
        create: {
          assetType: 'GOLD',
          assetDescription: '22 Karat Gold Ornaments (Necklace set & bangles) total 180 grams',
          estimatedValue: 1200000,
          marketValue: 1250000,
          ltvPercentage: 41.6,
        },
      },
    },
  });

  const loan3 = await prisma.loan.create({
    data: {
      loanNumber: 'LN-2026-003',
      customerId: cust3.id,
      loanType: 'MORTGAGE',
      principalAmount: 800000,
      interestType: 'FLAT',
      interestRate: 14.5,
      tenureMonths: 18,
      status: 'OVERDUE',
      outstandingBalance: 720000,
      disbursedFrom: 'CASH',
      notes: 'Commercial Eicher Pro 2049 Heavy Vehicle mortgaged.',
      mortgageDetail: {
        create: {
          assetType: 'VEHICLE',
          assetDescription: 'Eicher Pro 2049 Commercial Goods Carrier (Reg: MH-04-HX-4521)',
          estimatedValue: 1100000,
          marketValue: 1150000,
          ltvPercentage: 72.7,
        },
      },
    },
  });

  // 8. Collections
  await prisma.collection.deleteMany({});

  await prisma.collection.create({
    data: {
      collectionId: 'REC-2026-101',
      loanId: loan1.id,
      customerId: cust1.id,
      amountReceived: 125000,
      principalPaid: 100000,
      interestPaid: 25000,
      penaltyPaid: 0,
      paymentMode: 'BANK_TRANSFER',
      bankAccountId: hdfcBank.id,
      referenceNo: 'HDFC-NEFT-991204',
      recordedById: superAdmin.id,
      notes: 'Installment #1 paid on time via NEFT.',
    },
  });

  await prisma.collection.create({
    data: {
      collectionId: 'REC-2026-102',
      loanId: loan2.id,
      customerId: cust2.id,
      amountReceived: 45000,
      principalPaid: 40000,
      interestPaid: 5000,
      penaltyPaid: 0,
      paymentMode: 'UPI',
      bankAccountId: iciciBank.id,
      referenceNo: 'UPI/6129881023',
      recordedById: superAdmin.id,
      notes: 'EMI #1 cleared via GPay UPI.',
    },
  });

  // 9. Master Ledger Entries
  await prisma.ledgerEntry.deleteMany({});

  await prisma.ledgerEntry.create({
    data: {
      ledgerId: 'LEDG-10001',
      transactionType: 'DISBURSEMENT',
      referenceNo: 'LN-2026-001',
      debit: 1500000,
      credit: 0,
      balanceAfter: 3500000,
      bankAccountId: hdfcBank.id,
      isCash: false,
      remarks: 'Loan Disbursement for LN-2026-001 to Rajesh Kumar via HDFC Bank',
      loanId: loan1.id,
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      ledgerId: 'LEDG-10002',
      transactionType: 'COLLECTION',
      referenceNo: 'REC-2026-101',
      debit: 0,
      credit: 125000,
      balanceAfter: 3625000,
      bankAccountId: hdfcBank.id,
      isCash: false,
      remarks: 'Collection received for LN-2026-001 from Rajesh Kumar',
      loanId: loan1.id,
    },
  });

  // 10. Incomes & Expenses
  await prisma.income.deleteMany({});
  await prisma.income.create({
    data: {
      incomeNo: 'INC-1001',
      category: 'PROCESSING_FEE',
      amount: 15000,
      paymentMode: 'BANK_TRANSFER',
      bankAccountId: hdfcBank.id,
      isCash: false,
      referenceNo: 'FEE-99102',
      remarks: 'Loan processing fee collected for LN-2026-001',
    },
  });

  await prisma.expense.deleteMany({});
  await prisma.expense.create({
    data: {
      expenseNo: 'EXP-1001',
      category: 'OFFICE_RENT',
      amount: 45000,
      paymentMode: 'BANK_TRANSFER',
      bankAccountId: hdfcBank.id,
      isCash: false,
      referenceNo: 'RENT-AUG-2026',
      remarks: 'Monthly office rent payment for BKC Branch',
    },
  });

  // 11. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      username: 'admin',
      action: 'SEED_INITIALIZATION',
      module: 'SYSTEM',
      details: 'Populated TiDB Database with initial enterprise settings, customers, slabs, loans, and accounting records.',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ TiDB Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

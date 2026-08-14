import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration driven by environment variables with dynamic fallbacks
const SEED_CONFIG = {
  customerCount: Number(process.env.SEED_CUSTOMER_COUNT) || 10,
  loanCount: Number(process.env.SEED_LOAN_COUNT) || 15,
  companyName: process.env.COMPANY_NAME || 'ABS Finance Management Ltd.',
  companyAddress: process.env.COMPANY_ADDRESS || 'Suite 401, Financial Tower, BKC, Mumbai 400051',
  gstNumber: process.env.COMPANY_GST || '27AAACA1234B1Z9',
  contactPhone: process.env.COMPANY_PHONE || '+91 98765 43210',
  contactEmail: process.env.COMPANY_EMAIL || 'contact@absfinance.com',
  loanPrefix: process.env.LOAN_PREFIX || 'LN-2026',
  receiptPrefix: process.env.RECEIPT_PREFIX || 'REC-2026',
};

// Helper Random Data Generators
const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Ankit', 'Sunita', 'Vikram', 'Ananya', 'Ramesh', 'Kavita',
  'Rahul', 'Deepa', 'Suresh', 'Meera', 'Arjun', 'Neha', 'Karthik', 'Lakshmi',
  'Amit', 'Pooja', 'Sanjay', 'Ritu', 'Manish', 'Shweta', 'Vijay', 'Divya'
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Patel', 'Verma', 'Mehta', 'Pawar', 'Iyer', 'Joshi',
  'Reddy', 'Singh', 'Nair', 'Gupta', 'Deshmukh', 'Kulkarni', 'Chaudhary', 'Rao'
];

const OCCUPATIONS = [
  'Retail Textile Business Owner', 'Senior Software Architect', 'Logistics & Fleet Operator',
  'Healthcare Entrepreneur', 'Restaurant Chain Owner', 'Civil Engineer & Contractor',
  'Electronics Store Distributor', 'Pharmaceutical Consultant', 'Automobile Dealer'
];

const CITIES_LOCATIONS = [
  'Andheri West, Mumbai', 'Sector 17, Vashi, Navi Mumbai', 'GIDC Commercial Hub, Bhiwandi, Thane',
  'Green Meadows, Chembur, Mumbai', 'Baner Road, Pune', 'Koramangala, Bengaluru',
  'Bandra BKC, Mumbai', 'Jubilee Hills, Hyderabad', 'T. Nagar, Chennai'
];

const PROPERTY_DESCRIPTIONS = [
  'Commercial Shop Premises (450 sq ft)', 'Residential 2BHK Apartment', 'Industrial Warehouse Unit',
  'Commercial Office Space (800 sq ft)', 'Prime Commercial Plot'
];

const GOLD_DESCRIPTIONS = [
  '22 Karat Gold Ornaments (Necklace set & bangles)', '24 Karat Investment Gold Coins (100 grams)',
  '22 Karat Gold Temple Jewellery Collection'
];

const VEHICLE_DESCRIPTIONS = [
  'Eicher Commercial Goods Carrier Heavy Vehicle', 'Mahindra Commercial Pickup Truck',
  'Tata Commercial Fleet Van'
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  const rand = Math.random() * (max - min) + min;
  return Number(rand.toFixed(decimals));
}

// Track used unique keys to ensure zero constraint collisions during seeding
const usedAadhaars = new Set<string>();
const usedPans = new Set<string>();
const usedMobiles = new Set<string>();

function generateUniqueAadhaar(): string {
  let aadhaar: string;
  do {
    const part1 = getRandomInt(1000, 9999);
    const part2 = getRandomInt(1000, 9999);
    const part3 = getRandomInt(1000, 9999);
    aadhaar = `${part1} ${part2} ${part3}`;
  } while (usedAadhaars.has(aadhaar));
  usedAadhaars.add(aadhaar);
  return aadhaar;
}

function generateUniquePAN(): string {
  let pan: string;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  do {
    let prefix = '';
    for (let i = 0; i < 5; i++) {
      prefix += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    const digits = String(getRandomInt(1000, 9999));
    const suffix = letters.charAt(Math.floor(Math.random() * letters.length));
    pan = `${prefix}${digits}${suffix}`;
  } while (usedPans.has(pan));
  usedPans.add(pan);
  return pan;
}

function generateUniqueMobile(): string {
  let mobile: string;
  do {
    mobile = `+91 ${getRandomInt(90000, 99999)} ${getRandomInt(10000, 99999)}`;
  } while (usedMobiles.has(mobile));
  usedMobiles.add(mobile);
  return mobile;
}

async function main() {
  console.log('⚡ Dynamic Database Seeding Engine Started...');
  console.log(`📊 Generating dynamic dataset: ${SEED_CONFIG.customerCount} customers, ${SEED_CONFIG.loanCount} loans.`);

  // 1. Dynamic System Settings
  console.log('⚙️ Initializing System Settings...');
  await prisma.systemSettings.upsert({
    where: { id: 'default-settings' },
    update: {
      companyName: SEED_CONFIG.companyName,
      address: SEED_CONFIG.companyAddress,
      gstNumber: SEED_CONFIG.gstNumber,
      contactPhone: SEED_CONFIG.contactPhone,
      contactEmail: SEED_CONFIG.contactEmail,
      loanPrefix: SEED_CONFIG.loanPrefix,
      receiptPrefix: SEED_CONFIG.receiptPrefix,
      defaultPenalty: 2.0,
      gracePeriodDays: 5,
      financialYear: '2026-2027',
      currencySymbol: '₹',
    },
    create: {
      id: 'default-settings',
      companyName: SEED_CONFIG.companyName,
      address: SEED_CONFIG.companyAddress,
      gstNumber: SEED_CONFIG.gstNumber,
      contactPhone: SEED_CONFIG.contactPhone,
      contactEmail: SEED_CONFIG.contactEmail,
      loanPrefix: SEED_CONFIG.loanPrefix,
      receiptPrefix: SEED_CONFIG.receiptPrefix,
      defaultPenalty: 2.0,
      gracePeriodDays: 5,
      financialYear: '2026-2027',
      currencySymbol: '₹',
    },
  });

  // 2. Dynamic Users & Role Accounts
  console.log('👥 Initializing Enterprise User Roles...');
  const pwdHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

  const usersData = [
    { username: 'admin', name: 'Super Admin', email: 'admin@absfinance.com', role: 'SUPER_ADMIN', branch: 'Main Mumbai HQ' },
    { username: 'accountant', name: 'Suresh Iyer', email: 'suresh.accountant@absfinance.com', role: 'ACCOUNTANT', branch: 'Main Mumbai HQ' },
    { username: 'collector', name: 'Ramesh Pawar', email: 'ramesh.collector@absfinance.com', role: 'COLLECTION_OFFICER', branch: 'Andheri West Branch' },
    { username: 'officer_rahul', name: 'Rahul Mehta', email: 'rahul.mehta@absfinance.com', role: 'LOAN_OFFICER', branch: 'Bandra BKC Branch' },
  ];

  const createdUsers: Record<string, any> = {};
  for (const user of usersData) {
    const createdUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        passwordHash: pwdHash,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });
    createdUsers[user.username] = createdUser;
  }

  // 3. Dynamic LTV Interest Slabs
  console.log('📈 Setting up LTV Interest Slabs...');
  await prisma.lTVInterestSlab.deleteMany({});
  await prisma.lTVInterestSlab.createMany({
    data: [
      { ltvRange: '0% - 40% (Low Risk)', minLtv: 0, maxLtv: 40, interestRate: 10.5, status: 'ACTIVE' },
      { ltvRange: '40% - 60% (Moderate Risk)', minLtv: 40, maxLtv: 60, interestRate: 12.0, status: 'ACTIVE' },
      { ltvRange: '60% - 80% (High Risk)', minLtv: 60, maxLtv: 80, interestRate: 14.5, status: 'ACTIVE' },
      { ltvRange: '> 80% (Extreme Risk)', minLtv: 80, maxLtv: 100, interestRate: 18.0, status: 'ACTIVE' },
    ],
  });

  // 4. Dynamic Amount Interest Slabs
  console.log('💰 Setting up Amount Interest Slabs...');
  await prisma.interestSlab.deleteMany({});
  await prisma.interestSlab.createMany({
    data: [
      { name: 'Micro Business Loan (₹10k - ₹1 Lakh)', fromAmount: 10000, toAmount: 100000, interestRate: 14.0, status: 'ACTIVE' },
      { name: 'Small Business Loan (₹1 Lakh - ₹5 Lakhs)', fromAmount: 100001, toAmount: 500000, interestRate: 12.5, status: 'ACTIVE' },
      { name: 'Commercial Loan (₹5 Lakhs - ₹25 Lakhs)', fromAmount: 500001, toAmount: 2500000, interestRate: 11.0, status: 'ACTIVE' },
      { name: 'Enterprise Loan (> ₹25 Lakhs)', fromAmount: 2500001, toAmount: 10000000, interestRate: 9.5, status: 'ACTIVE' },
    ],
  });

  // 5. Dynamic Financial Bank & Cash Accounts
  console.log('🏦 Initializing Bank & Cash Accounts...');
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

  // Clean old dependent operational tables before generating dynamic dataset
  console.log('🧹 Clearing past dynamic collections, loans, and customer records...');
  await prisma.ledgerEntry.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.mortgageDetail.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.customer.deleteMany({});

  // 6. Dynamic Customers Generator
  console.log(`👤 Generating ${SEED_CONFIG.customerCount} dynamic customers...`);
  const createdCustomers: any[] = [];

  for (let i = 1; i <= SEED_CONFIG.customerCount; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const nomineeFirstName = getRandomItem(FIRST_NAMES);
    const nomineeLastName = lastName;
    const riskScore = getRandomFloat(60, 98);
    const riskCategory = riskScore > 85 ? 'LOW' : riskScore > 70 ? 'MEDIUM' : 'HIGH';

    const customer = await prisma.customer.create({
      data: {
        customerId: `CUST-${1000 + i}`,
        name: `${firstName} ${lastName}`,
        mobile: generateUniqueMobile(),
        aadhaar: generateUniqueAadhaar(),
        pan: generateUniquePAN(),
        address: `Plot ${getRandomInt(1, 100)}, ${getRandomItem(CITIES_LOCATIONS)}`,
        occupation: getRandomItem(OCCUPATIONS),
        nomineeName: `${nomineeFirstName} ${nomineeLastName}`,
        nomineeRelation: getRandomItem(['Spouse', 'Father', 'Mother', 'Brother']),
        nomineeMobile: generateUniqueMobile(),
        riskScore,
        riskCategory,
        remarks: `Dynamically generated verified client record (Score: ${riskScore})`,
      },
    });
    createdCustomers.push(customer);
  }

  // 7. Dynamic Loans & Mortgages Generator
  console.log(`📋 Generating ${SEED_CONFIG.loanCount} dynamic loans & mortgages...`);
  const createdLoans: any[] = [];
  const bankAccounts = [hdfcBank, iciciBank];

  for (let i = 1; i <= SEED_CONFIG.loanCount; i++) {
    const customer = getRandomItem(createdCustomers);
    const assetType = getRandomItem(['PROPERTY', 'GOLD', 'VEHICLE']);
    const principalAmount = getRandomInt(2, 50) * 100000; // ₹2 Lakhs to ₹50 Lakhs
    
    // Dynamic asset valuation & LTV calculation
    let assetDescription = '';
    let marketMultiplier = getRandomFloat(1.4, 2.2);
    if (assetType === 'PROPERTY') {
      assetDescription = getRandomItem(PROPERTY_DESCRIPTIONS);
    } else if (assetType === 'GOLD') {
      assetDescription = getRandomItem(GOLD_DESCRIPTIONS);
    } else {
      assetDescription = getRandomItem(VEHICLE_DESCRIPTIONS);
    }

    const estimatedValue = Math.round(principalAmount * marketMultiplier);
    const marketValue = Math.round(estimatedValue * getRandomFloat(1.02, 1.1));
    const ltvPercentage = getRandomFloat((principalAmount / estimatedValue) * 100, 2);
    const tenureMonths = getRandomItem([12, 18, 24, 36, 48]);
    const interestType = getRandomItem(['FLAT', 'REDUCING']);
    const interestRate = getRandomFloat(9.5, 14.5);
    const status = getRandomItem(['ACTIVE', 'ACTIVE', 'ACTIVE', 'OVERDUE', 'CLOSED']);
    const outstandingBalance = status === 'CLOSED' ? 0 : Math.round(principalAmount * getRandomFloat(0.4, 0.9));

    const disbursedFrom = getRandomItem(['BANK', 'CASH']);
    const selectedBank = disbursedFrom === 'BANK' ? getRandomItem(bankAccounts) : null;

    const loan = await prisma.loan.create({
      data: {
        loanNumber: `${SEED_CONFIG.loanPrefix}-${String(i).padStart(3, '0')}`,
        customerId: customer.id,
        loanType: 'MORTGAGE',
        principalAmount,
        interestType,
        interestRate,
        tenureMonths,
        status,
        outstandingBalance,
        disbursedFrom,
        bankAccountId: selectedBank?.id || null,
        notes: `Dynamic ${assetType} mortgaged loan. LTV: ${ltvPercentage}%.`,
        mortgageDetail: {
          create: {
            assetType,
            assetDescription,
            estimatedValue,
            marketValue,
            ltvPercentage,
          },
        },
      },
    });
    createdLoans.push({ ...loan, customer });
  }

  // 8. Dynamic Collections & Ledger Double-Entry Balances Engine
  console.log('🧾 Generating dynamic collections and ledger balance logs...');
  let currentRunningBalance = hdfcBank.currentBalance;

  for (let i = 0; i < createdLoans.length; i++) {
    const loan = createdLoans[i];
    if (loan.status === 'CLOSED' || loan.status === 'ACTIVE') {
      const amountReceived = Math.round(loan.principalAmount * 0.1);
      const principalPaid = Math.round(amountReceived * 0.8);
      const interestPaid = amountReceived - principalPaid;
      const paymentMode = getRandomItem(['BANK_TRANSFER', 'UPI', 'CASH']);
      const isBank = paymentMode !== 'CASH';
      const selectedBank = isBank ? getRandomItem(bankAccounts) : null;

      const collection = await prisma.collection.create({
        data: {
          collectionId: `${SEED_CONFIG.receiptPrefix}-${100 + i}`,
          loanId: loan.id,
          customerId: loan.customerId,
          amountReceived,
          principalPaid,
          interestPaid,
          penaltyPaid: 0,
          paymentMode,
          bankAccountId: selectedBank?.id || null,
          referenceNo: isBank ? `TXN-${getRandomInt(1000000, 9999999)}` : 'CASH-REC',
          recordedById: createdUsers.admin.id,
          notes: `Dynamic installment payment recorded for ${loan.loanNumber}`,
        },
      });

      currentRunningBalance += amountReceived;

      // Dynamic Ledger Double-Entry
      await prisma.ledgerEntry.create({
        data: {
          ledgerId: `LEDG-${10000 + i}`,
          transactionType: 'COLLECTION',
          referenceNo: collection.collectionId,
          debit: 0,
          credit: amountReceived,
          balanceAfter: currentRunningBalance,
          bankAccountId: selectedBank?.id || hdfcBank.id,
          isCash: !isBank,
          remarks: `Collection received for ${loan.loanNumber} from customer ${loan.customer.name}`,
          loanId: loan.id,
          collectionId: collection.id,
        },
      });
    }
  }

  // 9. Dynamic Income & Expense Entries
  console.log('📊 Generating dynamic operational incomes and expenses...');
  await prisma.income.create({
    data: {
      incomeNo: 'INC-1001',
      category: 'PROCESSING_FEE',
      amount: getRandomInt(10000, 25000),
      paymentMode: 'BANK_TRANSFER',
      bankAccountId: hdfcBank.id,
      isCash: false,
      referenceNo: `FEE-${getRandomInt(1000, 9999)}`,
      remarks: 'Dynamic loan processing & documentation fee collected',
    },
  });

  await prisma.expense.create({
    data: {
      expenseNo: 'EXP-1001',
      category: 'OFFICE_RENT',
      amount: getRandomInt(35000, 50000),
      paymentMode: 'BANK_TRANSFER',
      bankAccountId: hdfcBank.id,
      isCash: false,
      referenceNo: `RENT-2026-${getRandomInt(10, 99)}`,
      remarks: 'Dynamic monthly office rent disbursement',
    },
  });

  // 10. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: createdUsers.admin.id,
      username: createdUsers.admin.username,
      action: 'DYNAMIC_SEED_INITIALIZATION',
      module: 'SYSTEM',
      details: `Successfully executed dynamic database seeding: generated ${SEED_CONFIG.customerCount} customers, ${SEED_CONFIG.loanCount} loans, and balanced ledger entries.`,
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Dynamic database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Dynamic seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


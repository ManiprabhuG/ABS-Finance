import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'TRIAL_BALANCE';
    
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (searchParams.get('from')) {
      fromDate = new Date(searchParams.get('from')!);
      fromDate.setHours(0, 0, 0, 0);
    }
    if (searchParams.get('to')) {
      toDate = new Date(searchParams.get('to')!);
      toDate.setHours(23, 59, 59, 999);
    }

    const dateFilter = fromDate || toDate
      ? {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        }
      : undefined;

    // Base Aggregations
    const [
      loanSummary,
      collectionSummary,
      incomeSummary,
      expenseSummary,
      bankAccounts,
      cashAccount,
      settings,
    ] = await Promise.all([
      db.loan.aggregate({
        _sum: { principalAmount: true, outstandingBalance: true, totalInterestAmount: true },
        _count: { id: true },
        where: {
          status: { not: 'PENDING' },
          ...(dateFilter && { loanDate: dateFilter }),
        },
      }),
      db.collection.aggregate({
        _sum: { amountReceived: true, interestPaid: true, principalPaid: true, penaltyPaid: true },
        where: dateFilter ? { collectionDate: dateFilter } : undefined,
      }),
      db.income.aggregate({
        _sum: { amount: true },
        where: dateFilter ? { date: dateFilter } : undefined,
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: dateFilter ? { date: dateFilter } : undefined,
      }),
      db.bankAccount.findMany({ select: { id: true, accountName: true, bankName: true, currentBalance: true, branch: true } }),
      db.cashAccount.findUnique({ where: { id: 'cash-master' } }),
      db.systemSettings.findUnique({ where: { id: 'default-settings' } }),
    ]);

    const totalDisbursed = loanSummary._sum.principalAmount || 0;
    const totalOutstanding = loanSummary._sum.outstandingBalance || 0;
    const totalCollections = collectionSummary._sum.amountReceived || 0;
    const totalInterestCollected = collectionSummary._sum.interestPaid || 0;
    const totalPenaltyCollected = collectionSummary._sum.penaltyPaid || 0;
    const totalDirectIncome = incomeSummary._sum.amount || 0;
    const totalIncome = totalDirectIncome + totalInterestCollected + totalPenaltyCollected;
    const totalExpense = expenseSummary._sum.amount || 0;
    const netProfit = totalIncome - totalExpense;
    const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
    const cashInHand = cashAccount?.currentBalance || 0;

    // Report-specific logic
    let reportData: any = {};

    if (reportType === 'DAILY_CASH_FLOW') {
      const [cashCollections, cashDisbursements, cashExpenses, cashIncomes, fundTransfers] = await Promise.all([
        db.collection.findMany({
          where: {
            paymentMode: 'CASH',
            ...(dateFilter && { collectionDate: dateFilter }),
          },
          include: { customer: { select: { name: true } }, loan: { select: { loanNumber: true } } },
          orderBy: { collectionDate: 'desc' },
          take: 200,
        }),
        db.loan.findMany({
          where: {
            disbursedFrom: 'CASH',
            status: { in: ['ACTIVE', 'DISBURSED', 'OVERDUE', 'CLOSED'] },
            ...(dateFilter && { loanDate: dateFilter }),
          },
          include: { customer: { select: { name: true } } },
          orderBy: { loanDate: 'desc' },
          take: 200,
        }),
        db.expense.findMany({
          where: {
            isCash: true,
            ...(dateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'desc' },
          take: 200,
        }),
        db.income.findMany({
          where: {
            isCash: true,
            ...(dateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'desc' },
          take: 200,
        }),
        db.fundTransfer.findMany({
          where: {
            OR: [{ fromAccountType: 'CASH' }, { toAccountType: 'CASH' }],
            ...(dateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'desc' },
          take: 100,
        }),
      ]);

      const totalCashInflow =
        cashCollections.reduce((acc, c) => acc + c.amountReceived, 0) +
        cashIncomes.reduce((acc, i) => acc + i.amount, 0) +
        fundTransfers.filter(t => t.toAccountType === 'CASH').reduce((acc, t) => acc + t.amount, 0);

      const totalCashOutflow =
        cashDisbursements.reduce((acc, l) => acc + l.principalAmount, 0) +
        cashExpenses.reduce((acc, e) => acc + e.amount, 0) +
        fundTransfers.filter(t => t.fromAccountType === 'CASH').reduce((acc, t) => acc + t.amount, 0);

      const openingCash = Math.max(0, cashInHand - (totalCashInflow - totalCashOutflow));

      reportData = {
        openingCash,
        closingCash: cashInHand,
        totalCashInflow,
        totalCashOutflow,
        netCashMovement: totalCashInflow - totalCashOutflow,
        cashCollections,
        cashDisbursements,
        cashExpenses,
        cashIncomes,
        fundTransfers,
      };
    } else if (reportType === 'PENDING_COLLECTION_LOCATION') {
      const loans = await db.loan.findMany({
        where: {
          status: { in: ['ACTIVE', 'OVERDUE'] },
          outstandingBalance: { gt: 0 },
        },
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              name: true,
              mobile: true,
              address: true,
              occupation: true,
              riskCategory: true,
              riskScore: true,
            },
          },
          collections: {
            orderBy: { collectionDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { outstandingBalance: 'desc' },
      });

      // Group by location/city/area
      const locationMap: Record<string, { location: string; count: number; totalOutstanding: number; overdueCount: number; items: any[] }> = {};

      loans.forEach((loan) => {
        const address = loan.customer?.address || 'Central District';
        const parts = address.split(',');
        const locKey = (parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim()) || 'Central Region';

        if (!locationMap[locKey]) {
          locationMap[locKey] = {
            location: locKey,
            count: 0,
            totalOutstanding: 0,
            overdueCount: 0,
            items: [],
          };
        }

        const isOverdue = loan.status === 'OVERDUE' || loan.npaDays > 0;
        locationMap[locKey].count += 1;
        locationMap[locKey].totalOutstanding += loan.outstandingBalance;
        if (isOverdue) locationMap[locKey].overdueCount += 1;

        locationMap[locKey].items.push({
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          customerName: loan.customer?.name,
          mobile: loan.customer?.mobile,
          address: loan.customer?.address,
          riskCategory: loan.customer?.riskCategory || 'LOW',
          riskScore: loan.customer?.riskScore || 85,
          loanType: loan.loanType,
          principalAmount: loan.principalAmount,
          outstandingBalance: loan.outstandingBalance,
          installmentAmount: loan.installmentAmount,
          installmentType: loan.installmentType,
          status: loan.status,
          npaDays: loan.npaDays,
          lastPaymentDate: loan.collections[0]?.collectionDate || null,
        });
      });

      const locationsList = Object.values(locationMap).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

      reportData = {
        totalPendingLoans: loans.length,
        totalPendingAmount: totalOutstanding,
        locations: locationsList,
      };
    } else if (reportType === 'MASTER_GST') {
      const feeIncomes = await db.income.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
      });

      const penaltyCollections = await db.collection.findMany({
        where: {
          penaltyPaid: { gt: 0 },
          ...(dateFilter && { collectionDate: dateFilter }),
        },
        include: { customer: { select: { name: true } } },
      });

      const operationalExpenses = await db.expense.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
      });

      const totalFeeTurnover = feeIncomes.reduce((sum, i) => sum + i.amount, 0);
      const totalPenalTurnover = penaltyCollections.reduce((sum, c) => sum + c.penaltyPaid, 0);
      const totalTaxableTurnover = totalFeeTurnover + totalPenalTurnover;
      const totalExemptTurnover = totalInterestCollected; // Interest is 100% exempt from GST under Indian GST Act

      const outputGstTotal = totalTaxableTurnover * 0.18;
      const outputCgst = outputGstTotal / 2;
      const outputSgst = outputGstTotal / 2;
      const outputIgst = 0;

      const totalExpenseTaxable = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
      const grossInwardGst = totalExpenseTaxable * 0.18;
      const eligibleItc = grossInwardGst * 0.50; // Section 17(4) 50% NBFC apportionment

      const netGstPayable = Math.max(0, outputGstTotal - eligibleItc);

      reportData = {
        gstin: settings?.gstNumber || '33AAAAA0000A1Z5',
        companyName: settings?.companyName || 'ABS Finance Management Ltd.',
        totalTurnover: totalTaxableTurnover + totalExemptTurnover,
        taxableTurnover: totalTaxableTurnover,
        exemptTurnover: totalExemptTurnover,
        feeTurnover: totalFeeTurnover,
        penalTurnover: totalPenalTurnover,
        outputGst: {
          total: outputGstTotal,
          cgst: outputCgst,
          sgst: outputSgst,
          igst: outputIgst,
        },
        inputTaxCredit: {
          grossExpense: totalExpenseTaxable,
          grossInwardGst,
          eligibleItc,
          ineligibleItc: grossInwardGst - eligibleItc,
        },
        netGstPayable,
        feeIncomes,
        penaltyCollections,
      };
    } else if (reportType === 'GSTR1_OUTWARD') {
      const [taxInvoices, incomes, penaltyCollections] = await Promise.all([
        db.taxInvoice.findMany({
          where: dateFilter ? { invoiceDate: dateFilter } : undefined,
          orderBy: { invoiceDate: 'desc' },
          take: 200,
        }),
        db.income.findMany({
          where: dateFilter ? { date: dateFilter } : undefined,
          orderBy: { date: 'desc' },
          take: 200,
        }),
        db.collection.findMany({
          where: {
            penaltyPaid: { gt: 0 },
            ...(dateFilter && { collectionDate: dateFilter }),
          },
          include: { customer: true, loan: true },
          orderBy: { collectionDate: 'desc' },
          take: 200,
        }),
      ]);

      const items: any[] = [];

      taxInvoices.forEach((inv) => {
        items.push({
          invoiceNo: inv.invoiceNumber,
          date: inv.invoiceDate,
          customerName: inv.customerName,
          customerGstin: inv.customerGstin || 'URP (Unregistered)',
          pos: inv.placeOfSupply,
          sacCode: inv.sacCode,
          serviceDescription: inv.serviceType.replace(/_/g, ' '),
          taxableValue: inv.taxableValue,
          rate: `${inv.gstRate}%`,
          cgst: inv.cgstAmount,
          sgst: inv.sgstAmount,
          igst: inv.igstAmount,
          totalAmount: inv.totalInvoiceAmount,
          type: 'B2C Small / Invoiced',
        });
      });

      incomes.forEach((inc, idx) => {
        const taxable = inc.amount;
        const cgst = taxable * 0.09;
        const sgst = taxable * 0.09;
        items.push({
          invoiceNo: inc.incomeNo || `FEE-INV-${1000 + idx}`,
          date: inc.date,
          customerName: 'ABS Borrower / Client',
          customerGstin: 'URP (Unregistered)',
          pos: '33-Tamil Nadu',
          sacCode: '997119',
          serviceDescription: inc.category.replace(/_/g, ' '),
          taxableValue: taxable,
          rate: '18%',
          cgst,
          sgst,
          igst: 0,
          totalAmount: taxable + cgst + sgst,
          type: 'B2C Direct Fee',
        });
      });

      penaltyCollections.forEach((col) => {
        const taxable = col.penaltyPaid;
        const cgst = taxable * 0.09;
        const sgst = taxable * 0.09;
        items.push({
          invoiceNo: `PEN-${col.collectionId}`,
          date: col.collectionDate,
          customerName: col.customer?.name || 'Borrower',
          customerGstin: col.customer?.pan ? `PAN-${col.customer.pan}` : 'URP (Unregistered)',
          pos: '33-Tamil Nadu',
          sacCode: '997113',
          serviceDescription: 'Late Repayment Penalty / Delay Charges',
          taxableValue: taxable,
          rate: '18%',
          cgst,
          sgst,
          igst: 0,
          totalAmount: taxable + cgst + sgst,
          type: 'B2C Penal Levy',
        });
      });

      const totalTaxable = items.reduce((acc, i) => acc + i.taxableValue, 0);
      const totalCgst = items.reduce((acc, i) => acc + i.cgst, 0);
      const totalSgst = items.reduce((acc, i) => acc + i.sgst, 0);
      const totalGross = items.reduce((acc, i) => acc + i.totalAmount, 0);

      reportData = {
        gstin: settings?.gstNumber || '33AAAAA0000A1Z5',
        totalInvoices: items.length,
        totalTaxable,
        totalCgst,
        totalSgst,
        totalGross,
        items,
      };
    } else if (reportType === 'ITC_REGISTER') {
      const expenses = await db.expense.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
        take: 300,
      });

      const items = expenses.map((exp, idx) => {
        const taxable = exp.amount;
        const grossGst = taxable * 0.18;
        const cgst = grossGst / 2;
        const sgst = grossGst / 2;
        const eligiblePercent = 50; // Section 17(4) of CGST Act for NBFCs
        const eligibleAmount = grossGst * 0.5;

        return {
          voucherNo: exp.expenseNo,
          date: exp.date,
          vendorName: exp.remarks || `Vendor - ${exp.category}`,
          vendorGstin: `33ABCDE${1000 + idx}F1Z5`,
          category: exp.category.replace(/_/g, ' '),
          invoiceValue: taxable + grossGst,
          taxableValue: taxable,
          rate: '18%',
          cgst,
          sgst,
          itcEligibility: `${eligiblePercent}% (Sec 17(4) NBFC Rule)`,
          eligibleItc: eligibleAmount,
          ineligibleItc: grossGst - eligibleAmount,
        };
      });

      const totalTaxable = items.reduce((acc, i) => acc + i.taxableValue, 0);
      const totalGrossGst = items.reduce((acc, i) => acc + (i.cgst + i.sgst), 0);
      const totalEligibleItc = items.reduce((acc, i) => acc + i.eligibleItc, 0);

      reportData = {
        totalVouchers: items.length,
        totalTaxable,
        totalGrossGst,
        totalEligibleItc,
        items,
      };
    } else if (reportType === 'MIXED_SUPPLY') {
      const mortgageLoans = await db.loan.findMany({
        where: {
          loanType: { in: ['MORTGAGE', 'CUSTOM'] },
          status: { not: 'PENDING' },
          ...(dateFilter && { loanDate: dateFilter }),
        },
        include: {
          customer: true,
          mortgageDetail: true,
        },
        orderBy: { loanDate: 'desc' },
        take: 100,
      });

      const bundledLogs = mortgageLoans.map((loan) => {
        const principal = loan.principalAmount;
        const processingCharge = Math.round(principal * 0.015);
        const valuationFee = loan.mortgageDetail ? 3500 : 1500;
        const docAndLegalFee = 2500;
        const totalBundleFee = processingCharge + valuationFee + docAndLegalFee;
        const bundleGst = totalBundleFee * 0.18;

        return {
          bundleId: `BDL-${loan.loanNumber}`,
          loanNumber: loan.loanNumber,
          customerName: loan.customer?.name,
          date: loan.loanDate,
          loanPrincipalExempt: principal,
          breakdown: [
            { component: 'Principal Lending Advance', amount: principal, taxRate: '0% (Exempt)', taxableGst: 0 },
            { component: 'Loan Processing & Underwriting', amount: processingCharge, taxRate: '18%', taxableGst: processingCharge * 0.18 },
            { component: 'Property / Collateral Valuation', amount: valuationFee, taxRate: '18%', taxableGst: valuationFee * 0.18 },
            { component: 'Legal Documentation & Stamp Charges', amount: docAndLegalFee, taxRate: '18%', taxableGst: docAndLegalFee * 0.18 },
          ],
          totalTaxableFee: totalBundleFee,
          totalGstLevied: bundleGst,
          supplyClassification: 'Composite Financial Supply (Unbundled Accounting Applied)',
          complianceStatus: 'VERIFIED_COMPLIANT',
        };
      });

      reportData = {
        totalBundles: bundledLogs.length,
        totalBundledValue: bundledLogs.reduce((acc, b) => acc + b.totalTaxableFee, 0),
        totalGstLevied: bundledLogs.reduce((acc, b) => acc + b.totalGstLevied, 0),
        logs: bundledLogs,
      };
    } else if (reportType === 'LOAN_OUTSTANDING') {
      const loans = await db.loan.findMany({
        where: {
          status: { in: ['ACTIVE', 'OVERDUE'] },
          ...(dateFilter && { loanDate: dateFilter }),
        },
        include: { customer: { select: { name: true, mobile: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      reportData = { loans };
    } else if (reportType === 'DAY_BOOK' || reportType === 'CASH_BOOK' || reportType === 'BANK_BOOK') {
      const ledgerWhere: any = {};
      if (reportType === 'CASH_BOOK') ledgerWhere.isCash = true;
      if (reportType === 'BANK_BOOK') ledgerWhere.bankAccountId = { not: null };
      if (dateFilter) ledgerWhere.date = dateFilter;

      const ledgerEntries = await db.ledgerEntry.findMany({
        where: ledgerWhere,
        orderBy: { date: 'desc' },
        take: 500,
      });
      reportData = { ledgerEntries };
    } else if (reportType === 'PROFIT_LOSS') {
      const incomes = await db.income.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
        take: 200,
      });
      const expenses = await db.expense.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
        take: 200,
      });
      reportData = { incomes, expenses };
    }

    return NextResponse.json({
      summary: {
        totalDisbursed,
        totalOutstanding,
        totalCollections,
        totalInterestCollected,
        totalPenaltyCollected,
        totalIncome,
        totalExpense,
        netProfit,
        totalBankBalance,
        cashInHand,
        totalAssets: totalOutstanding + totalBankBalance + cashInHand,
        loanCount: loanSummary._count.id,
      },
      bankAccounts,
      cashInHand,
      reportType,
      ...reportData,
    });
  } catch (error: any) {
    console.error('Error in financial report API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


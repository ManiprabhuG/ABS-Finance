import { db } from './db';

/**
 * Master Financial Accounting Ledger Engine for ABS Finance.
 * Interconnects all transactions with Cash In Hand / Bank balances and Central Ledger Book.
 */

export async function getNextSequenceNumber(prefix: string, model: 'customer' | 'loan' | 'collection' | 'ledger' | 'income' | 'expense' | 'transfer'): Promise<string> {
  const count = await getModelCount(model);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${nextNum}`;
}

async function getModelCount(model: string): Promise<number> {
  switch (model) {
    case 'customer':
      return await db.customer.count();
    case 'loan':
      return await db.loan.count();
    case 'collection':
      return await db.collection.count();
    case 'ledger':
      return await db.ledgerEntry.count();
    case 'income':
      return await db.income.count();
    case 'expense':
      return await db.expense.count();
    case 'transfer':
      return await db.fundTransfer.count();
    default:
      return 100;
  }
}

/**
 * Record a Loan Disbursement transaction.
 * 1. Checks source balance (Bank Account or Cash in Hand)
 * 2. Deducts principal amount from source
 * 3. Updates loan status to DISBURSED/ACTIVE
 * 4. Posts Debit entry to Central Master Ledger
 */
export async function recordLoanDisbursement(params: {
  loanId: string;
  disbursedFrom: 'CASH' | 'BANK';
  bankAccountId?: string;
  userId?: string;
  username: string;
}) {
  const loan = await db.loan.findUnique({
    where: { id: params.loanId },
    include: { customer: true }
  });

  if (!loan) throw new Error('Loan not found');
  if (loan.status === 'ACTIVE' || loan.status === 'CLOSED') {
    throw new Error('Loan has already been disbursed');
  }

  const amount = loan.principalAmount;
  let sourceName = 'Cash In Hand';
  let balanceAfter = 0;

  return await db.$transaction(async (tx) => {
    if (params.disbursedFrom === 'BANK') {
      if (!params.bankAccountId) throw new Error('Bank account ID required for Bank disbursement');
      const bankAcc = await tx.bankAccount.findUnique({ where: { id: params.bankAccountId } });
      if (!bankAcc) throw new Error('Bank Account not found');
      if (bankAcc.currentBalance < amount) throw new Error(`Insufficient Bank Balance in ${bankAcc.bankName}. Available: ₹${bankAcc.currentBalance}`);

      const updatedBank = await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: { currentBalance: bankAcc.currentBalance - amount }
      });
      sourceName = `${bankAcc.bankName} (${bankAcc.accountNumber.slice(-4)})`;
      balanceAfter = updatedBank.currentBalance;
    } else {
      let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (!cashAcc) {
        cashAcc = await tx.cashAccount.create({ data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 500000 } });
      }
      if (cashAcc.currentBalance < amount) {
        throw new Error(`Insufficient Cash In Hand. Available: ₹${cashAcc.currentBalance}`);
      }

      const updatedCash = await tx.cashAccount.update({
        where: { id: 'cash-master' },
        data: { currentBalance: cashAcc.currentBalance - amount }
      });
      balanceAfter = updatedCash.currentBalance;
    }

    // Update Loan Status
    const updatedLoan = await tx.loan.update({
      where: { id: params.loanId },
      data: {
        status: 'ACTIVE',
        disbursedFrom: params.disbursedFrom,
        bankAccountId: params.bankAccountId || null,
        outstandingBalance: amount,
      }
    });

    // Post to Master Ledger
    const ledgerCount = await tx.ledgerEntry.count();
    const ledgerId = `LEDG-${(ledgerCount + 1001).toString()}`;

    await tx.ledgerEntry.create({
      data: {
        ledgerId,
        transactionType: 'DISBURSEMENT',
        referenceNo: loan.loanNumber,
        debit: amount,
        credit: 0,
        balanceAfter,
        isCash: params.disbursedFrom === 'CASH',
        bankAccountId: params.disbursedFrom === 'BANK' ? params.bankAccountId : null,
        remarks: `Loan Disbursement for ${loan.customer.name} (${loan.loanNumber}) via ${sourceName}`,
        loanId: loan.id,
      }
    });

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId: params.userId,
        username: params.username,
        action: 'DISBURSE',
        module: 'LOAN',
        details: `Disbursed loan ${loan.loanNumber} of ₹${amount} via ${sourceName}`,
      }
    });

    return updatedLoan;
  });
}

/**
 * Record a Loan Collection transaction.
 * 1. Credit destination balance (Bank Account or Cash in Hand)
 * 2. Reduce loan outstanding balance
 * 3. Auto-close loan if outstanding balance drops to 0
 * 4. Post Credit entry to Central Master Ledger
 */
export async function recordLoanCollection(params: {
  loanId: string;
  amountReceived: number;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid?: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  bankAccountId?: string;
  referenceNo?: string;
  notes?: string;
  userId?: string;
  username: string;
}) {
  const loan = await db.loan.findUnique({
    where: { id: params.loanId },
    include: { customer: true }
  });

  if (!loan) throw new Error('Loan not found');

  const totalReceived = params.amountReceived;
  const penalty = params.penaltyPaid || 0;
  let targetName = 'Cash In Hand';
  let balanceAfter = 0;

  return await db.$transaction(async (tx) => {
    const isCash = params.paymentMode === 'CASH';

    if (!isCash) {
      if (!params.bankAccountId) throw new Error('Bank account required for digital/cheque payment mode');
      const bankAcc = await tx.bankAccount.findUnique({ where: { id: params.bankAccountId } });
      if (!bankAcc) throw new Error('Bank Account not found');

      const updatedBank = await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: { currentBalance: bankAcc.currentBalance + totalReceived }
      });
      targetName = `${bankAcc.bankName} (${bankAcc.accountNumber.slice(-4)})`;
      balanceAfter = updatedBank.currentBalance;
    } else {
      let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (!cashAcc) {
        cashAcc = await tx.cashAccount.create({ data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 0 } });
      }

      const updatedCash = await tx.cashAccount.update({
        where: { id: 'cash-master' },
        data: { currentBalance: cashAcc.currentBalance + totalReceived }
      });
      balanceAfter = updatedCash.currentBalance;
    }

    // Calculate new outstanding principal
    const newOutstanding = Math.max(0, loan.outstandingBalance - params.principalPaid);
    const newStatus = newOutstanding <= 0 ? 'CLOSED' : 'ACTIVE';

    await tx.loan.update({
      where: { id: params.loanId },
      data: {
        outstandingBalance: newOutstanding,
        status: newStatus,
      }
    });

    // Create Collection Record
    const colCount = await tx.collection.count();
    const collectionId = `COL-${(colCount + 1001).toString()}`;

    const collectionRecord = await tx.collection.create({
      data: {
        collectionId,
        loanId: loan.id,
        customerId: loan.customerId,
        amountReceived: totalReceived,
        principalPaid: params.principalPaid,
        interestPaid: params.interestPaid,
        penaltyPaid: penalty,
        paymentMode: params.paymentMode,
        bankAccountId: !isCash ? params.bankAccountId : null,
        referenceNo: params.referenceNo || null,
        recordedById: params.userId || null,
        notes: params.notes || null,
      }
    });

    // Post to Master Ledger
    const ledgerCount = await tx.ledgerEntry.count();
    const ledgerCode = `LEDG-${(ledgerCount + 1001).toString()}`;

    await tx.ledgerEntry.create({
      data: {
        ledgerId: ledgerCode,
        transactionType: 'COLLECTION',
        referenceNo: collectionId,
        debit: 0,
        credit: totalReceived,
        balanceAfter,
        isCash,
        bankAccountId: !isCash ? params.bankAccountId : null,
        remarks: `Collection of ₹${totalReceived} (Principal: ₹${params.principalPaid}, Interest: ₹${params.interestPaid}${penalty > 0 ? `, Penalty: ₹${penalty}` : ''}) for ${loan.customer.name} (${loan.loanNumber})`,
        loanId: loan.id,
        collectionId: collectionRecord.id,
      }
    });

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId: params.userId,
        username: params.username,
        action: 'CREATE',
        module: 'COLLECTION',
        details: `Collected ₹${totalReceived} for Loan ${loan.loanNumber} via ${targetName}`,
      }
    });

    return collectionRecord;
  });
}

/**
 * Record Income (Processing fees, doc charges, etc.)
 */
export async function recordIncome(params: {
  category: string;
  amount: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  bankAccountId?: string;
  referenceNo?: string;
  remarks?: string;
  userId?: string;
  username: string;
}) {
  return await db.$transaction(async (tx) => {
    const isCash = params.paymentMode === 'CASH';
    let balanceAfter = 0;

    if (!isCash) {
      if (!params.bankAccountId) throw new Error('Bank account required for digital income');
      const bankAcc = await tx.bankAccount.findUnique({ where: { id: params.bankAccountId } });
      if (!bankAcc) throw new Error('Bank account not found');

      const updated = await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: { currentBalance: bankAcc.currentBalance + params.amount }
      });
      balanceAfter = updated.currentBalance;
    } else {
      let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (!cashAcc) cashAcc = await tx.cashAccount.create({ data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 0 } });

      const updated = await tx.cashAccount.update({
        where: { id: 'cash-master' },
        data: { currentBalance: cashAcc.currentBalance + params.amount }
      });
      balanceAfter = updated.currentBalance;
    }

    const incCount = await tx.income.count();
    const incomeNo = `INC-${(incCount + 1001).toString()}`;

    const incomeRecord = await tx.income.create({
      data: {
        incomeNo,
        category: params.category,
        amount: params.amount,
        paymentMode: params.paymentMode,
        bankAccountId: !isCash ? params.bankAccountId : null,
        isCash,
        referenceNo: params.referenceNo,
        remarks: params.remarks,
      }
    });

    const ledgerCount = await tx.ledgerEntry.count();
    await tx.ledgerEntry.create({
      data: {
        ledgerId: `LEDG-${(ledgerCount + 1001).toString()}`,
        transactionType: 'INCOME',
        referenceNo: incomeNo,
        debit: 0,
        credit: params.amount,
        balanceAfter,
        isCash,
        bankAccountId: !isCash ? params.bankAccountId : null,
        remarks: `Income Recorded [${params.category}]: ₹${params.amount} ${params.remarks ? `- ${params.remarks}` : ''}`,
        incomeId: incomeRecord.id,
      }
    });

    await tx.auditLog.create({
      data: {
        userId: params.userId,
        username: params.username,
        action: 'CREATE',
        module: 'FINANCE',
        details: `Recorded Income ${incomeNo} of ₹${params.amount} [${params.category}]`,
      }
    });

    return incomeRecord;
  });
}

/**
 * Record Expense (Rent, Salary, Electricity, Maintenance, etc.)
 */
export async function recordExpense(params: {
  category: string;
  amount: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  bankAccountId?: string;
  referenceNo?: string;
  remarks?: string;
  userId?: string;
  username: string;
}) {
  return await db.$transaction(async (tx) => {
    const isCash = params.paymentMode === 'CASH';
    let balanceAfter = 0;

    if (!isCash) {
      if (!params.bankAccountId) throw new Error('Bank account required');
      const bankAcc = await tx.bankAccount.findUnique({ where: { id: params.bankAccountId } });
      if (!bankAcc) throw new Error('Bank account not found');
      if (bankAcc.currentBalance < params.amount) throw new Error(`Insufficient funds in ${bankAcc.bankName}`);

      const updated = await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: { currentBalance: bankAcc.currentBalance - params.amount }
      });
      balanceAfter = updated.currentBalance;
    } else {
      let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (!cashAcc) cashAcc = await tx.cashAccount.create({ data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 0 } });
      if (cashAcc.currentBalance < params.amount) throw new Error(`Insufficient Cash In Hand. Available: ₹${cashAcc.currentBalance}`);

      const updated = await tx.cashAccount.update({
        where: { id: 'cash-master' },
        data: { currentBalance: cashAcc.currentBalance - params.amount }
      });
      balanceAfter = updated.currentBalance;
    }

    const expCount = await tx.expense.count();
    const expenseNo = `EXP-${(expCount + 1001).toString()}`;

    const expenseRecord = await tx.expense.create({
      data: {
        expenseNo,
        category: params.category,
        amount: params.amount,
        paymentMode: params.paymentMode,
        bankAccountId: !isCash ? params.bankAccountId : null,
        isCash,
        referenceNo: params.referenceNo,
        remarks: params.remarks,
      }
    });

    const ledgerCount = await tx.ledgerEntry.count();
    await tx.ledgerEntry.create({
      data: {
        ledgerId: `LEDG-${(ledgerCount + 1001).toString()}`,
        transactionType: 'EXPENSE',
        referenceNo: expenseNo,
        debit: params.amount,
        credit: 0,
        balanceAfter,
        isCash,
        bankAccountId: !isCash ? params.bankAccountId : null,
        remarks: `Expense Paid [${params.category}]: ₹${params.amount} ${params.remarks ? `- ${params.remarks}` : ''}`,
        expenseId: expenseRecord.id,
      }
    });

    await tx.auditLog.create({
      data: {
        userId: params.userId,
        username: params.username,
        action: 'CREATE',
        module: 'FINANCE',
        details: `Paid Expense ${expenseNo} of ₹${params.amount} [${params.category}]`,
      }
    });

    return expenseRecord;
  });
}

/**
 * Record Fund Transfer (Bank to Bank, Bank to Cash, Cash to Bank)
 */
export async function recordFundTransfer(params: {
  amount: number;
  fromAccountType: 'BANK' | 'CASH';
  fromAccountId?: string;
  toAccountType: 'BANK' | 'CASH';
  toAccountId?: string;
  referenceNo?: string;
  remarks?: string;
  userId?: string;
  username: string;
}) {
  if (params.fromAccountType === params.toAccountType && params.fromAccountId === params.toAccountId) {
    throw new Error('Source and Destination accounts cannot be the same');
  }

  return await db.$transaction(async (tx) => {
    let fromLabel = 'Cash In Hand';
    let toLabel = 'Cash In Hand';

    // 1. Deduct from Source
    if (params.fromAccountType === 'BANK') {
      if (!params.fromAccountId) throw new Error('Source Bank Account ID required');
      const fromBank = await tx.bankAccount.findUnique({ where: { id: params.fromAccountId } });
      if (!fromBank) throw new Error('Source bank account not found');
      if (fromBank.currentBalance < params.amount) throw new Error(`Insufficient balance in ${fromBank.bankName}`);

      await tx.bankAccount.update({
        where: { id: params.fromAccountId },
        data: { currentBalance: fromBank.currentBalance - params.amount }
      });
      fromLabel = `${fromBank.bankName} (${fromBank.accountNumber.slice(-4)})`;
    } else {
      let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (!cashAcc || cashAcc.currentBalance < params.amount) throw new Error('Insufficient Cash In Hand');

      await tx.cashAccount.update({
        where: { id: 'cash-master' },
        data: { currentBalance: cashAcc.currentBalance - params.amount }
      });
    }

    // 2. Credit to Target
    let finalTargetBalance = 0;
    if (params.toAccountType === 'BANK') {
      if (!params.toAccountId) throw new Error('Target Bank Account ID required');
      const toBank = await tx.bankAccount.findUnique({ where: { id: params.toAccountId } });
      if (!toBank) throw new Error('Target bank account not found');

      const updatedTargetBank = await tx.bankAccount.update({
        where: { id: params.toAccountId },
        data: { currentBalance: toBank.currentBalance + params.amount }
      });
      toLabel = `${toBank.bankName} (${toBank.accountNumber.slice(-4)})`;
      finalTargetBalance = updatedTargetBank.currentBalance;
    } else {
      let cashAcc = await tx.cashAccount.findUnique({ where: { id: 'cash-master' } });
      if (!cashAcc) cashAcc = await tx.cashAccount.create({ data: { id: 'cash-master', name: 'Cash In Hand', currentBalance: 0 } });

      const updatedCash = await tx.cashAccount.update({
        where: { id: 'cash-master' },
        data: { currentBalance: cashAcc.currentBalance + params.amount }
      });
      finalTargetBalance = updatedCash.currentBalance;
    }

    const trsfCount = await tx.fundTransfer.count();
    const transferNo = `TRSF-${(trsfCount + 1001).toString()}`;

    const transferRecord = await tx.fundTransfer.create({
      data: {
        transferNo,
        amount: params.amount,
        fromAccountType: params.fromAccountType,
        fromAccountId: params.fromAccountId || null,
        toAccountType: params.toAccountType,
        toAccountId: params.toAccountId || null,
        referenceNo: params.referenceNo,
        remarks: params.remarks,
      }
    });

    // BUG-011 FIX: Create two ledger entries — debit on source, credit on target
    const ledgerCount = await tx.ledgerEntry.count();

    // Entry 1: DEBIT on source account
    await tx.ledgerEntry.create({
      data: {
        ledgerId: `LEDG-${(ledgerCount + 1001).toString()}`,
        transactionType: 'BANK_TRANSFER',
        referenceNo: `${transferNo}-OUT`,
        debit: params.amount,
        credit: 0,
        balanceAfter: 0, // Source balance after deduction (computed above)
        isCash: params.fromAccountType === 'CASH',
        bankAccountId: params.fromAccountType === 'BANK' ? params.fromAccountId : null,
        remarks: `Fund Transfer OUT: ₹${params.amount} from ${fromLabel} → ${toLabel}`,
      }
    });

    // Entry 2: CREDIT on target account
    await tx.ledgerEntry.create({
      data: {
        ledgerId: `LEDG-${(ledgerCount + 1002).toString()}`,
        transactionType: 'BANK_TRANSFER',
        referenceNo: `${transferNo}-IN`,
        debit: 0,
        credit: params.amount,
        balanceAfter: finalTargetBalance,
        isCash: params.toAccountType === 'CASH',
        bankAccountId: params.toAccountType === 'BANK' ? params.toAccountId : null,
        remarks: `Fund Transfer IN: ₹${params.amount} from ${fromLabel} → ${toLabel}`,
      }
    });

    await tx.auditLog.create({
      data: {
        userId: params.userId,
        username: params.username,
        action: 'CREATE',
        module: 'FINANCE',
        details: `Fund Transfer ${transferNo} of ₹${params.amount} (${fromLabel} -> ${toLabel})`,
      }
    });

    return transferRecord;
  });
}

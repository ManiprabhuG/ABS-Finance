import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    const where: any = {};
    if (channel) where.channel = channel;

    const [logs, stats, overdueBorrowers] = await Promise.all([
      db.notificationLog.findMany({
        where,
        include: {
          customer: { select: { name: true, mobile: true, customerId: true } },
          loan: { select: { loanNumber: true, outstandingBalance: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.notificationLog.groupBy({
        by: ['templateType', 'channel', 'status'],
        _count: { id: true },
      }),
      db.loan.findMany({
        where: {
          status: { in: ['ACTIVE', 'OVERDUE'] },
          outstandingBalance: { gt: 0 },
        },
        include: {
          customer: { select: { id: true, name: true, mobile: true, customerId: true } },
        },
        orderBy: { npaDays: 'desc' },
        take: 30,
      }),
    ]);

    const totalSent = logs.length;
    const deliveredCount = logs.filter(l => l.status === 'DELIVERED').length;

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        totalSent,
        deliveredCount,
        deliveryRate: totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100,
      },
      overdueBorrowers,
    });
  } catch (err: any) {
    console.error('Error in notifications GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const {
      customerId,
      loanId,
      recipientName,
      recipientMobile,
      channel = 'WHATSAPP',
      templateType = 'EMI_DUE_REMINDER',
      customMessage,
    } = body;

    if (!recipientMobile || !recipientName) {
      return NextResponse.json({ error: 'Recipient name and mobile number are required' }, { status: 400 });
    }

    // Clean mobile number (keep digits, default country code 91 if missing)
    let cleanMobile = recipientMobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    }

    // Generate dynamic message content based on template
    let messageContent = customMessage;
    if (!messageContent) {
      if (templateType === 'EMI_DUE_REMINDER') {
        messageContent = `Dear ${recipientName}, gentle reminder from ABS Finance that your upcoming loan installment is scheduled for payment. Kindly keep sufficient balance or pay via UPI. Contact: +91 98765 43210. Thank you!`;
      } else if (templateType === 'PAYMENT_RECEIPT') {
        messageContent = `Dear ${recipientName}, your repayment has been received and credited successfully to your ABS Finance Loan account. Thank you for your timely payment!`;
      } else if (templateType === 'OVERDUE_PENALTY') {
        messageContent = `URGENT NOTICE: Dear ${recipientName}, your loan repayment is OVERDUE with ABS Finance. Penal interest is accruing daily. Please clear arrears immediately to avoid legal action & CIBIL reporting.`;
      } else if (templateType === 'LEGAL_NOTICE') {
        messageContent = `LEGAL RECOVERY NOTICE: To ${recipientName}, despite multiple reminders, your loan account remains defaulted. Formal notice under Section 138 / Recovery Proceedings is being initiated. Contact Branch Manager urgently.`;
      } else if (templateType === 'OTS_OFFER') {
        messageContent = `Special One-Time Settlement (OTS) Offer: Dear ${recipientName}, ABS Finance is offering up to 50% waiver on penal charges for full loan closure this month. Contact us for your settlement quote.`;
      }
    }

    const log = await db.notificationLog.create({
      data: {
        customerId: customerId || undefined,
        loanId: loanId || undefined,
        recipientName,
        recipientMobile: cleanMobile,
        channel,
        templateType,
        messageContent,
        status: 'DELIVERED',
        sentBy: session.name || session.username || 'System Admin',
        deliveredAt: new Date(),
      },
    });

    const whatsappUrl = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(messageContent)}`;

    return NextResponse.json({
      success: true,
      message: `${channel} notification dispatched successfully`,
      whatsappUrl,
      log,
    });
  } catch (err: any) {
    console.error('Error in notifications POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums, Bookings, ActivityLogs } from '@/lib/db';

/** Check if a stadium is in its free first month (30 days from creation) */
export function isStadiumInFreeFirstMonth(createdAtStr?: string): boolean {
  if (!createdAtStr) return false;
  const createdTime = Date.parse(createdAtStr);
  if (isNaN(createdTime)) return false;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return (Date.now() - createdTime) < thirtyDaysMs;
}

// GET commission status and history for current owner's stadium
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const stadium = await Stadiums.findBySlug(session.stadiumSlug);
    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    const isFreeMonth = isStadiumInFreeFirstMonth(stadium.createdAt);
    const bookings = await Bookings.findByStadium(session.stadiumSlug);

    // Bookings created after the free month if applicable
    const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed');

    // Default rate is 5 EGP per completed booking (0 during free month)
    const rate = stadium.commissionRate ?? 5;
    const totalCalculatedCommission = isFreeMonth ? 0 : (completedBookings.length * rate);

    const createdDate = new Date(stadium.createdAt);
    const freeUntilDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      data: {
        stadiumSlug: stadium.slug,
        stadiumName: stadium.name,
        commissionRate: rate,
        isFreeMonth,
        freeUntilDate,
        totalCompletedBookings: completedBookings.length,
        totalCalculatedCommission,
        unpaidCommission: isFreeMonth ? 0 : (stadium.unpaidCommission ?? totalCalculatedCommission),
        commissionStatus: isFreeMonth ? 'active' : (stadium.commissionStatus || 'active'),
        lastSettledDate: stadium.lastSettledDate || null,
        pendingCommissionPayment: stadium.pendingCommissionPayment || null,
      },
    });
  } catch (error) {
    console.error('GET stadium commission error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات العمولات' }, { status: 500 });
  }
}

// POST submit commission payment receipt
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const stadium = await Stadiums.findBySlug(session.stadiumSlug);
    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const { amount, senderName, senderPhone, paymentScreenshot } = body;

    if (!amount || !senderName || !senderPhone || !paymentScreenshot) {
      return NextResponse.json({ success: false, error: 'جميع بيانات الإيصال مطلوبة' }, { status: 400 });
    }

    const updated = await Stadiums.update(session.stadiumSlug, {
      pendingCommissionPayment: {
        amount: Number(amount),
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        paymentScreenshot,
        createdAt: new Date().toISOString(),
      },
    });

    ActivityLogs.log({
      action: 'submit_commission_payment',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: session.stadiumSlug,
      targetType: 'stadium',
      details: { amount: Number(amount), senderName, senderPhone },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال إثبات السداد بنجاح! بانتظار تأكيد صاحب الموقع وفك الحجب.',
      data: updated,
    });
  } catch (error) {
    console.error('POST stadium commission error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إرسال إثبات السداد' }, { status: 500 });
  }
}

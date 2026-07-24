import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums, Bookings, ActivityLogs, PlatformSettingsDB } from '@/lib/db';

/** Check if a stadium is in its free first month (30 days from creation) */
export function isStadiumInFreeFirstMonth(createdAtStr?: string): boolean {
  if (!createdAtStr) return false;
  const createdTime = Date.parse(createdAtStr);
  if (isNaN(createdTime)) return false;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return (Date.now() - createdTime) < thirtyDaysMs;
}

/**
 * A booking is commission-eligible when:
 * 1. Status is 'completed', OR
 * 2. Status is 'confirmed' AND the booking date+endTime has already passed (booking happened in the past)
 * This prevents manipulation: owners can't cancel past bookings to avoid commission.
 */
export function isCommissionEligible(booking: { status: string; date: string; endTime: string }): boolean {
  if (booking.status === 'completed') return true;
  if (booking.status === 'confirmed') {
    // Check if booking time has already passed
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}`);
    return bookingEndDateTime.getTime() < Date.now();
  }
  return false;
}

// GET commission/billing status for current owner's stadium
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const [stadium, settings] = await Promise.all([
      Stadiums.findBySlug(session.stadiumSlug),
      PlatformSettingsDB.get(),
    ]);

    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    const isFreeMonth = isStadiumInFreeFirstMonth(stadium.createdAt);
    const bookings = await Bookings.findByStadium(session.stadiumSlug);

    // Commission-eligible: completed OR confirmed + time has passed
    const chargeableBookings = bookings.filter(b => isCommissionEligible(b));

    const rate = stadium.commissionRate ?? settings.defaultCommissionRate ?? 5;
    const totalCalculatedCommission = isFreeMonth ? 0 : (chargeableBookings.length * rate);

    const createdDate = new Date(stadium.createdAt);
    const freeUntilDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Unpaid = max of stored unpaid vs freshly calculated (so it never decreases without admin approval)
    const storedUnpaid = stadium.unpaidCommission ?? 0;
    const unpaidCommission = isFreeMonth ? 0 : Math.max(storedUnpaid, totalCalculatedCommission);

    return NextResponse.json({
      success: true,
      data: {
        billingMode: settings.billingMode || 'commission',
        monthlySubscriptionPrice: settings.monthlySubscriptionPrice ?? 200,
        stadiumSlug: stadium.slug,
        stadiumName: stadium.name,
        commissionRate: rate,
        isFreeMonth,
        freeUntilDate,
        totalCompletedBookings: chargeableBookings.length,
        totalCalculatedCommission,
        unpaidCommission,
        commissionStatus: stadium.commissionStatus === 'blocked' ? 'blocked' : 'active',
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

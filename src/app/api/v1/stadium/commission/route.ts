import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums, Bookings, ActivityLogs, PlatformSettingsDB } from '@/lib/db';

/** Check if a stadium is currently in a free trial / free month period */
export function isStadiumInFreeTrial(stadium?: { createdAt?: string; freeTrialUntil?: string | null; subscriptionStatus?: string } | null): boolean {
  if (!stadium) return false;

  if (stadium.freeTrialUntil !== undefined) {
    if (!stadium.freeTrialUntil) return false; // Explicitly null or empty = free trial deleted/cancelled
    const trialEndTime = Date.parse(stadium.freeTrialUntil);
    if (isNaN(trialEndTime)) return false;
    return trialEndTime > Date.now();
  }

  if (stadium.subscriptionStatus === 'trial') return true;
  if (!stadium.createdAt) return false;
  const createdTime = Date.parse(stadium.createdAt);
  if (isNaN(createdTime)) return false;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return (Date.now() - createdTime) < thirtyDaysMs;
}

/** Get the ISO timestamp string for free trial expiration date */
export function getFreeTrialUntilDate(stadium?: { createdAt?: string; freeTrialUntil?: string | null } | null): string | null {
  if (!stadium) return null;
  if (stadium.freeTrialUntil !== undefined) {
    return stadium.freeTrialUntil || null;
  }
  if (!stadium.createdAt) return null;
  const createdTime = Date.parse(stadium.createdAt);
  if (isNaN(createdTime)) return null;
  return new Date(createdTime + 30 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Get the date from which commissions should start being counted.
 * If stadium has a commissionStartDate set (free trial was manually removed),
 * use that. Otherwise fall back to freeTrialUntil or createdAt + 30 days.
 */
export function getCommissionStartDate(stadium?: {
  createdAt?: string;
  freeTrialUntil?: string | null;
  commissionStartDate?: string | null;
} | null): string | null {
  if (!stadium) return null;
  // If admin explicitly set when commissions start (after removing free trial)
  if (stadium.commissionStartDate) return stadium.commissionStartDate;
  // If free trial was never set, commissions start from creation
  if (stadium.freeTrialUntil === null) return stadium.createdAt || null;
  // If free trial end date exists, commissions start after that
  const trialEnd = getFreeTrialUntilDate(stadium);
  return trialEnd;
}

/** Check if a stadium is in its free first month (30 days from creation) */
export function isStadiumInFreeFirstMonth(createdAtStr?: string): boolean {
  return isStadiumInFreeTrial({ createdAt: createdAtStr });
}

/**
 * A booking is commission-eligible when:
 * 1. Status is 'completed', OR
 * 2. Status is 'confirmed' AND the booking date+endTime has already passed (booking happened in the past)
 * AND the booking was created AFTER the commission start date (not during the free trial period)
 * This prevents manipulation: owners can't cancel past bookings to avoid commission.
 */
export function isCommissionEligible(
  booking: { status: string; date: string; endTime: string; createdAt?: string },
  commissionStartDate?: string | null
): boolean {
  // Check if booking falls within free trial period
  if (commissionStartDate) {
    const startMs = Date.parse(commissionStartDate);
    if (!isNaN(startMs)) {
      // Use booking createdAt if available, otherwise booking date
      const bookingTime = booking.createdAt
        ? Date.parse(booking.createdAt)
        : Date.parse(booking.date);
      if (!isNaN(bookingTime) && bookingTime < startMs) {
        return false; // Booking was made during free trial – not commission-eligible
      }
    }
  }

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

    const isFreeMonth = isStadiumInFreeTrial(stadium);
    const freeUntilDate = getFreeTrialUntilDate(stadium);
    const commissionStartDate = getCommissionStartDate(stadium);
    const bookings = await Bookings.findByStadium(session.stadiumSlug);

    // Commission-eligible: completed OR confirmed + time has passed, AND created after commission start date
    const chargeableBookings = bookings.filter(b => isCommissionEligible(b, commissionStartDate));


    const rate = stadium.commissionRate ?? settings.defaultCommissionRate ?? 5;
    const totalCalculatedCommission = isFreeMonth ? 0 : (chargeableBookings.length * rate);

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

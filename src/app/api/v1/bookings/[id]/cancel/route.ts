import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, Notifications, Fields, ActivityLogs } from '@/lib/db';
import { formatTime } from '@/lib/utils';

/** Check if booking date & end time has already passed */
function hasBookingTimePassed(dateStr: string, endTimeStr: string, startTimeStr?: string): boolean {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const [startH] = (startTimeStr || '00:00').split(':').map(Number);

    // If endTime is 00:00 or less than startTime, it ends on the NEXT calendar day (overnight)
    const isOvernight = endTimeStr === '00:00' || endH < startH;
    
    // Create target end Date
    const targetDate = new Date(y, m - 1, isOvernight ? d + 1 : d, endH, endM, 0);
    return Date.now() > targetDate.getTime();
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await Bookings.findById(id);
    if (!booking || booking.stadiumSlug !== session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود أو لا تملك صلاحية إلغائه' }, { status: 404 });
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return NextResponse.json({ success: false, error: 'الحجز ملغي أو مرفوض بالفعل' }, { status: 400 });
    }

    // Anti-Fraud Check: Prevent cancelling bookings whose time has already passed!
    if (hasBookingTimePassed(booking.date, booking.endTime, booking.startTime)) {
      return NextResponse.json({
        success: false,
        error: '⚠️ لا يمكن إلغاء حجز انقضى موعده وزمنه بالفعل لمنع التلاعب بالعمولات. إذا كان هناك إلغاء طارئ، يرجى التواصل مع إدارة المنصة.',
      }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || 'تم الإلغاء من قِبل صاحب الملعب';

    const updated = await Bookings.update(id, {
      status: 'cancelled',
      rejectionReason: reason,
    });

    const field = await Fields.findById(booking.fieldId);

    // Notify (in-system log)
    await Notifications.create({
      stadiumSlug: booking.stadiumSlug,
      type: 'booking_rejected',
      title: 'تم إلغاء حجز ❌',
      message: `تم إلغاء حجز ${booking.customerName} لـ ${field?.name || 'الملعب'} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}. السبب: ${reason}`,
      bookingId: booking.id,
      isRead: false,
    });

    ActivityLogs.log({
      action: 'cancel_booking',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'booking',
      details: { customerName: booking.customerName, reason, antiFraudChecked: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إلغاء الحجز' }, { status: 500 });
  }
}

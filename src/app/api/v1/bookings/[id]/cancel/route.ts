import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, Notifications, Fields, ActivityLogs } from '@/lib/db';
import { formatTime } from '@/lib/utils';

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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || 'تم الإلغاء من قِبل صاحب الملعب';

    const updated = await Bookings.update(id, {
      status: 'cancelled',
      rejectionReason: reason,
    });

    const field = await Fields.findById(booking.fieldId);

    // Notify (in-system log — no external SMS)
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
      details: { customerName: booking.customerName, reason },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إلغاء الحجز' }, { status: 500 });
  }
}

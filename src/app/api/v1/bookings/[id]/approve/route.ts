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
      return NextResponse.json({ success: false, error: 'الحجز غير موجود أو لا تملك صلاحية مراجعته' }, { status: 404 });
    }

    if (booking.status !== 'pending' && booking.status !== 'cancelled' && booking.status !== 'rejected') {
      return NextResponse.json({ success: false, error: 'هذا الحجز لا يمكن إعادة تفعيله أو تأكيده' }, { status: 400 });
    }

    // Double check conflict before confirming (prevents race conditions)
    const hasConflict = await Bookings.hasConflict(booking.fieldId, booking.date, booking.startTime, booking.endTime, booking.id);
    if (hasConflict) {
      // Auto-reject or notify conflict
      return NextResponse.json({
        success: false,
        error: 'تعذر تأكيد الحجز لوجود حجز مؤكد آخر متعارض في نفس التوقيت.'
      }, { status: 409 });
    }

    const updated = await Bookings.update(id, { status: 'confirmed' });
    const field = await Fields.findById(booking.fieldId);

    // Create client-facing notification (simulated in DB)
    await Notifications.create({
      stadiumSlug: booking.stadiumSlug,
      type: 'booking_approved',
      title: 'تم تأكيد حجزك بنجاح! 🎉',
      message: `تمت الموافقة على حجزك لـ ${field?.name || 'الملعب'} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}`,
      bookingId: booking.id,
      isRead: false,
    });

    ActivityLogs.log({
      action: 'approve_booking',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'booking',
      details: { customerName: booking.customerName, amount: booking.amount },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Approve booking error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تأكيد الحجز' }, { status: 500 });
  }
}

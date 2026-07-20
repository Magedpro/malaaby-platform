import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, Notifications, Fields, ActivityLogs, Stadiums } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import { sendEmail, getBookingStatusTemplate } from '@/lib/email';

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
      return NextResponse.json({
        success: false,
        error: 'تعذر تأكيد الحجز لوجود حجز مؤكد آخر متعارض في نفس التوقيت.'
      }, { status: 409 });
    }

    const updated = await Bookings.update(id, { status: 'confirmed' });
    const field = await Fields.findById(booking.fieldId);
    const stadium = await Stadiums.findBySlug(booking.stadiumSlug);

    // Create client-facing notification (simulated in DB)
    await Notifications.create({
      stadiumSlug: booking.stadiumSlug,
      type: 'booking_approved',
      title: 'تم تأكيد حجزك بنجاح! 🎉',
      message: `تمت الموافقة على حجزك لـ ${field?.name || 'الملعب'} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}`,
      bookingId: booking.id,
      isRead: false,
    });

    // Send customer email if provided
    const b = booking as any;
    if (b.customerEmail) {
      const emailHtml = getBookingStatusTemplate(
        booking.customerName,
        stadium?.name || 'الملعب',
        booking.date,
        `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`,
        'approved'
      );
      sendEmail({
        to: b.customerEmail,
        subject: `تم تأكيد حجزك بنجاح! 🎉 - ${stadium?.name || 'الملعب'}`,
        html: emailHtml
      }).catch(err => console.error('[Email Approve Notification Error]:', err));
    }

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

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

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'الحجز ليس معلقاً للمراجعة' }, { status: 400 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'يجب كتابة سبب الرفض بوضوح' }, { status: 400 });
    }

    const updated = await Bookings.update(id, {
      status: 'rejected',
      rejectionReason: reason.trim(),
    });
    const field = await Fields.findById(booking.fieldId);
    const stadium = await Stadiums.findBySlug(booking.stadiumSlug);

    // Create client-facing notification
    await Notifications.create({
      stadiumSlug: booking.stadiumSlug,
      type: 'booking_rejected',
      title: 'عذراً، تم رفض طلب حجزك ❌',
      message: `تم رفض حجزك لـ ${field?.name || 'الملعب'} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}. السبب: ${reason.trim()}`,
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
        'rejected',
        reason.trim()
      );
      sendEmail({
        to: b.customerEmail,
        subject: `تحديث بخصوص طلب حجزك ❌ - ${stadium?.name || 'الملعب'}`,
        html: emailHtml
      }).catch(err => console.error('[Email Reject Notification Error]:', err));
    }

    ActivityLogs.log({
      action: 'reject_booking',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'booking',
      details: { customerName: booking.customerName, reason: reason.trim() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Reject booking error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء رفض الحجز' }, { status: 500 });
  }
}

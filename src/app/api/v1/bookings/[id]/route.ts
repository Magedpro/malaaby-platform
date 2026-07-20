import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, ActivityLogs } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await Bookings.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    // Tenant check: owner must only view their own bookings
    const session = await getSession();
    if (session && session.role === 'owner' && session.stadiumSlug !== booking.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بمشاهدة هذا الحجز' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('GET booking id error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات الحجز' }, { status: 500 });
  }
}

// Cancel booking (can be done by owner or client if supported, here protected for owner/admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await Bookings.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    if (session.role === 'owner' && session.stadiumSlug !== booking.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'لا تملك صلاحية تعديل هذا الحجز' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== 'cancelled') {
      return NextResponse.json({ success: false, error: 'تغيير الحالة غير مدعوم عبر هذا الرابط' }, { status: 400 });
    }

    const updated = await Bookings.update(id, { status: 'cancelled' });

    ActivityLogs.log({
      action: 'cancel_booking',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'booking',
      details: { customerName: booking.customerName, status: 'cancelled' },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT booking error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إلغاء الحجز' }, { status: 500 });
  }
}

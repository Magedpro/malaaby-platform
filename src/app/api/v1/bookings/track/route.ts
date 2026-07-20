import { NextRequest, NextResponse } from 'next/server';
import { Bookings, Fields } from '@/lib/db';

/**
 * GET /api/v1/bookings/track?phone=01012345678&stadiumSlug=tarek
 * Public endpoint — no auth required.
 * Returns all bookings for a given phone number at a specific stadium.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const phone = searchParams.get('phone')?.trim();
    const stadiumSlug = searchParams.get('stadiumSlug')?.trim();

    if (!phone || !stadiumSlug) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف ومعرّف الملعب مطلوبان' },
        { status: 400 }
      );
    }

    // Basic Egyptian phone validation
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^01[0-2,5]\d{8}$/.test(phoneClean)) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف غير صحيح' },
        { status: 400 }
      );
    }

    const allBookings = await Bookings.findByStadium(stadiumSlug);
    const customerBookings = allBookings.filter(
      (b) => b.customerPhone.replace(/\s/g, '') === phoneClean
    );

    // Enrich with field name
    const enriched = await Promise.all(
      customerBookings.map(async (b) => {
        const field = await Fields.findById(b.fieldId);
        return { ...b, fieldName: field?.name || 'ملعب غير محدد' };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Track bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب بيانات الحجز' },
      { status: 500 }
    );
  }
}

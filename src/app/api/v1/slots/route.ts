import { NextRequest, NextResponse } from 'next/server';
import { Fields, generateTimeSlots } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fieldId = searchParams.get('fieldId');
    const date = searchParams.get('date');

    if (!fieldId || !date) {
      return NextResponse.json({ success: false, error: 'fieldId و date مطلوبان' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'صيغة التاريخ غير صحيحة' }, { status: 400 });
    }

    const field = await Fields.findById(fieldId);
    if (!field) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    if (field.status !== 'available') {
      return NextResponse.json({ success: true, data: [], message: 'الملعب غير متاح للحجز حالياً' });
    }

    // Check if date is in the past
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return NextResponse.json({ success: true, data: [], message: 'لا يمكن الحجز في تاريخ سابق' });
    }

    const slots = await generateTimeSlots(field, date);
    return NextResponse.json({ success: true, data: slots });
  } catch (e) {
    console.error('Slots API error:', e);
    return NextResponse.json({ success: false, error: 'خطأ في جلب المواعيد المتاحة' }, { status: 500 });
  }
}

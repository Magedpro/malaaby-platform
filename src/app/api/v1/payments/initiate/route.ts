import { NextRequest, NextResponse } from 'next/server';
import { Bookings, Fields, Stadiums } from '@/lib/db';
import { initiatePaymobPayment } from '@/lib/paymob';
import { generateId, getTodayString } from '@/lib/utils';
import { validateBooking } from '@/lib/validations';
import { TOTAL_DEDUCTION_EGP, PLATFORM_COMMISSION_EGP, PAYMOB_FEE_FLAT_EGP } from '@/lib/constants';
import { APP_URL } from '@/lib/constants';

/**
 * POST /api/v1/payments/initiate
 *
 * Creates a booking with status=payment_pending, then initiates a PayMob
 * payment session and returns the checkout URL.
 *
 * Body:
 *   fieldId, stadiumSlug, date, startTime, endTime,
 *   customerName, customerPhone, customerEmail?, notes?
 *
 * Response:
 *   { success: true, checkoutUrl: string, bookingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fieldId, stadiumSlug, date, startTime, endTime,
      customerName, customerPhone, customerEmail, notes, paymentMethod,
    } = body;

    // ── 1. Basic validation ───────────────────────────────────────────────
    if (!fieldId || !stadiumSlug || !date || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'بيانات ناقصة — يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    if (!/^01[0-2,5]\d{8}$/.test(customerPhone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف غير صحيح — يجب أن يبدأ بـ 01 ويتكون من 11 رقماً' },
        { status: 400 }
      );
    }

    // ── 2. Verify stadium & field exist and are active ────────────────────
    const stadium = await Stadiums.findBySlug(stadiumSlug);
    if (!stadium || !stadium.isActive) {
      return NextResponse.json(
        { success: false, error: 'الملعب غير موجود أو غير مفعل' },
        { status: 404 }
      );
    }

    if (stadium.subscriptionStatus === 'expired') {
      return NextResponse.json(
        { success: false, error: 'عذراً، تم إيقاف استقبال حجوزات جديدة مؤقتاً لانتهاء فترة اشتراك الملعب.' },
        { status: 403 }
      );
    }

    const fieldObj = await Fields.findById(fieldId);
    if (!fieldObj) {
      return NextResponse.json(
        { success: false, error: 'الملعب المحدد غير موجود' },
        { status: 404 }
      );
    }

    // ── 3. Conflict detection ─────────────────────────────────────────────
    const todayStr = getTodayString();
    if (date < todayStr) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن الحجز في تاريخ سابق' },
        { status: 400 }
      );
    }

    const hasConflict = await Bookings.hasConflict(fieldId, date, startTime, endTime);
    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: 'عذراً، هذا الوقت محجوز بالفعل! يرجى اختيار وقت آخر.' },
        { status: 409 }
      );
    }

    // ── 4. Calculate amount ───────────────────────────────────────────────
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const amount = Math.round((fieldObj.pricePerHour * durationMinutes) / 60);
    const netAmount = Math.max(amount - TOTAL_DEDUCTION_EGP, 0);

    // ── 5. Create booking with payment_pending status ─────────────────────
    const booking = await Bookings.create({
      fieldId,
      stadiumSlug,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || undefined,
      notes: notes?.trim() || '',
      date,
      startTime,
      endTime,
      amount,
      netAmount,
      commissionAmount: PLATFORM_COMMISSION_EGP,
      paymentScreenshot: '',
      status: 'payment_pending',
    });

    // ── 6. Initiate PayMob payment ────────────────────────────────────────
    let checkoutUrl: string;
    let paymobOrderId: number;

    try {
      const result = await initiatePaymobPayment({
        amountEGP: amount,
        bookingId: booking.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim(),
        paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'card',
      });
      checkoutUrl = result.checkoutUrl;
      paymobOrderId = result.paymobOrderId;
    } catch (paymobErr) {
      // Clean up the pending booking if PayMob fails
      console.error('[PayMob] Failed to initiate payment:', paymobErr);
      // Update booking to payment_failed
      await Bookings.update(booking.id, { status: 'payment_failed' });
      return NextResponse.json(
        { success: false, error: 'فشل الاتصال ببوابة الدفع، يرجى المحاولة مجدداً' },
        { status: 502 }
      );
    }

    // ── 7. Save PayMob order ID to booking ───────────────────────────────
    await Bookings.update(booking.id, {
      paymobOrderId: String(paymobOrderId),
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      checkoutUrl,
      amount,
      netAmount,
    });

  } catch (error: any) {
    console.error('[Payment Initiate] Error:', error);
    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'عذراً، هذا الوقت تم حجزه للتو من شخص آخر! يرجى اختيار وقت آخر.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء بدء عملية الدفع، يرجى المحاولة مجدداً' },
      { status: 500 }
    );
  }
}

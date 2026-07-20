import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, Fields, Notifications, Stadiums, ActivityLogs } from '@/lib/db';
import { validateBooking } from '@/lib/validations';
import { formatTime } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/push';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const fieldId = searchParams.get('fieldId');
    const query = searchParams.get('query'); // search customer name or phone

    let bookingsList = await Bookings.findByStadium(session.stadiumSlug);

    // Apply filters
    if (date) {
      bookingsList = bookingsList.filter((b) => b.date === date);
    }
    if (status) {
      bookingsList = bookingsList.filter((b) => b.status === status);
    }
    if (fieldId) {
      bookingsList = bookingsList.filter((b) => b.fieldId === fieldId);
    }
    if (query) {
      const q = query.toLowerCase().trim();
      bookingsList = bookingsList.filter(
        (b) =>
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q)
      );
    }

    return NextResponse.json({ success: true, data: bookingsList });
  } catch (error) {
    console.error('GET bookings API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات الحجوزات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate inputs
    const validation = validateBooking(body);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const {
      fieldId, date, startTime, endTime,
      customerName, customerPhone, notes,
      paymentScreenshot, stadiumSlug
    } = body;

    // Resolve stadium slug (from session if owner, or from body if customer booking public page)
    let slug = stadiumSlug;
    const session = await getSession();
    const isOwner = session && session.role === 'owner';

    if (!isOwner && (!paymentScreenshot || typeof paymentScreenshot !== 'string' || paymentScreenshot.trim() === '')) {
      return NextResponse.json({ success: false, error: 'صورة إيصال التحويل مطلوبة لتأكيد الحجز' }, { status: 400 });
    }

    if (!slug) {
      // Look up via field
      const fieldObj = await Fields.findById(fieldId);
      if (!fieldObj) {
        return NextResponse.json({ success: false, error: 'الملعب المحدد غير موجود' }, { status: 404 });
      }
      slug = fieldObj.stadiumSlug;
    }

    // Verify Stadium is active and subscription is active
    const stadium = await Stadiums.findBySlug(slug);
    if (!stadium || !stadium.isActive) {
      return NextResponse.json({ success: false, error: 'الموقع المطلوب غير مفعل حالياً' }, { status: 403 });
    }

    if (stadium.subscriptionStatus === 'expired') {
      return NextResponse.json({
        success: false,
        error: 'عذراً، تم إيقاف استقبال حجوزات جديدة مؤقتاً لانتهاء فترة اشتراك الملعب.'
      }, { status: 403 });
    }

    // 2. Conflict Detection (Double booking prevention)
    const hasConflict = await Bookings.hasConflict(fieldId, date, startTime, endTime);
    if (hasConflict) {
      return NextResponse.json({
        success: false,
        error: 'عذراً، هذا الوقت محجوز بالفعل! يرجى اختيار وقت آخر.'
      }, { status: 409 });
    }

    // 3. Compute cost/amount
    const fieldObj = await Fields.findById(fieldId);
    if (!fieldObj) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const amount = (fieldObj.pricePerHour * durationMinutes) / 60;

    // 4. Create Booking
    const booking = await Bookings.create({
      fieldId,
      stadiumSlug: slug,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: (notes || '').trim(),
      date,
      startTime,
      endTime,
      amount,
      paymentScreenshot: paymentScreenshot || '',
      status: 'pending', // All bookings start as pending and require approval
    });

    // 5. Notify owner
    await Notifications.create({
      stadiumSlug: slug,
      type: 'new_booking',
      title: 'طلب حجز جديد ⚽',
      message: `قام اللاعب ${booking.customerName} بطلب حجز لـ ${fieldObj.name} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}`,
      bookingId: booking.id,
      isRead: false,
    });

    // 5.5 Send WhatsApp alert via CallMeBot (if enabled)
    const prefs = stadium.notificationPrefs || { whatsapp: true, email: true, browser: true };
    const recipientPhone = stadium?.whatsapp || stadium?.phone;
    
    if (prefs.whatsapp && stadium.callmebotApiKey && recipientPhone) {
      let cleanPhone = recipientPhone.replace(/\D/g, ''); // Ensure only numbers
      // Auto-correct Egyptian local number format to international
      if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
        cleanPhone = '2' + cleanPhone; // e.g. 01126947405 -> 201126947405
      }
      
      if (cleanPhone) {
        const textMsg = `*حجز جديد بانتظار موافقتك ⚽*\n\nالاسم: ${booking.customerName}\nالملعب: ${fieldObj.name}\nاليوم: ${booking.date}\nالوقت: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}\nالقيمة: ${booking.amount} ج.م.\n\nيرجى الدخول للوحة التحكم لمراجعة وتأكيد أو رفض الحجز.`;
        const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}&apikey=${stadium.callmebotApiKey}`;
        
        console.log(`[CallMeBot] Attempting to send WhatsApp message to ${cleanPhone}...`);
        
        fetch(callmebotUrl)
          .then(async (res) => {
            const bodyText = await res.text();
            if (res.ok) {
              console.log('[CallMeBot] Notification sent successfully:', bodyText);
            } else {
              console.error('[CallMeBot] API returned error status:', res.status, bodyText);
            }
          })
          .catch(err => console.error('[CallMeBot] Network request failed:', err));
      }
    }

    // 5.6 Send Email notification (if enabled)
    const recipientEmail = stadium.notificationEmail || stadium.email;
    if (prefs.email && recipientEmail) {
      const emailHtml = `
        <div style="direction: rtl; text-align: right; font-family: Cairo, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #fcfcfc;">
          <h2 style="color: #2b8259;">⚽ طلب حجز جديد بانتظار موافقتك</h2>
          <p>أهلاً بك، هناك لاعب قام بإنشاء طلب حجز جديد على ملعبك <strong>${stadium.name}</strong>:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">اسم العميل:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">رقم الهاتف:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.customerPhone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">الملعب:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${fieldObj.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">التاريخ والوقت:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.date} | ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">المبلغ الإجمالي:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.amount} ج.م.</td>
            </tr>
          </table>
          <p style="margin-top: 25px;">يرجى التوجه إلى لوحة التحكم لتأكيد الحجز أو إلغائه.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/bookings" style="display: inline-block; background-color: #2b8259; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 10px;">الانتقال للوحة التحكم الحجوزات ↗</a>
        </div>
      `;
      sendEmail({
        to: recipientEmail,
        subject: `طلب حجز جديد ⚽ - ${booking.customerName}`,
        html: emailHtml
      }).catch(err => console.error('[Email] Notification send failed:', err));
    }

    // 5.7 Send Browser Push notification (if enabled)
    if (prefs.browser && stadium.pushSubscriptions && stadium.pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: 'طلب حجز جديد ⚽',
        body: `قام ${booking.customerName} بحجز ${fieldObj.name} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}`,
        url: '/dashboard/bookings'
      });
      
      const expiredSubscriptions: string[] = [];
      const subs = stadium.pushSubscriptions || [];
      const pushPromises = subs.map(async (sub: any) => {
        const result = await sendPushNotification(sub, payload);
        if (result.expired) {
          expiredSubscriptions.push(sub.endpoint);
        }
      });
      
      Promise.all(pushPromises).then(async () => {
        if (expiredSubscriptions.length > 0) {
          console.log(`[Push] Cleaning up ${expiredSubscriptions.length} expired subscriptions...`);
          const activeSubs = subs.filter((s: any) => !expiredSubscriptions.includes(s.endpoint));
          await Stadiums.update(slug, { pushSubscriptions: activeSubs });
        }
      }).catch(err => console.error('[Push] Browser notifications broadcast error:', err));
    }

    // 6. Log activity
    ActivityLogs.log({
      action: 'create_booking',
      performedBy: session?.userId || 'customer',
      performedByName: session?.name || 'لاعب خارجي',
      targetId: booking.id,
      targetType: 'booking',
      details: {
        customerName: booking.customerName,
        date: booking.date,
        amount: booking.amount,
        status: booking.status,
      },
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });

  } catch (error) {
    console.error('POST bookings API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إتمام عملية الحجز' }, { status: 500 });
  }
}

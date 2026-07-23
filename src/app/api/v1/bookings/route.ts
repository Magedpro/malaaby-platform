import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, Fields, Notifications, Stadiums, ActivityLogs } from '@/lib/db';
import { validateBooking } from '@/lib/validations';
import { formatTime } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/push';
import { APP_URL } from '@/lib/constants';

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
      customerName, customerPhone, customerEmail, notes,
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
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
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
      const dashboardUrl = `${APP_URL}/dashboard/bookings`;

      // Build payment screenshot section (only if a screenshot was uploaded)
      const screenshotHtml = booking.paymentScreenshot
        ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f0faf5; border: 1px solid #a8d5b8; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2b8259;">📎 إيصال التحويل المرفق من العميل:</p>
            <a href="${booking.paymentScreenshot}" target="_blank" style="display: block;">
              <img src="${booking.paymentScreenshot}" alt="إيصال التحويل" style="max-width: 100%; border-radius: 6px; border: 1px solid #ccc;" />
            </a>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">انقر على الصورة لعرضها بالحجم الكامل</p>
          </div>`
        : `<p style="margin-top: 15px; color: #c0392b; font-weight: bold;">⚠️ لم يتم إرفاق إيصال تحويل مع هذا الطلب.</p>`;

      const emailHtml = `
        <div style="direction: rtl; text-align: right; font-family: Cairo, Arial, sans-serif; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 620px; margin: 0 auto; background-color: #fcfcfc;">
          <div style="background: linear-gradient(135deg, #2b8259, #1a5c3e); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">⚽ طلب حجز جديد بانتظار موافقتك</h2>
            <p style="color: #c8e6c9; margin: 6px 0 0 0; font-size: 14px;">منصة ملعبي — إشعار تلقائي</p>
          </div>

          <p style="color: #333;">أهلاً بك، هناك لاعب قام بإنشاء طلب حجز جديد على ملعبك <strong>${stadium.name}</strong>:</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: #444; width: 40%;">👤 اسم العميل</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; color: #222;">${booking.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: #444;">📞 رقم الهاتف</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; color: #222;">${booking.customerPhone}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: #444;">🏟️ الملعب</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; color: #222;">${fieldObj.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: #444;">📅 التاريخ والوقت</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; color: #222;">${booking.date} | ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px 12px; font-weight: bold; color: #444;">💰 المبلغ الإجمالي</td>
              <td style="padding: 10px 12px; color: #2b8259; font-weight: bold; font-size: 16px;">${booking.amount} ج.م.</td>
            </tr>
          </table>

          ${screenshotHtml}

          <div style="margin-top: 25px; text-align: center; padding: 10px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #2b8259; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; letter-spacing: 0.5px;">
              🔗 الانتقال للوحة التحكم — الحجوزات
            </a>
          </div>

          <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
            هذا البريد أُرسل تلقائياً من منصة ملعبي. يرجى عدم الرد على هذا البريد.
          </p>
        </div>
      `;
      sendEmail({
        to: recipientEmail,
        subject: `طلب حجز جديد ⚽ - ${booking.customerName} — ${fieldObj.name}`,
        html: emailHtml
      }).catch(err => console.error('[Email] Notification send failed:', err));
    }

    // 5.7 Send Browser Push notification (if enabled)
    if (prefs.browser && stadium.pushSubscriptions && stadium.pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: 'طلب حجز جديد ⚽',
        body: `قام ${booking.customerName} بحجز ${fieldObj.name} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}`,
        url: `${APP_URL}/dashboard/bookings`
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

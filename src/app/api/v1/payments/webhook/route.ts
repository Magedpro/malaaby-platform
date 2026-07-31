import { NextRequest, NextResponse } from 'next/server';
import { Bookings, Notifications, Fields, Stadiums, Users, ActivityLogs } from '@/lib/db';
import { verifyPaymobHMAC } from '@/lib/paymob';
import { formatTime } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/push';
import { APP_URL } from '@/lib/constants';

/**
 * POST /api/v1/payments/webhook
 *
 * PayMob Transaction Processed Callback.
 * Called by PayMob after every payment attempt (success or failure).
 *
 * PayMob sends the callback as form-urlencoded (GET redirect) OR as a
 * JSON POST body. We handle both the redirect and the server-to-server
 * notification here.
 *
 * Security: We verify the HMAC before processing anything.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── 1. Verify HMAC ────────────────────────────────────────────────────
    // PayMob sends the hmac in the query params on the redirect URL,
    // but also embeds it in the JSON body for server callbacks.
    const hmac = request.nextUrl.searchParams.get('hmac') || body.hmac;

    // Build flat params map for HMAC verification
    const txn = body?.obj || body;
    const flatParams: Record<string, string> = {
      amount_cents: String(txn.amount_cents ?? ''),
      created_at: String(txn.created_at ?? ''),
      currency: String(txn.currency ?? ''),
      error_occured: String(txn.error_occured ?? ''),
      has_parent_transaction: String(txn.has_parent_transaction ?? ''),
      id: String(txn.id ?? ''),
      integration_id: String(txn.integration_id ?? ''),
      is_3d_secure: String(txn.is_3d_secure ?? ''),
      is_auth: String(txn.is_auth ?? ''),
      is_capture: String(txn.is_capture ?? ''),
      is_refunded: String(txn.is_refunded ?? ''),
      is_standalone_payment: String(txn.is_standalone_payment ?? ''),
      is_voided: String(txn.is_voided ?? ''),
      order: String(txn.order?.id ?? ''),
      owner: String(txn.owner ?? ''),
      pending: String(txn.pending ?? ''),
      'source_data.pan': String(txn.source_data?.pan ?? ''),
      'source_data.sub_type': String(txn.source_data?.sub_type ?? ''),
      'source_data.type': String(txn.source_data?.type ?? ''),
      success: String(txn.success ?? ''),
      hmac: hmac ?? '',
    };

    const isValidHMAC = verifyPaymobHMAC(flatParams);
    if (!isValidHMAC) {
      console.error('[PayMob Webhook] HMAC verification failed — rejecting request');
      return NextResponse.json({ success: false, error: 'Invalid HMAC' }, { status: 401 });
    }

    // ── 2. Extract transaction data ───────────────────────────────────────
    const isSuccess = txn.success === true || txn.success === 'true';
    const paymobOrderId = String(txn.order?.merchant_order_id || txn.order?.id || '');
    const paymobTransactionId = String(txn.id || '');

    if (!paymobOrderId) {
      return NextResponse.json({ success: false, error: 'No order ID in webhook' }, { status: 400 });
    }

    // ── 3. Find booking by ID (merchant_order_id = our booking ID) ────────
    const booking = await Bookings.findById(paymobOrderId);
    if (!booking) {
      console.error(`[PayMob Webhook] Booking not found: ${paymobOrderId}`);
      // Return 200 to prevent PayMob from retrying endlessly
      return NextResponse.json({ success: true, message: 'Booking not found — ignored' });
    }

    // ── 4. Idempotency: already processed ────────────────────────────────
    if (booking.status === 'confirmed' || booking.status === 'payment_failed') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // ── 5. Update booking status ──────────────────────────────────────────
    const newStatus = isSuccess ? 'confirmed' : 'payment_failed';
    await Bookings.update(booking.id, {
      status: newStatus,
      paymobOrderId: paymobTransactionId || booking.paymobOrderId,
    });

    // Only send notifications on success
    if (!isSuccess) {
      console.log(`[PayMob Webhook] Payment FAILED for booking ${booking.id}`);
      return NextResponse.json({ success: true });
    }

    console.log(`[PayMob Webhook] Payment SUCCESS for booking ${booking.id} — sending notifications`);

    // ── 6. Fetch related data for notifications ───────────────────────────
    const [stadium, fieldObj] = await Promise.all([
      Stadiums.findBySlug(booking.stadiumSlug),
      Fields.findById(booking.fieldId),
    ]);

    if (!stadium || !fieldObj) {
      console.error('[PayMob Webhook] Stadium or field not found for notifications');
      return NextResponse.json({ success: true });
    }

    // ── 7. Create in-app notification ─────────────────────────────────────
    await Notifications.create({
      stadiumSlug: booking.stadiumSlug,
      type: 'booking_approved',
      title: '💳 حجز مؤكد بالدفع الإلكتروني ⚽',
      message: `تم تأكيد حجز ${booking.customerName} لـ ${fieldObj.name} يوم ${booking.date} الساعة ${formatTime(booking.startTime)} — الدفع ببطاقة/فوري`,
      bookingId: booking.id,
      isRead: false,
    });

    // ── 8. Send WhatsApp notification (CallMeBot) ─────────────────────────
    const prefs = stadium.notificationPrefs || { whatsapp: true, email: true, browser: true };
    const recipientPhone = stadium?.whatsapp || stadium?.phone;

    if (prefs.whatsapp && stadium.callmebotApiKey && recipientPhone) {
      let cleanPhone = recipientPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
        cleanPhone = '2' + cleanPhone;
      }
      if (cleanPhone) {
        const netAmount = booking.netAmount ?? (booking.amount - 10);
        const textMsg = `*✅ حجز مؤكد تلقائياً ⚽*\n\nالاسم: ${booking.customerName}\nالملعب: ${fieldObj.name}\nاليوم: ${booking.date}\nالوقت: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}\nالمبلغ الإجمالي: ${booking.amount} ج.م.\nصافي ما يصلك: ${netAmount} ج.م.\n\n💳 تم الدفع إلكترونياً عبر PayMob — لا يلزم أي إجراء منك.`;
        const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}&apikey=${stadium.callmebotApiKey}`;
        fetch(callmebotUrl).catch(err => console.error('[CallMeBot] PayMob notification error:', err));
      }
    }

    // ── 9. Send Email notification ────────────────────────────────────────
    let recipientEmail = stadium.notificationEmail || stadium.email;
    if (!recipientEmail && stadium.ownerId) {
      try {
        const ownerUser = await Users.findById(stadium.ownerId);
        if (ownerUser?.email) recipientEmail = ownerUser.email;
      } catch (e) {
        console.error('[Email] Failed to fetch owner email:', e);
      }
    }

    if (prefs.email && recipientEmail) {
      const netAmount = booking.netAmount ?? (booking.amount - 10);
      const emailHtml = `
        <div style="direction: rtl; text-align: right; font-family: Cairo, Arial, sans-serif; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 620px; margin: 0 auto; background-color: #fcfcfc;">
          <div style="background: linear-gradient(135deg, #2b8259, #1a5c3e); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">✅ حجز مؤكد بالدفع الإلكتروني ⚽</h2>
            <p style="color: #c8e6c9; margin: 6px 0 0 0; font-size: 14px;">منصة ملعبي — تأكيد تلقائي عبر PayMob</p>
          </div>
          <p style="color: #333;">تم تأكيد حجز جديد على <strong>${stadium.name}</strong> تلقائياً بعد اكتمال الدفع الإلكتروني:</p>
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
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: #444;">💰 إجمالي الدفع</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #ddd; color: #2b8259; font-weight: bold; font-size: 16px;">${booking.amount} ج.م.</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #444;">🏦 صافي ما يصلك</td>
              <td style="padding: 10px 12px; color: #1a5c3e; font-weight: bold; font-size: 16px;">${netAmount} ج.م. <span style="font-size:12px; color:#888;">(بعد خصم 10 ج.م. رسوم المنصة)</span></td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 12px 16px; background: #e8f5e9; border-radius: 8px; border: 1px solid #a5d6a7; text-align: center;">
            <p style="margin: 0; color: #2b8259; font-weight: bold;">💳 تم الدفع إلكترونياً عبر PayMob — لا يلزم أي إجراء منك</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
            هذا البريد أُرسل تلقائياً من منصة ملعبي. يرجى عدم الرد على هذا البريد.
          </p>
        </div>
      `;

      sendEmail({
        to: recipientEmail,
        subject: `✅ حجز مؤكد تلقائياً — ${booking.customerName} — ${fieldObj.name}`,
        html: emailHtml,
      }).catch(err => console.error('[Email] Webhook notification error:', err));
    }

    // ── 10. Browser Push ──────────────────────────────────────────────────
    if (prefs.browser && stadium.pushSubscriptions && stadium.pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: '✅ حجز مؤكد تلقائياً ⚽',
        body: `تم الدفع من ${booking.customerName} — ${fieldObj.name} يوم ${booking.date} الساعة ${formatTime(booking.startTime)}`,
        url: `${APP_URL}/dashboard/bookings`,
      });
      stadium.pushSubscriptions.forEach((sub: any) => {
        sendPushNotification(sub, payload).catch(err => console.error('[Push] Webhook error:', err));
      });
    }

    // ── 11. Activity log ──────────────────────────────────────────────────
    ActivityLogs.log({
      action: 'payment_confirmed',
      performedBy: 'paymob_webhook',
      performedByName: 'PayMob Gateway',
      targetId: booking.id,
      targetType: 'booking',
      details: {
        customerName: booking.customerName,
        amount: booking.amount,
        paymobTransactionId,
        status: 'confirmed',
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[PayMob Webhook] Unhandled error:', error);
    // Always return 200 to prevent PayMob from retrying on server errors
    return NextResponse.json({ success: true });
  }
}

/**
 * GET /api/v1/payments/webhook
 * PayMob redirect callback after payment (user browser redirect).
 * We just acknowledge — the POST webhook above handles the actual processing.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const isSuccess = params['success'] === 'true';
  const bookingId = params['merchant_order_id'] || '';

  // Redirect to appropriate page
  if (bookingId) {
    // Get stadium slug from booking
    try {
      const booking = await Bookings.findById(bookingId);
      if (booking) {
        const page = isSuccess ? 'success' : 'failed';
        return NextResponse.redirect(
          new URL(`/${booking.stadiumSlug}/pay/${page}?bookingId=${bookingId}`, request.url)
        );
      }
    } catch (e) {
      console.error('[PayMob GET Callback] Error finding booking:', e);
    }
  }

  return NextResponse.redirect(new URL('/', request.url));
}

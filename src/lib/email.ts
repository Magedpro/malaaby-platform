import nodemailer from 'nodemailer';
import { APP_URL } from '@/lib/constants';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// ── Gmail SMTP via nodemailer (primary) ──────────────────────────────────────
// Works on Vercel. Sends to ANY email address. Uses Gmail App Password.
async function sendViaGmail(params: SendEmailParams): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"منصة ملعبي 🏟️" <${user}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log(`✉️ [Gmail SMTP]: Sent → ${params.to} | MsgId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('✉️ [Gmail SMTP Error]:', err);
    return false;
  }
}

// ── Resend API (fallback) ────────────────────────────────────────────────────
// Free tier: only sends to the Resend account owner's email.
async function sendViaResend(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Malaaby Platform <onboarding@resend.dev>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✉️ [Resend]: Sent ID ${data.id} → ${params.to}`);
      return true;
    } else {
      console.error('✉️ [Resend Error]:', data);
      return false;
    }
  } catch (err) {
    console.error('✉️ [Resend Exception]:', err);
    return false;
  }
}

// ── Main sendEmail ────────────────────────────────────────────────────────────
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  // 1. Try Gmail SMTP (sends to any email — best option)
  const gmailSent = await sendViaGmail(params);
  if (gmailSent) return true;

  // 2. Fallback: Resend API (limited to account owner's email on free tier)
  const resendSent = await sendViaResend(params);
  if (resendSent) return true;

  // 3. Dev mode fallback: log to console
  console.log(`✉️ [Dev Fallback] No email provider configured.`);
  console.log(`To: ${params.to} | Subject: ${params.subject}`);
  return false;
}


// ── Email HTML Templates ──────────────────────────────────────────────────────

export function getPasswordResetTemplate(resetLink: string): string {
  return `
    <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">

        <div style="text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <span style="font-size: 2.5rem;">🔑</span>
          <h2 style="color: #0f172a; margin: 0.5rem 0 0;">استعادة كلمة المرور</h2>
          <p style="color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0;">منصة ملعبي لإدارة الملاعب</p>
        </div>

        <p style="font-size: 1rem; color: #334155; line-height: 1.8;">
          لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة ملعبي.
          اضغط على الزر أدناه لتعيين كلمة مرور جديدة.
        </p>

        <div style="text-align: center; margin: 2rem 0;">
          <a href="${resetLink}"
             style="background-color: #22c55e; color: white; padding: 0.875rem 2.5rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem; display: inline-block;">
            تعيين كلمة مرور جديدة
          </a>
        </div>

        <div style="background-color: #fef3c7; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; border: 1px solid #fde68a;">
          <p style="margin: 0; font-size: 0.875rem; color: #92400e;">
            ⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد.
          </p>
        </div>

        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin-top: 2rem;">
          إذا لم يعمل الزر، انسخ الرابط التالي وضعه في متصفحك:<br/>
          <span style="direction: ltr; display: inline-block; word-break: break-all; color: #22c55e; margin-top: 0.5rem;">
            ${resetLink}
          </span>
        </p>
      </div>
    </div>
  `;
}

export function getNewBookingTemplate(
  stadiumName: string, customerName: string,
  date: string, time: string, amount: number
): string {
  return `
    <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 2rem;">
        <div style="text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <span style="font-size: 2.5rem;">🏟️</span>
          <h2 style="color: #0f172a; margin: 0.5rem 0 0;">حجز جديد قيد الانتظار!</h2>
          <p style="color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0;">منصة ملعبي لإدارة الملاعب</p>
        </div>

        <p style="font-size: 1rem; color: #334155; line-height: 1.6;">
          مرحباً يا كابتن، هناك عميل قام بحجز موعد جديد في ملعبك <strong>(${stadiumName})</strong>.
        </p>

        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem;">تفاصيل الحجز:</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 0.95rem;">
            <tr><td style="padding: 0.5rem 0; color: #64748b;">اسم العميل:</td><td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${customerName}</td></tr>
            <tr><td style="padding: 0.5rem 0; color: #64748b;">التاريخ:</td><td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 0.5rem 0; color: #64748b;">الوقت:</td><td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold; direction: ltr;">${time}</td></tr>
            <tr><td style="padding: 0.5rem 0; color: #64748b;">المبلغ:</td><td style="padding: 0.5rem 0; color: #22c55e; font-weight: bold;">${amount} ج.م</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <a href="${APP_URL}/dashboard/bookings"
             style="background-color: #22c55e; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            انتقل لمراجعة الحجوزات
          </a>
        </div>
      </div>
    </div>
  `;
}

export function getBookingStatusTemplate(
  customerName: string, stadiumName: string,
  date: string, time: string,
  status: 'approved' | 'rejected', reason?: string
): string {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusTitle = isApproved ? 'تم تأكيد حجزك بنجاح! 🎉' : 'عذراً، تم رفض حجزك ❌';

  return `
    <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 2rem;">
        <div style="text-align: center; border-bottom: 2px solid ${statusColor}; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <span style="font-size: 2.5rem;">${isApproved ? '✅' : '❌'}</span>
          <h2 style="color: #0f172a; margin: 0.5rem 0 0;">${statusTitle}</h2>
          <p style="color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0;">منصة ملعبي لحجز الملاعب</p>
        </div>

        <p style="font-size: 1rem; color: #334155; line-height: 1.6;">
          مرحباً يا <strong>${customerName}</strong>،
          ${isApproved
            ? `يسعدنا إبلاغك بأن ملعب <strong>(${stadiumName})</strong> قد قام بتأكيد حجزك.`
            : `تلقينا رداً من ملعب <strong>(${stadiumName})</strong> برفض طلب الحجز الخاص بك.`
          }
        </p>

        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 0.95rem;">
            <tr><td style="padding: 0.5rem 0; color: #64748b;">الملعب:</td><td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${stadiumName}</td></tr>
            <tr><td style="padding: 0.5rem 0; color: #64748b;">التاريخ:</td><td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 0.5rem 0; color: #64748b;">الوقت:</td><td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold; direction: ltr;">${time}</td></tr>
            ${!isApproved && reason ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">سبب الرفض:</td><td style="padding: 0.5rem 0; color: #ef4444; font-weight: bold;">${reason}</td></tr>` : ''}
          </table>
        </div>

        ${isApproved
          ? `<p style="font-size: 0.9rem; color: #22c55e; font-weight: bold; text-align: center;">نتمنى لك مباراة ممتعة! يرجى الحضور قبل الموعد بـ 10 دقائق.</p>`
          : `<p style="font-size: 0.9rem; color: #64748b; line-height: 1.6;">إذا تم خصم أي مبالغ، سيقوم مسؤول الملعب بالتواصل معك لإرجاعها.</p>`
        }

        <div style="text-align: center; margin-top: 2rem;">
          <a href="${APP_URL}/"
             style="background-color: #0f172a; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            تصفح ملاعب أخرى
          </a>
        </div>
      </div>
    </div>
  `;
}

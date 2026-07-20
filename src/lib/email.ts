const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`✉️ [Email Dev Mode (No API Key)]: Sending to "${to}"`);
    console.log(`Subject: "${subject}"`);
    console.log(`HTML Preview:\n-----------------\n${html}\n-----------------`);
    return true; // Simulate success in dev mode
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Malaaby Platform <onboarding@resend.dev>', // Resend free tier sender
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✉️ [Email Sent via Resend]: ID ${data.id} sent to ${to}`);
      return true;
    } else {
      console.error('✉️ [Resend API Error]:', data);
      return false;
    }
  } catch (err) {
    console.error('✉️ [Email Helper Exception]:', err);
    return false;
  }
}

// ── Email HTML Templates ──────────────────────────────────────────────────────

export function getNewBookingTemplate(stadiumName: string, customerName: string, date: string, time: string, amount: number) {
  return `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
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
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">اسم العميل:</td>
              <td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">التاريخ:</td>
              <td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">الوقت:</td>
              <td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold; direction: ltr;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">المبلغ:</td>
              <td style="padding: 0.5rem 0; color: #22c55e; font-weight: bold;">${amount} ج.م</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 0.9rem; color: #64748b; line-height: 1.6;">
          يرجى الدخول فوراً إلى لوحة التحكم الخاصة بملعبك لمراجعة الحجز (قبوله أو رفضه بناءً على إيصال الدفع).
        </p>

        <div style="text-align: center; margin-top: 2rem;">
          <a href="https://malaaby.vercel.app/dashboard/bookings" style="background-color: #22c55e; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">انتقل لمراجعة الحجوزات</a>
        </div>
      </div>
    </div>
  `;
}

export function getBookingStatusTemplate(customerName: string, stadiumName: string, date: string, time: string, status: 'approved' | 'rejected', reason?: string) {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusTitle = isApproved ? 'تم تأكيد حجزك بنجاح! 🎉' : 'عذراً، تم رفض حجزك ❌';

  return `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
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
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem;">تفاصيل الموعد:</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 0.95rem;">
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">الملعب:</td>
              <td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${stadiumName}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">التاريخ:</td>
              <td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">الوقت:</td>
              <td style="padding: 0.5rem 0; color: #0f172a; font-weight: bold; direction: ltr;">${time}</td>
            </tr>
            ${!isApproved && reason ? `
            <tr>
              <td style="padding: 0.5rem 0; color: #64748b;">سبب الرفض:</td>
              <td style="padding: 0.5rem 0; color: #ef4444; font-weight: bold;">${reason}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${isApproved ? `
          <p style="font-size: 0.9rem; color: #22c55e; font-weight: bold; line-height: 1.6; text-align: center;">
            نتمنى لك مباراة ممتعة! يرجى الحضور قبل الموعد بـ 10 دقائق.
          </p>
        ` : `
          <p style="font-size: 0.9rem; color: #64748b; line-height: 1.6;">
            إذا تم خصم أي مبالغ، سيقوم مسؤول الملعب بالتواصل معك لإرجاعها أو يمكنك التواصل معه مباشرة.
          </p>
        `}

        <div style="text-align: center; margin-top: 2rem;">
          <a href="https://malaaby.vercel.app/" style="background-color: #0f172a; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">تصفح ملاعب أخرى</a>
        </div>
      </div>
    </div>
  `;
}

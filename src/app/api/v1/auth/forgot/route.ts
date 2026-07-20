import { NextResponse } from 'next/server';
import { Users } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = (rawEmail || '').toLowerCase().trim(); // Normalize to lowercase
    if (!email) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const user = await Users.findByEmail(email);
    if (!user) {
      // For security: don't reveal whether email exists or not
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط الاستعادة قريباً.'
      });
    }

    // Generate random 32-char hex token
    const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour validity

    // Store reset token in user record
    await Users.update(user.id, {
      ...user,
      resetToken: token,
      resetTokenExpiry: expiry
    } as any);

    // Build reset link
    const origin = new URL(req.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('🔑 [Password Reset Link Created]:', resetLink);

    // Send reset email
    const emailHtml = `
      <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 2rem;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <div style="text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <span style="font-size: 2.5rem;">🔑</span>
            <h2 style="color: #0f172a; margin: 0.5rem 0 0;">استعادة كلمة المرور</h2>
            <p style="color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0;">منصة ملعبي لإدارة الملاعب</p>
          </div>

          <p style="font-size: 1rem; color: #334155; line-height: 1.8;">
            مرحباً، لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. 
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

    const emailSent = await sendEmail({
      to: email,
      subject: 'استعادة كلمة المرور — منصة ملعبي',
      html: emailHtml,
    });

    const response: Record<string, unknown> = {
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط الاستعادة قريباً.',
    };

    // Only show debug link in development (when no API key = dev mode)
    if (!process.env.RESEND_API_KEY) {
      response.debugLink = resetLink;
      response.emailSent = emailSent;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Users } from '@/lib/db';
import { sendEmail, getPasswordResetTemplate } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = (rawEmail || '').toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const user = await Users.findByEmail(email);

    // Security: always return the same response whether email exists or not
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط الاستعادة قريباً.',
      });
    }

    // Generate a cryptographically secure 32-char hex token, valid for 1 hour
    const token = randomBytes(16).toString('hex');
    const expiry = new Date(Date.now() + 3_600_000).toISOString();

    await Users.update(user.id, { ...user, resetToken: token, resetTokenExpiry: expiry } as any);

    // Prefer the configured production URL so links work behind proxies
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('🔑 [Reset link]:', resetLink);

    const emailSent = await sendEmail({
      to: email,
      subject: 'استعادة كلمة المرور — منصة ملعبي 🔑',
      html: getPasswordResetTemplate(resetLink),
    });

    console.log(`✉️ [Forgot] emailSent=${emailSent} for ${email}`);

    const isProd = !!(process.env.GMAIL_APP_PASSWORD || process.env.RESEND_API_KEY);

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط الاستعادة قريباً.',
      // Show debug link only in dev mode (no email credentials configured)
      ...(!isProd && { debugLink: resetLink, emailSent }),
    });

  } catch (error) {
    console.error('[Forgot API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}

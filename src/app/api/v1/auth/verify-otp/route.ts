import { NextRequest, NextResponse } from 'next/server';
import { Users, Stadiums, ActivityLogs } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { verifyOtp, resetFailedAttempts, isLockedOut } from '@/lib/otp';
import { sendEmail, getLoginAlertEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode, password } = body;

    if (!email || !otpCode || !password) {
      return NextResponse.json({ success: false, error: 'جميع البيانات مطلوبة' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Lockout check
    const lockout = isLockedOut(cleanEmail);
    if (lockout.locked) {
      return NextResponse.json({
        success: false,
        error: `الحساب موقوف محلياً مؤقتاً. يرجى الانتظار ${lockout.remainingMinutes} دقيقة.`,
      }, { status: 429 });
    }

    // 2. Find User
    const user = await Users.findByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({ success: false, error: 'بيانات غير صحيحة' }, { status: 401 });
    }

    // 3. Verify Password again for security
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: 'بيانات غير صحيحة' }, { status: 401 });
    }

    // 4. Verify OTP code
    const validOtp = verifyOtp(cleanEmail, otpCode);
    if (!validOtp) {
      return NextResponse.json({
        success: false,
        error: 'رمز الأمان (OTP) غير صحيح أو انتهت صلاحيته (صالح لمدة 10 دقائق)',
      }, { status: 400 });
    }

    // 5. Reset failed attempts
    resetFailedAttempts(cleanEmail);

    let stadiumSlug = user.stadiumSlug;

    // 6. Create Session
    await createSession({
      userId: user.id,
      role: user.role,
      stadiumSlug,
      name: user.name,
      email: user.email,
    });

    // 7. Log Activity
    ActivityLogs.log({
      action: 'user_login_2fa',
      performedBy: user.id,
      performedByName: user.name,
      targetId: user.id,
      targetType: 'user',
      details: { role: user.role, twoFactorVerified: true },
    });

    // 8. Send Security Alert Email
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
    sendEmail({
      to: user.email,
      subject: '🛡️ إشعار أمان: تم تسجيل الدخول إلى حسابك',
      html: getLoginAlertEmailTemplate(user.name, user.email, clientIp),
    }).catch(err => console.error('Failed to send login alert email:', err));

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        stadiumSlug,
      },
    });

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع أثناء التحقق' }, { status: 500 });
  }
}

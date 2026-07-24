import { NextRequest, NextResponse } from 'next/server';
import { Users, Stadiums, ActivityLogs } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { validateLogin } from '@/lib/validations';
import { isLockedOut, recordFailedAttempt, resetFailedAttempts, generateOtp } from '@/lib/otp';
import { sendEmail, getOtpEmailTemplate, getLoginAlertEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation
    const validation = validateLogin(body);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const { email, password } = body;
    const cleanEmail = email.toLowerCase().trim();

    // 2. Lockout Check
    const lockout = isLockedOut(cleanEmail);
    if (lockout.locked) {
      return NextResponse.json({
        success: false,
        error: `تم حظر محاولات الدخول مؤقتاً بكثرة المحاولات الخاطئة. يرجى المحاولة بعد ${lockout.remainingMinutes} دقيقة.`,
      }, { status: 429 });
    }

    // 3. Find User
    const user = await Users.findByEmail(cleanEmail);
    if (!user) {
      const attempt = recordFailedAttempt(cleanEmail);
      return NextResponse.json({
        success: false,
        error: attempt.locked
          ? 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم حظر الدخول لمدة 15 دقيقة.'
          : 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      }, { status: 401 });
    }

    // 4. Verify Password
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      const attempt = recordFailedAttempt(cleanEmail);
      return NextResponse.json({
        success: false,
        error: attempt.locked
          ? 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم حظر الدخول لمدة 15 دقيقة.'
          : 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      }, { status: 401 });
    }

    // 5. Verify Account Status
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'هذا الحساب موقوف حالياً. يرجى التواصل مع الدعم الفني',
      }, { status: 403 });
    }

    // 6. If Stadium Owner, verify stadium status
    let stadiumSlug = user.stadiumSlug;
    if (user.role === 'owner' && stadiumSlug) {
      const stadium = await Stadiums.findBySlug(stadiumSlug);
      if (stadium && !stadium.isActive) {
        return NextResponse.json({
          success: false,
          error: 'تم إيقاف موقع ملعبك من قبل الإدارة. يرجى التواصل مع الدعم الفني',
        }, { status: 403 });
      }
    }

    // 7. Check if 2FA (OTP) is required (for Super Admin & Stadium Owners)
    if (user.role === 'super_admin' || user.role === 'owner') {
      const otpCode = generateOtp(cleanEmail);
      
      // Send OTP via Email asynchronously
      sendEmail({
        to: user.email,
        subject: '🔐 رمز التوثيق (2FA) - منصة ملعبي',
        html: getOtpEmailTemplate(otpCode, user.name),
      }).catch(err => console.error('Failed to send OTP email:', err));

      return NextResponse.json({
        success: true,
        requiresOtp: true,
        email: user.email,
        message: 'تم إرسال رمز الأمان (OTP) إلى بريدك الإلكتروني',
      });
    }

    // 8. Regular login (for normal users if any)
    resetFailedAttempts(cleanEmail);

    await createSession({
      userId: user.id,
      role: user.role,
      stadiumSlug,
      name: user.name,
      email: user.email,
    });

    ActivityLogs.log({
      action: 'user_login',
      performedBy: user.id,
      performedByName: user.name,
      targetId: user.id,
      targetType: 'user',
      details: { role: user.role },
    });

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
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' }, { status: 500 });
  }
}

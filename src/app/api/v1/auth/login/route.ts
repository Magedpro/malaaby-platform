import { NextRequest, NextResponse } from 'next/server';
import { Users, Stadiums, ActivityLogs } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { validateLogin } from '@/lib/validations';

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

    // 2. Find User
    const user = await Users.findByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      }, { status: 401 });
    }

    // 3. Verify Password
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      }, { status: 401 });
    }

    // 4. Verify Account Status
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'هذا الحساب موقوف حالياً. يرجى التواصل مع الدعم الفني'
      }, { status: 403 });
    }

    // 5. If Stadium Owner, verify stadium status
    let stadiumSlug = user.stadiumSlug;
    if (user.role === 'owner' && stadiumSlug) {
      const stadium = await Stadiums.findBySlug(stadiumSlug);
      if (stadium && !stadium.isActive) {
        return NextResponse.json({
          success: false,
          error: 'تم إيقاف موقع ملعبك من قبل الإدارة. يرجى التواصل مع الدعم الفني'
        }, { status: 403 });
      }
    }

    // 6. Create Session
    await createSession({
      userId: user.id,
      role: user.role,
      stadiumSlug,
      name: user.name,
      email: user.email,
    });

    // 7. Log activity
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
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' }, { status: 500 });
  }
}

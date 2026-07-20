import { NextResponse } from 'next/server';
import { Users } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const user = await Users.findByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني غير مسجل لدينا' }, { status: 404 });
    }

    // Generate random 32-char hex token
    const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour validity

    // Update user data to store reset token
    await Users.update(user.id, {
      ...user,
      resetToken: token,
      resetTokenExpiry: expiry
    } as any);

    // Create reset link
    const origin = new URL(req.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('🔑 [Password Reset Link Created]:', resetLink);

    // Return the link in response for testing
    return NextResponse.json({
      success: true,
      message: 'تم توليد رابط استعادة كلمة المرور بنجاح. يرجى مراجعة بريدك الإلكتروني.',
      debugLink: resetLink
    });

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}

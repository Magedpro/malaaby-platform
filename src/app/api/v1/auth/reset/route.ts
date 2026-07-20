import { NextResponse } from 'next/server';
import { Users } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' }, { status: 400 });
    }

    const user = await Users.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني غير مسجل لدينا' }, { status: 404 });
    }

    const u = user as any;

    // Check token and expiry
    if (!u.resetToken || u.resetToken !== token) {
      return NextResponse.json({ success: false, error: 'رمز استعادة كلمة المرور غير صالح أو منتهي الصلاحية' }, { status: 400 });
    }

    if (!u.resetTokenExpiry || new Date(u.resetTokenExpiry).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'انتهت صلاحية رمز استعادة كلمة المرور، يرجى تقديم طلب جديد' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user: set new password and clear reset token info
    const updatedUser = { ...user };
    delete (updatedUser as any).resetToken;
    delete (updatedUser as any).resetTokenExpiry;

    await Users.update(user.id, {
      ...updatedUser,
      passwordHash
    });

    console.log(`🔒 [Password Changed Successfully]: for user ${email}`);

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.'
    });

  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}

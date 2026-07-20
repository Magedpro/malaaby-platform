import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Users, Stadiums, ActivityLogs } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const { id } = await params;
    const user = await Users.findById(id);
    if (!user) return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });

    const body = await request.json();
    const { action, name, email, phone, password, subscriptionStatus, subscriptionExpiry, subscriptionPlanId } = body;

    if (action === 'suspend') {
      await Users.update(id, { isActive: false });
      if (user.stadiumSlug) await Stadiums.update(user.stadiumSlug, { isActive: false });
      ActivityLogs.log({ action: 'admin_suspend_owner', performedBy: session.userId, performedByName: session.name, targetId: id, targetType: 'user' });
      return NextResponse.json({ success: true, message: 'تم تعليق الحساب' });
    }

    if (action === 'activate') {
      await Users.update(id, { isActive: true });
      if (user.stadiumSlug) await Stadiums.update(user.stadiumSlug, { isActive: true });
      ActivityLogs.log({ action: 'admin_activate_owner', performedBy: session.userId, performedByName: session.name, targetId: id, targetType: 'user' });
      return NextResponse.json({ success: true, message: 'تم تفعيل الحساب' });
    }

    if (action === 'reset_password') {
      if (!password || password.length < 8) return NextResponse.json({ success: false, error: 'كلمة المرور قصيرة' }, { status: 400 });
      const passwordHash = await hashPassword(password);
      await Users.update(id, { passwordHash });
      ActivityLogs.log({ action: 'admin_reset_password', performedBy: session.userId, performedByName: session.name, targetId: id, targetType: 'user' });
      return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور' });
    }

    if (action === 'update_subscription') {
      if (user.stadiumSlug) {
        await Stadiums.update(user.stadiumSlug, {
          subscriptionStatus: subscriptionStatus,
          subscriptionExpiry: subscriptionExpiry,
          subscriptionPlanId: subscriptionPlanId,
        });
      }
      ActivityLogs.log({ action: 'admin_update_subscription', performedBy: session.userId, performedByName: session.name, targetId: id, targetType: 'stadium' });
      return NextResponse.json({ success: true, message: 'تم تحديث الاشتراك' });
    }

    // Default: update basic info
    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    await Users.update(id, updates);
    ActivityLogs.log({ action: 'admin_update_owner', performedBy: session.userId, performedByName: session.name, targetId: id, targetType: 'user' });
    return NextResponse.json({ success: true, message: 'تم تحديث بيانات المالك' });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في تعديل الحساب' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const { id } = await params;
    const user = await Users.findById(id);
    if (!user) return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    if (user.role === 'super_admin') return NextResponse.json({ success: false, error: 'لا يمكن حذف حساب المشرف الرئيسي' }, { status: 403 });

    await Users.delete(id);
    if (user.stadiumSlug) await Stadiums.delete(user.stadiumSlug);
    ActivityLogs.log({ action: 'admin_delete_owner', performedBy: session.userId, performedByName: session.name, targetId: id, targetType: 'user' });
    return NextResponse.json({ success: true, message: 'تم حذف الحساب والملعب' });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في حذف الحساب' }, { status: 500 });
  }
}

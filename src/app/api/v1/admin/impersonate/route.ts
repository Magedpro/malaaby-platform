import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import { Users, Stadiums, ActivityLogs } from '@/lib/db';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'malaaby-ultra-secure-and-private-jwt-secret-key-2026';
const KEY = new TextEncoder().encode(SECRET_KEY);

const ADMIN_BACKUP_COOKIE = 'malaaby_admin_backup';

/**
 * POST /api/v1/admin/impersonate
 * body: { userId: string }  → enter target user's account as admin
 * body: { action: 'exit' } → restore original admin session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // ── Exit impersonation ─────────────────────────────────────────
    const body = await request.json();

    if (body.action === 'exit') {
      // Restore admin session from backup cookie
      const cookieStore = await cookies();
      const backupToken = cookieStore.get(ADMIN_BACKUP_COOKIE)?.value;
      if (!backupToken) {
        return NextResponse.json({ success: false, error: 'لا يوجد حساب أدمن محفوظ للعودة إليه' }, { status: 400 });
      }

      // Verify the backup token
      let adminPayload: any;
      try {
        const { payload } = await jwtVerify(backupToken, KEY);
        adminPayload = payload;
      } catch {
        cookieStore.delete(ADMIN_BACKUP_COOKIE);
        return NextResponse.json({ success: false, error: 'انتهت صلاحية جلسة الأدمن' }, { status: 401 });
      }

      // Verify original admin exists and is active super_admin
      const adminUser = await Users.findById(adminPayload.userId);
      if (!adminUser || adminUser.role !== 'super_admin' || !adminUser.isActive) {
        cookieStore.delete(ADMIN_BACKUP_COOKIE);
        return NextResponse.json({ success: false, error: 'حساب الأدمن غير متاح للعودة إليه' }, { status: 403 });
      }

      // Restore admin session
      await createSession({
        userId: adminUser.id,
        role: adminUser.role,
        stadiumSlug: adminUser.stadiumSlug,
        name: adminUser.name,
        email: adminUser.email,
      });

      // Clear the backup cookie
      cookieStore.delete(ADMIN_BACKUP_COOKIE);

      return NextResponse.json({
        success: true,
        message: 'تم الخروج من حساب المالك والعودة لحساب الأدمن بنجاح ✅',
        redirectTo: '/admin/owners',
      });
    }

    // ── Enter impersonation ────────────────────────────────────────
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح — سوبر أدمن فقط' }, { status: 403 });
    }

    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'معرّف المستخدم مطلوب' }, { status: 400 });
    }

    const targetUser = await Users.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (targetUser.role === 'super_admin') {
      return NextResponse.json({ success: false, error: 'لا يمكن الدخول لحساب مشرف آخر' }, { status: 403 });
    }

    // Save current admin session as backup
    const adminBackupToken = await new SignJWT({
      userId: session.userId,
      role: session.role,
      stadiumSlug: session.stadiumSlug,
      name: session.name,
      email: session.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(KEY);

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_BACKUP_COOKIE, adminBackupToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    // Get stadium slug if owner
    const stadiumSlug = targetUser.stadiumSlug || (await Stadiums.findByOwner(targetUser.id))?.slug;

    // Create session for target user
    await createSession({
      userId: targetUser.id,
      role: targetUser.role,
      stadiumSlug: stadiumSlug,
      name: targetUser.name,
      email: targetUser.email,
    });

    // Log the action
    ActivityLogs.log({
      action: 'admin_impersonate_user',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: userId,
      targetType: 'user',
      details: { targetName: targetUser.name, targetEmail: targetUser.email },
    });

    return NextResponse.json({
      success: true,
      message: `تم الدخول لحساب "${targetUser.name}" بنجاح. ستتمكن من العودة لحسابك في أي وقت. 👁️`,
      redirectTo: stadiumSlug ? '/dashboard' : '/',
      targetName: targetUser.name,
    });
  } catch (error) {
    console.error('Impersonate error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تنفيذ العملية' }, { status: 500 });
  }
}

/**
 * GET /api/v1/admin/impersonate
 * Returns whether we are currently impersonating someone
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    const backupToken = cookieStore.get(ADMIN_BACKUP_COOKIE)?.value;

    if (!backupToken) {
      return NextResponse.json({ success: true, isImpersonating: false });
    }

    // Security Guard: If user is not logged in OR is already super_admin, purge stale backup token
    if (!session || session.role === 'super_admin') {
      cookieStore.delete(ADMIN_BACKUP_COOKIE);
      return NextResponse.json({ success: true, isImpersonating: false });
    }

    try {
      const { payload } = await jwtVerify(backupToken, KEY);
      return NextResponse.json({
        success: true,
        isImpersonating: true,
        adminName: (payload as any).name,
        adminEmail: (payload as any).email,
      });
    } catch {
      cookieStore.delete(ADMIN_BACKUP_COOKIE);
      return NextResponse.json({ success: true, isImpersonating: false });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطأ' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Users, Stadiums } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    // Refresh database status in case of suspension
    const user = await Users.findById(session.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'تم تعطيل الحساب' }, { status: 403 });
    }

    let stadiumInfo = null;
    if ((user.role === 'owner' || user.role === 'super_admin') && user.stadiumSlug) {
      const stadium = await Stadiums.findBySlug(user.stadiumSlug);
      if (stadium) {
        // Fallback for older stadiums that don't have subscription fields
        const stadiumCreated = stadium.createdAt || user.createdAt || new Date().toISOString();
        const defaultExpiry = new Date(new Date(stadiumCreated).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
        
        // Clean and validate expiry date
        let expiry = stadium.subscriptionExpiry;
        if (!expiry || expiry === '—' || expiry === 'null' || isNaN(Date.parse(expiry))) {
          expiry = defaultExpiry;
        }

        const s = stadium as any;
        stadiumInfo = {
          name: stadium.name,
          slug: stadium.slug,
          isActive: stadium.isActive,
          subscriptionStatus: stadium.subscriptionStatus || 'trial',
          subscriptionExpiry: expiry,
          subscriptionPlanId: s.subscriptionPlanId || 'plan-basic',
          pendingSubscription: s.pendingSubscription ?? null,
          approvalStatus: s.approvalStatus ?? 'approved'
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          stadiumSlug: user.stadiumSlug,
          phone: user.phone
        },
        stadium: stadiumInfo
      }
    });

  } catch (error) {
    console.error('Session me API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في جلب بيانات الجلسة' }, { status: 500 });
  }
}

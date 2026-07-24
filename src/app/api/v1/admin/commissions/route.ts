import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums, Bookings, ActivityLogs } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول (سوبر أدمن فقط)' }, { status: 403 });
    }

    const stadiums = await Stadiums.findAll();
    const allBookings = await Bookings.findAll();

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const report = stadiums.map(stadium => {
      const createdTime = Date.parse(stadium.createdAt || '');
      const isFreeMonth = !isNaN(createdTime) && (now - createdTime < thirtyDaysMs);
      const freeUntilDate = !isNaN(createdTime) ? new Date(createdTime + thirtyDaysMs).toISOString() : null;

      const stadiumBookings = allBookings.filter(b => b.stadiumSlug === stadium.slug && (b.status === 'completed' || b.status === 'confirmed'));
      const rate = stadium.commissionRate ?? 5;
      const totalCommission = isFreeMonth ? 0 : stadiumBookings.length * rate;

      return {
        slug: stadium.slug,
        name: stadium.name,
        phone: stadium.phone,
        ownerId: stadium.ownerId,
        createdAt: stadium.createdAt,
        isFreeMonth,
        freeUntilDate,
        totalCompletedBookings: stadiumBookings.length,
        commissionRate: rate,
        totalCalculatedCommission: totalCommission,
        unpaidCommission: isFreeMonth ? 0 : (stadium.unpaidCommission ?? totalCommission),
        commissionStatus: isFreeMonth ? 'active' : (stadium.commissionStatus || 'active'),
        lastSettledDate: stadium.lastSettledDate || null,
        pendingCommissionPayment: stadium.pendingCommissionPayment || null,
      };
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('GET admin commissions error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب تقارير العمولات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 403 });
    }

    const body = await request.json();
    const { stadiumSlug, action } = body;

    if (!stadiumSlug || !action) {
      return NextResponse.json({ success: false, error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const stadium = await Stadiums.findBySlug(stadiumSlug);
    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    if (action === 'approve_payment') {
      // Owner of platform approves payment receipt -> clear debt and unblock
      await Stadiums.update(stadiumSlug, {
        unpaidCommission: 0,
        commissionStatus: 'active',
        lastSettledDate: new Date().toISOString(),
        pendingCommissionPayment: null,
      });

      ActivityLogs.log({
        action: 'approve_commission_payment',
        performedBy: session.userId,
        performedByName: session.name,
        targetId: stadiumSlug,
        targetType: 'stadium',
        details: { clearedAmount: stadium.pendingCommissionPayment?.amount || stadium.unpaidCommission },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تأكيد السداد وتصفير المستحقات وفك الحجب عن الملعب بنجاح ✅',
      });
    }

    if (action === 'block') {
      await Stadiums.update(stadiumSlug, { commissionStatus: 'blocked' });

      ActivityLogs.log({
        action: 'block_stadium_commission',
        performedBy: session.userId,
        performedByName: session.name,
        targetId: stadiumSlug,
        targetType: 'stadium',
      });

      return NextResponse.json({ success: true, message: 'تم حجب الملعب بنجاح 🔒' });
    }

    if (action === 'unblock') {
      await Stadiums.update(stadiumSlug, { commissionStatus: 'active' });

      ActivityLogs.log({
        action: 'unblock_stadium_commission',
        performedBy: session.userId,
        performedByName: session.name,
        targetId: stadiumSlug,
        targetType: 'stadium',
      });

      return NextResponse.json({ success: true, message: 'تم فك الحجب عن الملعب بنجاح 🔓' });
    }

    return NextResponse.json({ success: false, error: 'الإجراء غير مدعوم' }, { status: 400 });

  } catch (error) {
    console.error('POST admin commissions error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تنفيذ الإجراء' }, { status: 500 });
  }
}

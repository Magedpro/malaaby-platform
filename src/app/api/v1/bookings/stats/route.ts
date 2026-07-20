import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Bookings, Fields, Stadiums } from '@/lib/db';
import { getTodayString, getMonthString } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const slug = session.stadiumSlug;
    const [bookings, fieldsCount] = await Promise.all([
      Bookings.findByStadium(slug),
      Fields.countByStadium(slug),
    ]);

    const todayStr = getTodayString();
    const currentMonthStr = getMonthString(); // "YYYY-MM"

    // 1. Calculate counters
    const todayBookings = bookings.filter((b) => b.date === todayStr).length;
    const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'rejected' || b.status === 'cancelled').length;

    const todayRevenue = bookings
      .filter((b) => b.date === todayStr && b.status === 'confirmed')
      .reduce((sum, b) => sum + b.amount, 0);

    const monthlyRevenue = bookings
      .filter((b) => b.date.startsWith(currentMonthStr) && b.status === 'confirmed')
      .reduce((sum, b) => sum + b.amount, 0);

    // Calculate unique customers (by unique phone number)
    const uniquePhones = new Set(bookings.map((b) => b.customerPhone));
    const totalCustomers = uniquePhones.size;

    // 2. Generate Chart Data (Last 6 Months Bookings & Revenue)
    const chartData: { month: string; bookings: number; revenue: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const displayLabel = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(d);

      const mBookings = bookings.filter((b) => b.date.startsWith(mStr));
      const mRevenue = mBookings
        .filter((b) => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.amount, 0);

      chartData.push({
        month: displayLabel,
        bookings: mBookings.length,
        revenue: mRevenue,
      });
    }

    // Recent bookings (first 5)
    const recent = bookings.slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          todayRevenue,
          monthlyRevenue,
          totalFields: fieldsCount,
          totalCustomers,
        },
        chartData,
        recentBookings: recent,
      },
    });

  } catch (error) {
    console.error('GET stats API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في استخلاص بيانات الإحصائيات' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';

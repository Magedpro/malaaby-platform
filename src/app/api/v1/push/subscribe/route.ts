import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: 'بيانات الاشتراك غير مكتملة' }, { status: 400 });
    }

    const stadium = await Stadiums.findBySlug(session.stadiumSlug);
    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    const subs = stadium.pushSubscriptions || [];
    
    // Check if subscription already exists to avoid duplicates
    const exists = subs.some((s: any) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push({
        ...subscription,
        createdAt: new Date().toISOString()
      });
      
      await Stadiums.update(session.stadiumSlug, { pushSubscriptions: subs });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الاشتراك بالإشعارات' }, { status: 500 });
  }
}

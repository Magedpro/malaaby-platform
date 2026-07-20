import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Notifications } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const [list, unread] = await Promise.all([
      Notifications.findByStadium(session.stadiumSlug),
      Notifications.unreadCount(session.stadiumSlug),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications: list,
        unreadCount: unread
      }
    });
  } catch (error) {
    console.error('GET notifications API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في جلب الإشغارات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (id) {
      await Notifications.markRead(id);
    } else {
      await Notifications.markAllRead(session.stadiumSlug);
    }

    return NextResponse.json({ success: true, message: 'تم تحديث الإشعارات بنجاح' });
  } catch (error) {
    console.error('PUT notifications API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في مراجعة الإشعارات' }, { status: 500 });
  }
}

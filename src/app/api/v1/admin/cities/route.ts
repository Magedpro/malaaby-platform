import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Cities, ActivityLogs } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const cities = await Cities.findAllAdmin();
    return NextResponse.json({ success: true, data: cities });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب المدن' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const body = await request.json();
    const { name } = body;
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'اسم المدينة مطلوب' }, { status: 400 });
    }

    const city = await Cities.create(name.trim());
    ActivityLogs.log({
      action: 'admin_create_city',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: city.id,
      targetType: 'city',
    });

    return NextResponse.json({ success: true, data: city });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في إضافة المدينة' }, { status: 500 });
  }
}

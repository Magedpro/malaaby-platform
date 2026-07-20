import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminStats } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const stats = await getAdminStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإحصائيات' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';

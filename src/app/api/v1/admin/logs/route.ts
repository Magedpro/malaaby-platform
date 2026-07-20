import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActivityLogs } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const logs = await ActivityLogs.findAll(200);
    return NextResponse.json({ success: true, data: logs });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب سجلات النشاط' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';

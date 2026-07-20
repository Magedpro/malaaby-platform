import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Cities, ActivityLogs } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const { name, isActive } = body;

    const city = await Cities.update(id, { name, isActive });
    if (!city) return NextResponse.json({ success: false, error: 'المدينة غير موجودة' }, { status: 404 });

    ActivityLogs.log({
      action: 'admin_update_city',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'city',
    });

    return NextResponse.json({ success: true, data: city });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في تعديل المدينة' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const { id } = await params;

    const deleted = await Cities.delete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'المدينة غير موجودة' }, { status: 404 });

    ActivityLogs.log({
      action: 'admin_delete_city',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'city',
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في حذف المدينة' }, { status: 500 });
  }
}

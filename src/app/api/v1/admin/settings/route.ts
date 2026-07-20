import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PlatformSettingsDB, ActivityLogs } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const settings = await PlatformSettingsDB.get();
    return NextResponse.json({ success: true, data: settings });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    const body = await request.json();
    const { platformName, platformNameEn, supportEmail, supportWhatsApp, ownerApprovalRequired, maintenanceMode } = body;

    const settings = await PlatformSettingsDB.update({
      platformName,
      platformNameEn,
      supportEmail,
      supportWhatsApp,
      ownerApprovalRequired: !!ownerApprovalRequired,
      maintenanceMode: !!maintenanceMode,
    });

    await ActivityLogs.log({
      action: 'admin_update_settings',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: 'platform',
      targetType: 'settings',
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums, ActivityLogs } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }
    const stadium = await Stadiums.findBySlug(session.stadiumSlug);
    if (!stadium) return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    return NextResponse.json({ success: true, data: stadium });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const {
      name, description, phone, whatsapp, email,
      city, address, googleMapsUrl,
      vodafoneCash, instaPay, paymentInstructions,
      logo, coverImage, callmebotApiKey,
      notificationEmail, notificationPrefs,
    } = body;

    if (!name || name.trim().length < 2)
      return NextResponse.json({ success: false, errors: { name: 'اسم الملعب مطلوب' } }, { status: 400 });

    const updated = await Stadiums.update(session.stadiumSlug, {
      name: name.trim(),
      description: (description || '').trim(),
      phone: (phone || '').trim(),
      whatsapp: (whatsapp || '').trim(),
      email: (email || '').trim(),
      city: (city || '').trim(),
      address: (address || '').trim(),
      googleMapsUrl: (googleMapsUrl || '').trim(),
      vodafoneCash: (vodafoneCash || '').trim(),
      instaPay: (instaPay || '').trim(),
      paymentInstructions: (paymentInstructions || '').trim(),
      logo: logo || undefined,
      coverImage: coverImage || undefined,
      callmebotApiKey: (callmebotApiKey || '').trim() || undefined,
      notificationEmail: (notificationEmail || '').trim() || undefined,
      notificationPrefs: notificationPrefs || undefined,
    });

    ActivityLogs.log({
      action: 'update_stadium_settings',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: session.stadiumSlug,
      targetType: 'stadium',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}

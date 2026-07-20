import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Fields, Users, Stadiums, ActivityLogs } from '@/lib/db';
import { validateField } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const fieldsList = await Fields.findByStadium(session.stadiumSlug);
    return NextResponse.json({ success: true, data: fieldsList });
  } catch (error) {
    console.error('GET fields API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات الملاعب' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    // Verify owner account
    const user = await Users.findById(session.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'حساب المستخدم موقوف' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate field inputs
    const validation = validateField(body);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const {
      name, description, pricePerHour,
      bookingDuration, coverImage, openingTime, closingTime,
      saturday, sunday, monday, tuesday, wednesday, thursday, friday
    } = body;

    // Check plan limits
    const stadium = await Stadiums.findBySlug(session.stadiumSlug);
    const maxFields = stadium?.subscriptionPlanId === 'plan-basic' ? 1 : stadium?.subscriptionPlanId === 'plan-pro' ? 2 : -1;
    const currentFieldsCount = await Fields.countByStadium(session.stadiumSlug);

    if (maxFields !== -1 && currentFieldsCount >= maxFields) {
      return NextResponse.json({
        success: false,
        error: `لقد تجاوزت الحد الأقصى للملاعب المتاحة لخطة اشتراكك الحالية (${maxFields} ملعب). يرجى ترقية الاشتراك.`
      }, { status: 403 });
    }

    const defaultSchedule = {
      saturday: saturday || { open: true, from: '08:00', to: '23:00' },
      sunday: sunday || { open: true, from: '08:00', to: '23:00' },
      monday: monday || { open: true, from: '08:00', to: '23:00' },
      tuesday: tuesday || { open: true, from: '08:00', to: '23:00' },
      wednesday: wednesday || { open: true, from: '08:00', to: '23:00' },
      thursday: thursday || { open: true, from: '08:00', to: '23:00' },
      friday: friday || { open: true, from: '08:00', to: '23:00' },
    };

    const field = await Fields.create({
      stadiumSlug: session.stadiumSlug,
      name: name.trim(),
      description: (description || '').trim(),
      pricePerHour: Number(pricePerHour),
      bookingDuration: Number(bookingDuration) as any,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1568194157720-8eae79728929?w=600&h=400&fit=crop',
      galleryImages: [],
      openingTime,
      closingTime,
      status: 'available',
      workingDays: defaultSchedule,
      blockedDates: [],
    });

    ActivityLogs.log({
      action: 'create_field',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: field.id,
      targetType: 'field',
      details: { fieldName: field.name },
    });

    return NextResponse.json({ success: true, data: field }, { status: 201 });
  } catch (error) {
    console.error('POST fields API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إضافة الملعب' }, { status: 500 });
  }
}

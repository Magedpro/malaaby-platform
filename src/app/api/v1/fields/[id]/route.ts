import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Fields, ActivityLogs } from '@/lib/db';
import { validateField } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const field = await Fields.findById(id);
    if (!field || field.stadiumSlug !== session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود أو لا تملك صلاحية تعديله' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateField(body);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const {
      name, description, pricePerHour,
      bookingDuration, coverImage, openingTime, closingTime, status,
      workingDays, blockedDates
    } = body;

    const updatedField = await Fields.update(id, {
      name: name.trim(),
      description: (description || '').trim(),
      pricePerHour: Number(pricePerHour),
      bookingDuration: Number(bookingDuration) as any,
      coverImage: coverImage || field.coverImage,
      openingTime,
      closingTime,
      status: status || field.status,
      workingDays: workingDays || field.workingDays,
      blockedDates: blockedDates || field.blockedDates,
    });

    ActivityLogs.log({
      action: 'update_field',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'field',
      details: { fieldName: name },
    });

    return NextResponse.json({ success: true, data: updatedField });
  } catch (error) {
    console.error('PUT field API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تعديل بيانات الملعب' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const field = await Fields.findById(id);
    if (!field || field.stadiumSlug !== session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود أو لا تملك صلاحية حذفه' }, { status: 404 });
    }

    await Fields.delete(id);

    ActivityLogs.log({
      action: 'delete_field',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'field',
      details: { fieldName: field.name },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الملعب بنجاح' });
  } catch (error) {
    console.error('DELETE field API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف الملعب' }, { status: 500 });
  }
}

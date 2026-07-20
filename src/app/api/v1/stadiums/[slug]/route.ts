import { NextRequest, NextResponse } from 'next/server';
import { Stadiums, Fields, generateTimeSlots } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const stadium = await Stadiums.findBySlug(slug);

    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب غير موجود' }, { status: 404 });
    }

    if (!stadium.isActive || stadium.approvalStatus !== 'approved') {
      return NextResponse.json({ success: false, error: 'هذا الملعب غير متاح حالياً' }, { status: 403 });
    }

    const allFields = await Fields.findByStadium(slug);
    const fields = allFields.filter(f => f.status === 'available');

    return NextResponse.json({
      success: true,
      data: { stadium, fields }
    });
  } catch (e) {
    console.error('Public stadium API error:', e);
    return NextResponse.json({ success: false, error: 'خطأ في جلب بيانات الملعب' }, { status: 500 });
  }
}

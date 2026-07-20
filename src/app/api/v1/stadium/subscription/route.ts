import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Stadiums, ActivityLogs } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug || session.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, senderName, senderPhone, paymentScreenshot, amount } = body;

    // Validation
    if (!planId || !senderName || !senderPhone || !paymentScreenshot || !amount) {
      return NextResponse.json({
        success: false,
        error: 'جميع حقول التحويل وإيصال الدفع مطلوبة لإرسال طلب الاشتراك.'
      }, { status: 400 });
    }

    // Verify Stadium exists
    const stadium = await Stadiums.findBySlug(session.stadiumSlug);
    if (!stadium) {
      return NextResponse.json({ success: false, error: 'الملعب/الموقع غير موجود' }, { status: 404 });
    }

    // Update Stadium pending subscription request
    const pendingData = {
      planId,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      paymentScreenshot,
      amount: Number(amount),
      createdAt: new Date().toISOString(),
    };

    await Stadiums.update(session.stadiumSlug, {
      pendingSubscription: pendingData
    });

    // Log Activity
    ActivityLogs.log({
      action: 'submit_subscription_request',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: session.stadiumSlug,
      targetType: 'stadium',
      details: { planId, amount: pendingData.amount }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الاشتراك بنجاح وهو قيد المراجع الآن ⏳'
    }, { status: 200 });

  } catch (error) {
    console.error('POST stadium subscription request error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إرسال طلب الاشتراك' }, { status: 500 });
  }
}

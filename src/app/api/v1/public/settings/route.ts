import { NextResponse } from 'next/server';
import { PlatformSettingsDB } from '@/lib/db';

export async function GET() {
  try {
    const settings = await PlatformSettingsDB.get();
    return NextResponse.json({
      success: true,
      data: {
        billingMode: settings.billingMode || 'commission',
        defaultCommissionRate: settings.defaultCommissionRate ?? 5,
        monthlySubscriptionPrice: settings.monthlySubscriptionPrice ?? 200,
        platformName: settings.platformName || 'ملعبي',
        supportWhatsApp: settings.supportWhatsApp || '+201126947405',
      },
    });
  } catch (error) {
    console.error('Public settings API error:', error);
    return NextResponse.json({
      success: true,
      data: {
        billingMode: 'commission',
        defaultCommissionRate: 5,
        monthlySubscriptionPrice: 200,
        platformName: 'ملعبي',
        supportWhatsApp: '+201126947405',
      },
    });
  }
}
export const dynamic = 'force-dynamic';

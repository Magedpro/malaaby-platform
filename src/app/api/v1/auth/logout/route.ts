import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج' }, { status: 500 });
  }
}
export async function GET() {
  // Allow GET logout as fallback
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تسجيل الخروج' }, { status: 500 });
  }
}

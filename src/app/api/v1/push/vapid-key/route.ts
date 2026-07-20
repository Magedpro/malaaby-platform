import { NextResponse } from 'next/server';
import { getPublicKey } from '@/lib/push';

export async function GET() {
  try {
    const publicKey = getPublicKey();
    return NextResponse.json({ success: true, publicKey });
  } catch (error) {
    console.error('VAPID key endpoint error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

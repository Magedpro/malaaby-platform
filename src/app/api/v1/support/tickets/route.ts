import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { SupportTickets, ActivityLogs } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    let tickets = [];
    if (session.role === 'super_admin') {
      tickets = await SupportTickets.findAll();
    } else if (session.role === 'owner' && session.stadiumSlug) {
      tickets = await SupportTickets.findByStadium(session.stadiumSlug);
    } else {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: tickets });

  } catch (error) {
    console.error('Fetch support tickets error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب التذاكر' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.stadiumSlug || session.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { subject, message } = await req.json();

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'موضوع التذكرة مطلوب' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'محتوى الرسالة مطلوب' }, { status: 400 });
    }

    const ticket = await SupportTickets.create({
      stadiumSlug: session.stadiumSlug,
      ownerName: session.name,
      ownerEmail: session.email,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
    });

    ActivityLogs.log({
      action: 'create_support_ticket',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: ticket.id,
      targetType: 'settings', // Generic target
      details: { subject: ticket.subject },
    });

    return NextResponse.json({ success: true, data: ticket });

  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إنشاء التذكرة' }, { status: 500 });
  }
}

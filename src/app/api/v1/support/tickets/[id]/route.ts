import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { SupportTickets, ActivityLogs } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { TicketReply } from '@/lib/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'محتوى الرد مطلوب' }, { status: 400 });
    }

    const ticket = await SupportTickets.findById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 });
    }

    // Authorization check
    if (session.role !== 'super_admin' && ticket.stadiumSlug !== session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بالرد على هذه التذكرة' }, { status: 403 });
    }

    const reply: TicketReply = {
      id: generateId(),
      message: message.trim(),
      authorId: session.userId,
      authorName: session.name,
      isAdmin: session.role === 'super_admin',
      createdAt: new Date().toISOString(),
    };

    const updatedReplies = [...(ticket.replies || []), reply];
    const newStatus = session.role === 'super_admin' ? 'pending' : 'open'; // pending means admin replied, open means user replied

    const updated = await SupportTickets.update(id, {
      replies: updatedReplies,
      status: newStatus,
    });

    ActivityLogs.log({
      action: 'reply_support_ticket',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'settings',
      details: { isAdminReply: session.role === 'super_admin' },
    });

    return NextResponse.json({ success: true, data: updated });

  } catch (error) {
    console.error('Reply support ticket error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الرد على التذكرة' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status || !['open', 'pending', 'closed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'حالة التذكرة غير صالحة' }, { status: 400 });
    }

    const ticket = await SupportTickets.findById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 });
    }

    // Authorization
    if (session.role !== 'super_admin' && ticket.stadiumSlug !== session.stadiumSlug) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بتعديل هذه التذكرة' }, { status: 403 });
    }

    const updated = await SupportTickets.update(id, { status });

    ActivityLogs.log({
      action: 'update_ticket_status',
      performedBy: session.userId,
      performedByName: session.name,
      targetId: id,
      targetType: 'settings',
      details: { status },
    });

    return NextResponse.json({ success: true, data: updated });

  } catch (error) {
    console.error('Update support ticket status error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تحديث حالة التذكرة' }, { status: 500 });
  }
}

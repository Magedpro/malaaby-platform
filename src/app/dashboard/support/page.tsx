'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface Reply {
  id: string;
  message: string;
  authorName: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  stadiumSlug: string;
  ownerName: string;
  ownerEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

export default function DashboardSupport() {
  const { stadium } = useSession();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // New ticket form
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/v1/support/tickets');
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
        // Refresh selected ticket details if open
        if (selectedTicket) {
          const fresh = json.data.find((t: Ticket) => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      }
    } catch {
      showToast('فشل تحميل تذاكر الدعم الفني', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تم فتح تذكرة الدعم بنجاح ⏳', 'success');
        setSubject('');
        setMessage('');
        setNewTicketOpen(false);
        await loadTickets();
      } else {
        showToast(json.error || 'فشل فتح التذكرة', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/v1/support/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });
      const json = await res.json();

      if (json.success) {
        setReplyMessage('');
        await loadTickets();
      } else {
        showToast(json.error || 'فشل إرسال الرد', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm('هل أنت متأكد من إغلاق هذه التذكرة؟')) return;

    try {
      const res = await fetch(`/api/v1/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم إغلاق التذكرة بنجاح', 'success');
        await loadTickets();
      }
    } catch {
      showToast('فشل إغلاق التذكرة', 'error');
    }
  };

  const statusLabel = {
    open: 'مفتوحة (بانتظار الرد)',
    pending: 'تم الرد من الدعم الفني',
    closed: 'مغلقة',
  };

  const statusVariant = {
    open: 'warning',
    pending: 'success',
    closed: 'danger',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🎫 الدعم الفني والمساعدة</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            افتح تذكرة دعم فني لمساعدتك في أي مشكلة تخص لوحة التحكم أو اشتراكك.
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewTicketOpen(!newTicketOpen)}>
          {newTicketOpen ? 'إلغاء' : '🎫 تذكرة جديدة'}
        </Button>
      </div>

      {newTicketOpen && (
        <Card style={{ padding: '1.5rem', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>إنشاء تذكرة دعم جديدة</h3>
          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="عنوان التذكرة/الموضوع *"
              placeholder="مثال: مشكلة في تأكيد إيصال Vodafone Cash"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
            <div className="form-group">
              <label className="form-label">تفاصيل المشكلة والرسالة *</label>
              <textarea
                className="form-input form-textarea"
                placeholder="يرجى كتابة تفاصيل المشكلة بدقة لمساعدتك بأسرع شكل..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                style={{ minHeight: '120px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setNewTicketOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="primary" isLoading={submitting}>إرسال التذكرة</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedTicket ? '320px 1fr' : '1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>التذاكر الخاصة بك</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>جاري تحميل التذاكر...</p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <p style={{ color: 'var(--text-secondary)' }}>لا توجد تذاكر دعم مفتوحة حالياً.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                style={{
                  background: selectedTicket?.id === ticket.id ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-card)',
                  border: selectedTicket?.id === ticket.id ? '1px solid var(--primary-light)' : '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{ticket.subject}</h4>
                  <Badge variant={statusVariant[ticket.status] as any}>{statusLabel[ticket.status]}</Badge>
                </div>
                <p style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '0.75rem'
                }}>
                  {ticket.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>📅 {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</span>
                  <span>💬 {ticket.replies?.length || 0} ردود</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Chat Details */}
        {selectedTicket && (
          <Card style={{ display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
            {/* Top info bar */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedTicket.subject}</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  تذكرة رقم: {selectedTicket.id}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Badge variant={statusVariant[selectedTicket.status] as any}>{statusLabel[selectedTicket.status]}</Badge>
                {selectedTicket.status !== 'closed' && (
                  <Button variant="danger" size="sm" onClick={() => handleCloseTicket(selectedTicket.id)}>
                    إغلاق التذكرة
                  </Button>
                )}
              </div>
            </div>

            {/* Chat Messages Panel */}
            <div style={{
              flex: 1,
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              background: 'rgba(0,0,0,0.1)'
            }}>
              {/* Original message */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'flex-start',
                maxWidth: '75%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '0 12px 12px 12px',
                padding: '1rem',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {selectedTicket.ownerName} (أنت)
                </span>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', margin: 0 }}>
                  {selectedTicket.message}
                </p>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                  {new Date(selectedTicket.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map(reply => (
                <div
                  key={reply.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: reply.isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    background: reply.isAdmin ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-card)',
                    border: reply.isAdmin ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid var(--border-default)',
                    borderRadius: reply.isAdmin ? '12px 0 12px 12px' : '0 12px 12px 12px',
                    padding: '1rem',
                  }}
                >
                  <span style={{
                    fontSize: '0.75rem',
                    color: reply.isAdmin ? 'var(--success)' : 'var(--primary-light)',
                    fontWeight: 700,
                    marginBottom: '0.25rem'
                  }}>
                    {reply.authorName} {reply.isAdmin ? '🛠️ (الدعم الفني)' : ''}
                  </span>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', margin: 0 }}>
                    {reply.message}
                  </p>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                    {new Date(reply.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom input area */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--bg-card)'
            }}>
              {selectedTicket.status === 'closed' ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem', margin: 0 }}>
                  🔒 هذه التذكرة مغلقة. لا يمكنك إرسال ردود جديدة.
                </p>
              ) : (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="اكتب ردك هنا..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                  <Button type="submit" variant="primary" isLoading={replySubmitting} disabled={!replyMessage.trim()}>
                    إرسال الرد
                  </Button>
                </form>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

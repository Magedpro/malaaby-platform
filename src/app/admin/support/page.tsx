'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
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

export default function AdminSupport() {
  const { user } = useSession();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/v1/support/tickets');
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
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
    if (user && user.role === 'super_admin') {
      loadTickets();
    }
  }, [user]);

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

  const handleUpdateStatus = async (ticketId: string, status: 'open' | 'pending' | 'closed') => {
    try {
      const res = await fetch(`/api/v1/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم تحديث حالة التذكرة بنجاح', 'success');
        await loadTickets();
      } else {
        showToast(json.error || 'فشل تحديث الحالة', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم', 'error');
    }
  };

  const statusLabel = {
    open: 'بانتظار الرد (مفتوحة)',
    pending: 'تم الرد من الإدارة',
    closed: 'مغلقة',
  };

  const statusVariant = {
    open: 'warning',
    pending: 'success',
    closed: 'danger',
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesQuery = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.stadiumSlug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🎫 إدارة تذاكر الدعم الفني</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          استعراض والرد على استفسارات وتذاكر أصحاب الملاعب وإغلاقها فور حل المشكلات.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>تصفية الحالات:</span>
          {(['all', 'open', 'pending', 'closed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#fff',
                padding: '0.375rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
            >
              {status === 'all' ? 'الكل' : statusLabel[status]}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="البحث بالاسم، الإيميل، رابط الملعب، أو الموضوع..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ maxWidth: '340px', fontSize: '0.875rem' }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedTicket ? '360px 1fr' : '1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>التذاكر المتاحة ({filteredTickets.length})</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>جاري تحميل التذاكر...</p>
          ) : filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <p style={{ color: 'var(--text-secondary)' }}>لا توجد تذاكر تطابق معايير التصفية والبحث.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>🏟️ {ticket.stadiumSlug}</span>
                  <span>•</span>
                  <span>👤 {ticket.ownerName}</span>
                </div>
                <p style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
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
                  الملعب: <strong>{selectedTicket.stadiumSlug}</strong> | المرسل: <strong>{selectedTicket.ownerName} ({selectedTicket.ownerEmail})</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Badge variant={statusVariant[selectedTicket.status] as any}>{statusLabel[selectedTicket.status]}</Badge>
                {selectedTicket.status !== 'closed' ? (
                  <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}>
                    إغلاق وحل المشكلة
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}>
                    إعادة فتح التذكرة
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
                  {selectedTicket.ownerName} (صاحب الملعب)
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
                    {reply.authorName} {reply.isAdmin ? '🛠️ (أنت - المشرف)' : ''}
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
                  🔒 هذه التذكرة مغلقة. يجب إعادة فتحها لإرسال ردود جديدة.
                </p>
              ) : (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="اكتب رد الدعم الفني هنا لإرساله للمستخدم..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                  <Button type="submit" variant="primary" isLoading={replySubmitting} disabled={!replyMessage.trim()}>
                    إرسال رد الدعم
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

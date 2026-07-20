'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, timeAgo } from '@/lib/utils';

interface Notification {
  id: string; type: string; title: string;
  message: string; isRead: boolean; createdAt: string;
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/notifications');
      const json = await res.json();
      if (json.success) setNotifications(json.data.notifications);
    } catch { showToast('خطأ في تحميل الإشعارات', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch('/api/v1/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      showToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
      loadNotifications();
    } catch { showToast('فشل التحديث', 'error'); }
    finally { setMarking(false); }
  };

  const typeIcon = (type: string) => {
    switch(type) {
      case 'new_booking': return '⚽';
      case 'booking_approved': return '✅';
      case 'booking_rejected': return '❌';
      case 'booking_cancelled': return '🚫';
      case 'subscription_expiry': return '⚠️';
      default: return '🔔';
    }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>مركز الإشعارات</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>جميع تنبيهات الحجوزات والنظام في مكان واحد</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead} isLoading={marking}>
            تحديد الكل كمقروء ({unread})
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={80} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔔</span>
          <div className="empty-title">لا توجد إشعارات حتى الآن</div>
          <div className="empty-desc">ستظهر هنا تنبيهات الحجوزات الجديدة والتحديثات المهمة تلقائياً.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1.25rem',
                background: n.isRead ? 'var(--bg-card)' : 'rgba(22, 163, 74, 0.05)',
                border: `1px solid ${n.isRead ? 'var(--border-subtle)' : 'var(--border-primary)'}`,
                borderRadius: 'var(--radius-lg)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ fontSize: '1.75rem', flexShrink: 0, width: '44px', height: '44px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeIcon(n.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{n.title}</h4>
                  {!n.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '6px' }} />}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{n.message}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export const dynamic = 'force-dynamic';

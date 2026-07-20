'use client';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/v1/admin/owners').then(r => r.json()).then(j => {
      if (j.success) setOwners(j.data);
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    ({ active: 'success', trial: 'info', expired: 'danger', suspended: 'warning' }[s] || 'primary') as any;
  const statusLabel = (s: string) =>
    ({ active: 'نشط', trial: 'تجريبي', expired: 'منتهي', suspended: 'موقوف' }[s] || s);

  const filtered = filter === 'all' ? owners : owners.filter(o => o.subscriptionStatus === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إدارة الاشتراكات</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>مراقبة حالة اشتراكات جميع الملاك وتواريخ الانتهاء</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[['all','الكل'],['active','نشط'],['trial','تجريبي'],['expired','منتهي'],['suspended','موقوف']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '0.375rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-arabic)', border: 'none',
              background: filter === v ? 'var(--primary)' : 'var(--bg-elevated)',
              color: filter === v ? '#fff' : 'var(--text-secondary)',
            }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>المالك</th><th>الملعب</th><th>الخطة</th><th>الحالة</th><th>تاريخ الانتهاء</th><th>متبقي</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const expiry = o.subscriptionExpiry ? new Date(o.subscriptionExpiry) : null;
                const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;
                return (
                  <tr key={o.id}>
                    <td><div style={{ fontWeight: 600 }}>{o.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.email}</div></td>
                    <td style={{ fontSize: '0.875rem' }}>{o.stadiumName}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>برو</td>
                    <td><Badge variant={statusColor(o.subscriptionStatus)}>{statusLabel(o.subscriptionStatus)}</Badge></td>
                    <td style={{ fontSize: '0.875rem' }}>{expiry ? formatDate(expiry.toISOString()) : '—'}</td>
                    <td>
                      {daysLeft !== null ? (
                        <span style={{ color: daysLeft < 7 ? 'var(--danger)' : daysLeft < 30 ? 'var(--warning)' : 'var(--success)', fontWeight: 700, fontSize: '0.875rem' }}>
                          {daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export const dynamic = 'force-dynamic';

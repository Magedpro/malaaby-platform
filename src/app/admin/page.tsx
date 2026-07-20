'use client';

import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface AdminStats {
  totalOwners: number; activeOwners: number; suspendedOwners: number; pendingOwners: number;
  totalFields: number; totalBookings: number; todayBookings: number; monthlyBookings: number;
  totalRevenue: number; monthlyRevenue: number; activeSubscriptions: number; expiredSubscriptions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/stats').then(r => r.json()).then(j => {
      if (j.success) setStats(j.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Skeleton height={40} width="50%" />
      <div className="stats-grid">{[...Array(12)].map((_, i) => <Skeleton key={i} height={120} />)}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إحصائيات المنصة الشاملة</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>نظرة عامة على نشاط جميع الملاعب والاشتراكات في المنصة</p>
      </div>

      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الملاك والملاعب</h3>
        <div className="stats-grid">
          <StatCard label="إجمالي الملاك المسجلين" value={stats?.totalOwners || 0} icon="👥" color="blue" />
          <StatCard label="ملاك نشطون" value={stats?.activeOwners || 0} icon="✅" color="green" />
          <StatCard label="حسابات موقوفة" value={stats?.suspendedOwners || 0} icon="🚫" color="red" />
          <StatCard label="طلبات قيد الموافقة" value={stats?.pendingOwners || 0} icon="⏳" color="yellow" />
          <StatCard label="إجمالي الملاعب" value={stats?.totalFields || 0} icon="🏟️" color="green" />
        </div>
      </div>

      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الحجوزات والإيرادات</h3>
        <div className="stats-grid">
          <StatCard label="إجمالي الحجوزات" value={stats?.totalBookings || 0} icon="📅" color="blue" />
          <StatCard label="حجوزات اليوم" value={stats?.todayBookings || 0} icon="🗓️" color="green" />
          <StatCard label="حجوزات الشهر" value={stats?.monthlyBookings || 0} icon="📈" color="blue" />
          <StatCard label="إجمالي الإيرادات" value={formatCurrency(stats?.totalRevenue || 0)} icon="💰" color="green" />
          <StatCard label="إيرادات الشهر" value={formatCurrency(stats?.monthlyRevenue || 0)} icon="💵" color="blue" />
        </div>
      </div>

      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الاشتراكات</h3>
        <div className="stats-grid">
          <StatCard label="اشتراكات فعالة" value={stats?.activeSubscriptions || 0} icon="💎" color="green" />
          <StatCard label="اشتراكات منتهية" value={stats?.expiredSubscriptions || 0} icon="⚠️" color="yellow" />
        </div>
      </div>

      {/* Quick Actions */}
      <Card style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.125rem' }}>إجراءات سريعة</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { href: '/admin/owners', label: '👥 إدارة الملاك', variant: 'primary' },
            { href: '/admin/subscriptions', label: '💎 الاشتراكات', variant: 'secondary' },
            { href: '/admin/cities', label: '🏙️ إدارة المدن', variant: 'secondary' },
            { href: '/admin/logs', label: '📝 سجل النشاط', variant: 'secondary' },
          ].map(a => (
            <a key={a.href} href={a.href} className={`btn btn-${a.variant} btn-sm`}>{a.label}</a>
          ))}
        </div>
      </Card>
    </div>
  );
}
export const dynamic = 'force-dynamic';

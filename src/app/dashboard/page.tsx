'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { BOOKING_STATUSES } from '@/lib/constants';

interface DashboardStats {
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalFields: number;
  totalCustomers: number;
}

interface ChartItem {
  month: string;
  bookings: number;
  revenue: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/v1/bookings/stats');
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data.stats);
          setChartData(json.data.chartData);
          setRecentBookings(json.data.recentBookings);
        }
      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>التحليلات والإحصائيات</h2>
        {/* Stats Skeleton */}
        <div className="stats-grid">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const maxBookings = Math.max(...chartData.map((d) => d.bookings), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.50rem', fontWeight: 800 }}>لوحة المتابعة العامة</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>مراقبة فورية لأداء مجمع ملاعبك المالي وحالة المواعيد اليومية</p>
      </div>

      {/* Grid of 8 Stats Cards */}
      <div className="stats-grid">
        <StatCard label="حجوزات اليوم" value={stats?.todayBookings || 0} icon="📅" color="blue" />
        <StatCard label="طلبات معلقة مراجعة" value={stats?.pendingBookings || 0} icon="⏳" color="yellow" />
        <StatCard label="حجوزات مؤكدة" value={stats?.confirmedBookings || 0} icon="✅" color="green" />
        <StatCard label="حجوزات ملغية" value={stats?.cancelledBookings || 0} icon="❌" color="red" />
        <StatCard label="إيراد اليوم (المؤكد)" value={formatCurrency(stats?.todayRevenue || 0)} icon="💵" color="green" />
        <StatCard label="إيراد الشهر الحالي" value={formatCurrency(stats?.monthlyRevenue || 0)} icon="📈" color="blue" />
        <StatCard label="عدد الملاعب الفعالة" value={stats?.totalFields || 0} icon="🏟️" color="green" />
        <StatCard label="إجمالي اللاعبين" value={stats?.totalCustomers || 0} icon="👥" color="blue" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.5rem' }}>
        
        {/* Revenue CSS Chart */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 className="feature-title" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>نمو الإيرادات الشهرية (ج.م)</h3>
          <div
            style={{
              display: 'flex',
              height: '200px',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0 1rem',
            }}
          >
            {chartData.map((d, i) => {
              const pct = (d.revenue / maxRevenue) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--primary-light)', marginBottom: '0.25rem' }}>
                    {d.revenue > 0 ? formatCurrency(d.revenue).replace('جم', '') : ''}
                  </div>
                  <div
                    style={{
                      height: `${Math.max(pct, 5)}%`,
                      width: '100%',
                      background: 'linear-gradient(to top, var(--primary-dark), var(--primary-light))',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      boxShadow: 'var(--shadow-primary)',
                      transition: 'height 0.5s ease',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{d.month}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bookings CSS Chart */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 className="feature-title" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>إحصائيات الحجوزات الشهرية</h3>
          <div
            style={{
              display: 'flex',
              height: '200px',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0 1rem',
            }}
          >
            {chartData.map((d, i) => {
              const pct = (d.bookings / maxBookings) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginBottom: '0.25rem' }}>
                    {d.bookings > 0 ? `${d.bookings} حجز` : ''}
                  </div>
                  <div
                    style={{
                      height: `${Math.max(pct, 5)}%`,
                      width: '100%',
                      background: 'linear-gradient(to top, #1e3a8a, var(--info))',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 0.5s ease',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{d.month}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 className="feature-title" style={{ fontSize: '1.125rem' }}>أحدث الحجوزات المستلمة</h3>
          <Link href="/dashboard/bookings" style={{ color: 'var(--primary-light)', fontSize: '0.875rem', fontWeight: 600 }}>
            عرض جميع الحجوزات ↗
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">⚽</span>
            <div className="empty-title">لا توجد حجوزات حتى الآن</div>
            <div className="empty-desc">ستظهر الحجوزات الجديدة هنا فور قيام اللاعبين بطلبها.</div>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم اللاعب</th>
                  <th>الهاتف</th>
                  <th>التاريخ</th>
                  <th>التوقيت</th>
                  <th>المبلغ</th>
                  <th>حالة الحجز</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{b.customerPhone}</td>
                    <td>{formatDate(b.date)}</td>
                    <td>
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                      {formatCurrency(b.amount)}
                    </td>
                    <td>
                      <Badge variant={BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]?.color || 'primary'}>
                        {BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]?.label || b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
export const dynamic = 'force-dynamic';

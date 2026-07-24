'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import Link from 'next/link';

function daysSince(createdAtStr?: string): number {
  if (!createdAtStr) return 999;
  const createdTime = Date.parse(createdAtStr);
  if (isNaN(createdTime)) return 999;
  return Math.floor((Date.now() - createdTime) / 86400000);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, stadium, loading } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const daysOld = daysSince((stadium as any)?.createdAt);
  const isFreeMonth = daysOld < 30;
  const remainingFreeDays = Math.max(0, 30 - daysOld);

  // 5 days or less warning calculation
  const show5DayWarning = isFreeMonth && remainingFreeDays <= 5;
  const isCommissionBlocked = (stadium as any)?.commissionStatus === 'blocked';
  const isOnSubscriptionPage = pathname === '/dashboard/subscription';

  // Automatically close sidebar whenever route/pathname changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Fetch notification count
  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      const json = await res.json();
      if (json.success && json.data) {
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications count:', e);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchNotifCount();
      const timer = setInterval(fetchNotifCount, 30000);
      return () => clearInterval(timer);
    }
  }, [user, loading, router, fetchNotifCount]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', width: '200px' }}>
          <div className="btn-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontWeight: 600 }}>جاري تحميل لوحة التحكم...</h3>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-layout animate-fadeIn">
      {/* Sidebar navigation */}
      <DashboardSidebar
        unreadNotifications={unreadCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main workspace */}
      <div className="dashboard-main">
        <DashboardTopbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          unreadNotifications={unreadCount}
        />

        {/* 5-Day Reminder Banner (Warning before trial ends or overdue) */}
        {show5DayWarning && !isOnSubscriptionPage && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))',
            borderBottom: '1px solid rgba(245,158,11,0.4)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 700 }}>
              ⚠️ تذكير هام: متبقي <strong>{remainingFreeDays} {remainingFreeDays === 1 ? 'يوم واحد' : 'أيام'}</strong> على انتهاء الشهر التجريبي المجاني للملعب وبدء المحاسبة الشهرية.
            </p>
            <Link
              href="/dashboard/subscription"
              style={{
                background: '#f59e0b',
                color: '#fff',
                padding: '0.35rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              💳 عرض المستحقات والسداد
            </Link>
          </div>
        )}

        {/* Regular Free Month Banner */}
        {isFreeMonth && !show5DayWarning && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
            borderBottom: '1px solid rgba(16,185,129,0.3)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 700 }}>
              🎁 هدية التسجيل: أنت الآن في **الشهر الأول المجاني بالكامل** (متبقي <strong>{remainingFreeDays} يوم</strong>) — بدون أي عمولات!
            </p>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16,185,129,0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem', color: '#059669', fontWeight: 600 }}>
              عمولة 0% حالياً
            </span>
          </div>
        )}

        <main className="dashboard-content">{children}</main>
      </div>

      {/* Overdue / Blocked Account Lockout Overlay */}
      {isCommissionBlocked && !isOnSubscriptionPage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid var(--danger)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⛔</div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--danger)' }}>
              تم حجب لوحة التحكم مؤقتاً
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.75rem', fontSize: '0.9375rem' }}>
              تأخر سداد مستحقات عمولات الحجوزات الشهرية للمنصة (5 ج.م/حجز). <br />
              يرجى سداد المستحقات المتبقية ورفع صورة التحويل ليتم فك الحجب والموافقة فوراً من صاحب الموقع.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/dashboard/subscription"
                style={{
                  display: 'inline-block',
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '0.875rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                💳 سداد المستحقات الآن
              </Link>
              <a
                href="https://wa.me/201126947405?text=مرحباً،%20قمت%20بسداد%20عمولة%20الملعب%20وأريد%20فك%20الحجب"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#25D366',
                  color: '#fff',
                  padding: '0.875rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                💬 تواصل مع الأدمن
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Dark overlay backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          onTouchEnd={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 999,
            backdropFilter: 'blur(3px)',
            touchAction: 'manipulation',
          }}
        />
      )}

      {/* Floating support button for stadium owner */}
      <FloatingWhatsApp
        phone="201126947405"
        message="مرحباً، أحتاج إلى دعم فني بخصوص لوحة تحكم ملعبي 🏟️"
        tooltip="الدعم الفني للمنصة"
        position="bottom-left"
        pulseColor="#3b82f6"
      />
    </div>
  );
}
export const dynamic = 'force-dynamic';

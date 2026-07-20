'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';
import { Skeleton } from '@/components/ui/Skeleton';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import { FloatingSubscription } from '@/components/ui/FloatingSubscription';
import Link from 'next/link';

function daysLeft(expiryStr?: string): number | null {
  if (!expiryStr) return null;
  const parsed = Date.parse(expiryStr);
  if (isNaN(parsed)) return null;
  return Math.ceil((parsed - Date.now()) / 86400000);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, stadium, loading } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const subStatus = (stadium as any)?.subscriptionStatus || 'trial';
  const subExpiry = (stadium as any)?.subscriptionExpiry;
  
  let remaining = daysLeft(subExpiry);
  if (remaining === null && subStatus === 'trial') {
    remaining = 60; // Fallback to 60 days
  }

  const isExpired = subStatus === 'expired' || (remaining !== null && remaining <= 0 && subStatus !== 'trial');
  const isTrial = subStatus === 'trial';
  const isOnSubscriptionPage = pathname === '/dashboard/subscription';

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
      // Poll notifications every 30 seconds for live updates
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

        {/* Trial Warning Banner */}
        {isTrial && !isOnSubscriptionPage && remaining !== null && remaining > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
            borderBottom: '1px solid rgba(245,158,11,0.3)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--warning)', fontWeight: 600 }}>
              ⏳ أنت الآن في الفترة التجريبية المجانية (60 يوماً) — متبقي لك <strong>{remaining} يوم</strong> للاستخدام المجاني.
              يمكنك الاشتراك في أي وقت لتفعيل الخطة المدفوعة.
            </p>
            <Link
              href="/dashboard/subscription"
              style={{
                background: 'var(--warning)',
                color: '#fff',
                padding: '0.375rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >💳 اشترك الآن</Link>
          </div>
        )}

        <main className="dashboard-content">{children}</main>
      </div>

      {/* Expired Subscription Overlay */}
      {isExpired && !isOnSubscriptionPage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            maxWidth: '460px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, marginBottom: '0.75rem' }}>انتهى اشتراكك</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.75rem', fontSize: '0.9375rem' }}>
              لقد انتهت فترة اشتراكك. يرجى تجديد الاشتراك لمتابعة استخدام لوحة التحكم وإدارة الحجوزات.
            </p>
            <Link
              href="/dashboard/subscription"
              style={{
                display: 'inline-block',
                background: 'var(--primary)',
                color: '#fff',
                padding: '0.875rem 2rem',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
              }}
            >💳 تجديد الاشتراك الآن</Link>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Floating support button for stadium owner */}
      <FloatingWhatsApp
        phone="201126947405"
        message="مرحباً، أحتاج إلى دعم فني بخصوص لوحة تحكم ملعبي 🏟️"
        tooltip="الدعم الفني للمنصة"
        position="bottom-left"
        pulseColor="#3b82f6" /* Blue pulse for dashboard support */
      />

      {/* Floating subscription button (only shows during trial/expired status) */}
      <FloatingSubscription position="bottom-right" />
    </div>
  );
}
export const dynamic = 'force-dynamic';

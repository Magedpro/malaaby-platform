'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';
import { Skeleton } from '@/components/ui/Skeleton';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        <main className="dashboard-content">{children}</main>
      </div>

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
    </div>
  );
}
export const dynamic = 'force-dynamic';

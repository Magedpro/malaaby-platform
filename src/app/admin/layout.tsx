'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="btn-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
        <p>جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );

  if (!user || user.role !== 'super_admin') return null;

  const navItems = [
    { path: '/admin', label: 'لوحة الإشراف', icon: '📊' },
    { path: '/admin/owners', label: 'إدارة الملاك', icon: '👥' },
    { path: '/admin/subscriptions', label: 'الاشتراكات', icon: '💎' },
    { path: '/admin/cities', label: 'المدن', icon: '🏙️' },
    { path: '/admin/support', label: 'تذاكر الدعم', icon: '🎫' },
    { path: '/admin/logs', label: 'سجل النشاط', icon: '📝' },
    { path: '/admin/settings', label: 'إعدادات المنصة', icon: '⚙️' },
  ];

  return (
    <div className="dashboard-layout animate-fadeIn">
      {/* Admin sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ background: '#0a1628', borderLeftColor: 'rgba(22,163,74,0.2)' }}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 800, fontSize: '1.125rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#16A34A,#15803D)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
            <span>إشراف المنصة</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSidebarOpen(false);
            }}
            className="sidebar-close-btn"
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
          <div className="divider" />
          <a href="/" className="nav-item" style={{ color: 'var(--primary-light)' }} onClick={() => setSidebarOpen(false)}>
            <span style={{ fontSize: '1.25rem' }}>🌐</span>
            <span>الموقع العام ↗</span>
          </a>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
            className="nav-item"
            style={{ width: '100%', textAlign: 'right', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '1.25rem' }}>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar" style={{ background: '#0a1628', borderBottomColor: 'rgba(22,163,74,0.2)' }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none', fontSize: '1.25rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            id="admin-menu-toggle"
          >
            ☰
          </button>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            🛡️ لوحة إشراف منصة <span className="gradient-text">ملعبي</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-subtle)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)' }}>
              مشرف رئيسي
            </div>
            <div className="avatar-fallback" style={{ width: '34px', height: '34px', fontSize: '0.875rem' }}>
              {user.name?.[0] || 'أ'}
            </div>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(3px)' }}
        />
      )}

      <style jsx global>{`
        .sidebar-close-btn {
          display: none;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: bold;
          cursor: pointer;
          line-height: 1;
        }
        @media (max-width: 1024px) {
          #admin-menu-toggle { display: flex !important; }
          .sidebar-close-btn { display: flex !important; }
          .sidebar.open { z-index: 1000 !important; }
        }
      `}</style>
    </div>
  );
}
export const dynamic = 'force-dynamic';

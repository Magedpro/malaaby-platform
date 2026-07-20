'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

interface SidebarProps {
  unreadNotifications: number;
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({
  unreadNotifications,
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const { user, stadium, logout } = useSession();

  const subStatus = (stadium as any)?.subscriptionStatus;
  const subExpiry = (stadium as any)?.subscriptionExpiry;
  const daysLeft = subExpiry ? Math.ceil((new Date(subExpiry).getTime() - Date.now()) / 86400000) : null;
  const showSubWarning = subStatus === 'trial' || subStatus === 'expired' || (daysLeft !== null && daysLeft <= 30);
  
  // Show remaining days in the sidebar badge (e.g. 58 days, or 'منتهي' / '!')
  const subBadge = subStatus === 'expired' || (daysLeft !== null && daysLeft <= 0)
    ? 'منتهي'
    : (daysLeft !== null)
      ? `${daysLeft} يوم`
      : undefined;

  const menuItems = [
    { label: 'نظرة عامة', path: '/dashboard', icon: '📊' },
    { label: 'إدارة الملاعب', path: '/dashboard/fields', icon: '🏟️' },
    { label: 'مراجعة الحجوزات', path: '/dashboard/bookings', icon: '🧾' },
    { label: 'تقويم الحجوزات', path: '/dashboard/calendar', icon: '📅' },
    { label: 'إشعارات الملعب', path: '/dashboard/notifications', icon: '🔔', badge: unreadNotifications },
    { label: 'باقة الاشتراك', path: '/dashboard/subscription', icon: '💳', subBadge, subWarning: showSubWarning },
    { label: 'إعدادات الملعب', path: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Logo */}
      <div className="sidebar-logo">
        <Link href="/" className="navbar-logo" onClick={onClose}>
          <div className="logo-icon">🏟️</div>
          <span>لوحة التحكم</span>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              style={(item as any).subWarning && !isActive ? { color: 'var(--warning)' } : undefined}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
              {(item as any).subBadge && (
                <span className="nav-badge" style={{ 
                  background: (item as any).subBadge === 'منتهي' ? 'var(--danger)' : 'var(--warning)', 
                  color: '#fff',
                  borderRadius: 'var(--radius-md)', 
                  padding: '2px 8px', 
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  height: 'auto',
                  lineHeight: '1.2'
                }}>{(item as any).subBadge}</span>
              )}
            </Link>
          );
        })}

        <div className="divider" />

        {/* Public Booking Link */}
        {user?.stadiumSlug && (
          <a
            href={`/${user.stadiumSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            style={{ color: 'var(--primary-light)' }}
          >
            <span style={{ fontSize: '1.25rem' }}>🌐</span>
            <span>موقع حجز الملاعب ↗</span>
          </a>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="nav-item"
          style={{ width: '100%', textAlign: 'right', marginTop: 'auto', color: 'var(--danger)' }}
        >
          <span style={{ fontSize: '1.25rem' }}>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </nav>
    </aside>
  );
};
export default DashboardSidebar;

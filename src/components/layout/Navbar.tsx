'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="logo-icon">🏟️</div>
          <span>ملعبي <span className="gradient-text">Malaaby</span></span>
        </Link>

        {/* Links (Desktop) */}
        <ul className="navbar-links">
          <li><Link href="/#hero" className="navbar-link">الرئيسية</Link></li>
          <li><Link href="/#features" className="navbar-link">المميزات</Link></li>
          <li><Link href="/#how-it-works" className="navbar-link">كيف نعمل</Link></li>
          <li><Link href="/#pricing" className="navbar-link">الأسعار</Link></li>
          <li><Link href="/#faq" className="navbar-link">الأسئلة الشائعة</Link></li>
          <li><Link href="/#contact" className="navbar-link">اتصل بنا</Link></li>
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              {user.role === 'super_admin' ? (
                <Link href="/admin">
                  <Button variant="primary" size="sm">لوحة الإشراف</Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="primary" size="sm">لوحة التحكم</Button>
                </Link>
              )}
              <Button variant="secondary" size="sm" onClick={logout}>خروج</Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">تسجيل دخول</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">أنشئ ملعبك</Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none' }} /* Visible in CSS at 768px media query via JS toggle below */
            className="navbar-mobile-toggle"
            aria-label="قائمة التنقل"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Links Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--navbar-height)',
            left: 0,
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 199,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <Link href="/#hero" className="navbar-link">الرئيسية</Link>
          <Link href="/#features" className="navbar-link">المميزات</Link>
          <Link href="/#how-it-works" className="navbar-link">كيف نعمل</Link>
          <Link href="/#pricing" className="navbar-link">الأسعار</Link>
          <Link href="/#faq" className="navbar-link">الأسئلة الشائعة</Link>
          <Link href="/#contact" className="navbar-link">اتصل بنا</Link>
        </div>
      )}

      {/* Simple style override to display menu toggle properly on mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .navbar-mobile-toggle {
            display: flex !important;
            font-size: 1.5rem;
            color: var(--text-primary);
            padding: 0.25rem 0.5rem;
          }
        }
      `}</style>
    </nav>
  );
};
export default Navbar;

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugLink, setDebugLink] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('البريد الإلكتروني غير صحيح', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تم إرسال رابط الاستعادة بنجاح 📨', 'success');
        setSubmitted(true);
        if (json.debugLink) {
          setDebugLink(json.debugLink);
        }
      } else {
        showToast(json.error || 'حدث خطأ في معالجة طلبك', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeIn">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🏟️</span>
            <span>ملعبي <span className="gradient-text">Malaaby</span></span>
          </Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem', color: 'var(--text-primary)' }}>
            استعادة كلمة المرور
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لتعيين كلمة مرور جديدة
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Button type="submit" variant="primary" isLoading={loading} fullWidth>
              إرسال رابط الاستعادة
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              تم إرسال تعليمات الاستعادة!
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
              إذا كان البريد الإلكتروني مسجلاً لدينا، فستتلقى رسالة تحتوي على رابط لتعيين كلمة مرور جديدة قريباً.
            </p>

            {/* Test Helper for Development */}
            {debugLink && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(22,163,74,0.08)',
                border: '1px dashed rgba(22,163,74,0.3)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                direction: 'ltr'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'right', direction: 'rtl' }}>
                  🛠️ تجربة المطور (مؤقت للاختبار):
                </p>
                <a href={debugLink} style={{ fontSize: '0.75rem', color: '#60a5fa', wordBreak: 'break-all' }}>
                  {debugLink}
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
            العودة لصفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}

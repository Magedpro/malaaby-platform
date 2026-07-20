'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

// Inner component that uses useSearchParams — must be inside Suspense
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!token || !email) {
      showToast('رابط استعادة كلمة المرور غير صالح أو ينقصه معلمات الاستعادة', 'error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      showToast('ينقصك معلمات الاستعادة، يرجى تقديم طلب جديد', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تمت إعادة تعيين كلمة المرور بنجاح 🎉', 'success');
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        showToast(json.error || 'فشل إعادة تعيين كلمة المرور', 'error');
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              🏟️
            </span>
            <span>
              ملعبي <span className="gradient-text">Malaaby</span>
            </span>
          </Link>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginTop: '1.5rem',
              color: 'var(--text-primary)',
            }}
          >
            تعيين كلمة المرور الجديدة
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
            }}
          >
            يرجى إدخال كلمة المرور الجديدة الخاصة بك وتأكيدها أدناه
          </p>
        </div>

        {!success ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <Input
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={!token || !email}
              fullWidth
            >
              تحديث كلمة المرور
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              تم التحديث بنجاح!
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.5rem',
              }}
            >
              تم تعيين كلمة المرور الجديدة. سيتم تحويلك إلى صفحة تسجيل الدخول
              تلقائياً خلال ثوانٍ.
            </p>
            <Link href="/login" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
              <Button variant="secondary">انتقل لتسجيل الدخول فوراً</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Outer page component — provides Suspense boundary required by Next.js for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              جاري تحميل صفحة استعادة كلمة المرور...
            </p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // If user is already logged in, redirect away
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side quick check
    let hasError = false;
    const newErrors: { email?: string; password?: string } = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
      hasError = true;
    }
    if (!password || password.length < 1) {
      newErrors.password = 'كلمة المرور مطلوبة';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تم تسجيل الدخول بنجاح! مرحباً بك.', 'success');
        await refresh(); // reload session context
      } else {
        showToast(json.error || 'فشل تسجيل الدخول', 'error');
        if (json.errors) {
          setErrors(json.errors);
        }
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand/Back */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🏟️</span>
            <span>ملعبي <span className="gradient-text">Malaaby</span></span>
          </Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem', color: 'var(--text-primary)' }}>
            سجل دخولك إلى لوحة التحكم
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            أدخل حسابك لإدارة الحجوزات وإعدادات ملاعبك
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={loading}
            required
          />

          <Input
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={loading}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
              <span>تذكرني على هذا الجهاز</span>
            </label>
            
            <Link href="/forgot" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button type="submit" variant="primary" isLoading={loading} fullWidth>
            تسجيل الدخول
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>ليس لديك حساب مالك ملعب؟ </span>
          <Link href="/register" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
            سجل ملعبك الآن
          </Link>
        </div>
      </div>
    </div>
  );
}

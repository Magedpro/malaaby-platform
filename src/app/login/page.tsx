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
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({});

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

  // Step 1: Initial Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
        if (json.requiresOtp) {
          setStep('otp');
          showToast(json.message || 'تم إرسال رمز الأمان إلى إيميلك 📧', 'success');
        } else {
          showToast('تم تسجيل الدخول بنجاح! مرحباً بك.', 'success');
          await refresh();
        }
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

  // Step 2: OTP Verification Submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrors({ otp: 'يرجى إدخال كود الأمان المكون من 6 أرقام' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otpCode: otpCode.trim() }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تم التحقق بنجاح! مرحباً بك 🛡️', 'success');
        await refresh();
      } else {
        showToast(json.error || 'رمز الأمان غير صحيح', 'error');
        setErrors({ otp: json.error });
      }
    } catch {
      showToast('حدث خطأ أثناء التحقق، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم إعادة إرسال رمز الأمان إلى إيميلك بنجاح 📧', 'success');
      } else {
        showToast(json.error || 'فشل إعادة الإرسال', 'error');
      }
    } catch {
      showToast('حدث خطأ في إعادة إرسال الرمز', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand/Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🏟️</span>
            <span>ملعبي <span className="gradient-text">Malaaby</span></span>
          </Link>
          
          {step === 'login' ? (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem', color: 'var(--text-primary)' }}>
                سجل دخولك إلى لوحة التحكم
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                أدخل حسابك لإدارة الحجوزات وإعدادات ملاعبك
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', marginTop: '1rem' }}>🔐</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                التوثيق بخطوتين (2FA)
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                تم إرسال كود مكون من 6 أرقام إلى إيميلك: <br />
                <strong style={{ color: 'var(--primary-light)', direction: 'ltr', display: 'inline-block' }}>{email}</strong>
              </p>
            </>
          )}
        </div>

        {step === 'login' ? (
          /* Step 1: Login Form */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              تسجيل الدخول 🔒
            </Button>
          </form>
        ) : (
          /* Step 2: OTP Form */
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                كود الأمان (OTP)
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
                style={{
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: errors.otp ? '2px solid var(--danger)' : '2px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
              {errors.otp && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{errors.otp}</span>
              )}
            </div>

            <Button type="submit" variant="primary" isLoading={loading} fullWidth>
              تأكيد كود الأمان 🛡️
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 إعادة إرسال الكود
              </button>

              <button
                type="button"
                onClick={() => { setStep('login'); setOtpCode(''); }}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ← العودة لصفحة الدخول
              </button>
            </div>
          </form>
        )}

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

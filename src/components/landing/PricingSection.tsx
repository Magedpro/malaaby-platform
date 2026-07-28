'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PLATFORM_PAYMENT_PHONE } from '@/lib/constants';

interface BillingSettings {
  billingMode: 'commission' | 'subscription';
  defaultCommissionRate: number;
  monthlySubscriptionPrice: number;
}

export const PricingSection: React.FC = () => {
  const [settings, setSettings] = useState<BillingSettings>({
    billingMode: 'commission',
    defaultCommissionRate: 5,
    monthlySubscriptionPrice: 200,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/public/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isCommissionMode = settings.billingMode === 'commission';
  const rate = settings.defaultCommissionRate ?? 5;
  const subPrice = settings.monthlySubscriptionPrice ?? 200;

  return (
    <section id="pricing" className="section bg-surface" style={{ backgroundColor: 'var(--bg-surface)', padding: '4rem 0' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            <span>🎁</span> الشهر الأول مجاناً 100% لكل ملعب جديد!
          </div>

          <h2 className="section-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, lineHeight: 1.3 }}>
            {isCommissionMode ? 'خطط أسعار عادلة وبسيطة — بدون اشتراكات شهرية ثقيلة!' : 'باقات الاشتراك الشهري الميسرة لمجمع ملعبك'}
          </h2>

          <p className="section-desc" style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.7 }}>
            {isCommissionMode ? (
              <>
                نوفر لك نظام محاسبة بالعمولة البسيطة (<strong>{rate} جنيه فقط لكل حجز مكتمل</strong>). لا توجد رسوم إدارية ولا اشتراكات شهرياً. تدفع فقط عندما يربح ملعبك!
              </>
            ) : (
              <>
                نظام اشتراك شهري ثابت بقيمة <strong>{subPrice} ج.م / شهرياً</strong> مع استخدام غير محدود لكافة مميزات المنصة ولوحات التحكم.
              </>
            )}
          </p>
        </div>

        {/* Pricing Content Grid based on Billing Mode */}
        {isCommissionMode ? (
          /* COMMISSION MODE DISPLAY */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1100px',
            margin: '0 auto',
            alignItems: 'stretch',
          }}>
            {/* Card 1: Free Month */}
            <Card className="pricing-card animate-fadeInUp" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'visible',
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>🎁</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>الشهر الأول مجاناً 100%</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  ابدأ فوراً بدون أي تكاليف. احصل على 30 يوماً تجريبية كاملة بدون أي عمولات إطلاقاً.
                </p>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginBottom: '1.5rem' }}>
                  0 ج.م <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ أول 30 يوماً</span>
                </div>
                <ul className="pricing-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span> تفعيل فورى لصفحة ملعبك
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span> استقبال حجوزات غير محدودة
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span> عمولة 0% على كافة الحجوزات
                  </li>
                </ul>
              </div>
              <Link href="/register" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" fullWidth style={{ borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>
                  ابدأ الشهر المجاني الآن
                </Button>
              </Link>
            </Card>

            {/* Card 2: 5 EGP Commission (Featured) */}
            <Card className="pricing-card featured animate-fadeInUp" style={{
              background: 'var(--bg-card)',
              border: '2px solid #10b981',
              borderRadius: 'var(--radius-xl)',
              padding: '0 0 1.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(16, 185, 129, 0.2)',
            }}>
              {/* Top Banner Ribbon */}
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: 800,
                padding: '0.4rem 1rem',
                letterSpacing: '0.02em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                🔥 الأكثر عدلاً وشعبية
              </div>

              <div style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>⚡</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-main)' }}>نظام العمولة الثابتة</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  بعد انتهاء الشهر المجاني، يتم تحصيل عمولة رمزية ثابتة عن كل حجز يكتمل بنجاح.
                </p>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-light)', marginBottom: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span>{rate} ج.م</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ لكل حجز مكتمل</span>
                </div>
                <ul className="pricing-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <li style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 900, fontSize: '1rem' }}>✓</span> تدفع فقط عند تنفيذ وحضور الحجز
                  </li>
                  <li style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 900, fontSize: '1rem' }}>✓</span> لا توجد عمولة على الحجوزات الملغاة
                  </li>
                  <li style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 900, fontSize: '1rem' }}>✓</span> بدون أي رسوم أو اشتراكات شهرية
                  </li>
                  <li style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 900, fontSize: '1rem' }}>✓</span> لوحة تقارير مالية وتنبيهات فورية
                  </li>
                </ul>
              </div>
              <div style={{ padding: '0 1.5rem' }}>
                <Link href="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" fullWidth style={{ borderRadius: 'var(--radius-lg)', fontWeight: 800, padding: '0.875rem' }}>
                    سجل ملعبك مجاناً الآن 🚀
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Card 3: Flexible Payment */}
            <Card className="pricing-card animate-fadeInUp" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>📱</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>طرق سداد وتتحصيل ميسرة</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  سدد عمولاتك في أي وقت خلال الشهر بسهولة عبر وسائلك المفضلة.
                </p>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)', marginBottom: '1.5rem', direction: 'ltr', textAlign: 'right' }}>
                  {PLATFORM_PAYMENT_PHONE}
                </div>
                <ul className="pricing-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 900 }}>✓</span> سداد عبر فودافون كاش
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 900 }}>✓</span> سداد عبر تطبيق انستا باي (InstaPay)
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 900 }}>✓</span> إمكانية السداد في أي وقت من الشهر
                  </li>
                </ul>
              </div>
              <a href={`https://wa.me/201126947405?text=مرحباً،%20أريد%20الاستفسار%20عن%20طريقة%20سداد%20عمولات%20الملعب`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" fullWidth style={{ borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>
                  💬 تواصل مع الدعم الفني
                </Button>
              </a>
            </Card>
          </div>
        ) : (
          /* SUBSCRIPTION MODE DISPLAY */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            <Card className="pricing-card featured animate-fadeInUp" style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>خطة الاشتراك الشهري الشاملة</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem' }}>
                إدارة كاملة لملعبك واستقبال حجوزات غير محدودة بسعر ثابت بدون عمولات فردية.
              </p>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-light)', marginBottom: '1.5rem' }}>
                {subPrice} ج.م <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ شهرياً</span>
              </div>
              <Link href="/register" style={{ textDecoration: 'none' }}>
                <Button variant="primary" fullWidth style={{ padding: '0.875rem', fontWeight: 800 }}>
                  اشترك الآن واستمتع بالشهر التجريبي المجاني 🚀
                </Button>
              </Link>
            </Card>
          </div>
        )}

      </div>
    </section>
  );
};

export default PricingSection;

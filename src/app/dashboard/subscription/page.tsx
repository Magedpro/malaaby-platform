'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PLANS = [
  {
    id: 'plan-basic',
    name: 'الخطة البرونزية',
    icon: '🥉',
    price: 500,
    maxFields: 1,
    color: '#cd7f32',
    colorBg: 'rgba(205,127,50,0.08)',
    colorBorder: 'rgba(205,127,50,0.3)',
    features: ['إدارة ملعب واحد فقط', 'لوحة تحكم كاملة', 'إدارة الحجوزات والمدفوعات', 'إشعارات واتساب وبريد إلكتروني', 'دعم فني عبر واتساب'],
    isPopular: false,
  },
  {
    id: 'plan-pro',
    name: 'الخطة الفضية',
    icon: '🥈',
    price: 1000,
    maxFields: 2,
    color: '#a8a9ad',
    colorBg: 'rgba(168,169,173,0.08)',
    colorBorder: 'rgba(168,169,173,0.3)',
    features: ['إدارة ملعبين (2 ملعب)', 'تقويم حجوزات تفاعلي', 'تقارير الإيرادات اليومية', 'دعم فني سريع الاستجابة', 'إحصائيات مالية شهرية'],
    isPopular: true,
  },
  {
    id: 'plan-premium',
    name: 'الخطة الذهبية',
    icon: '🥇',
    price: 5000,
    maxFields: -1,
    color: '#ffd700',
    colorBg: 'rgba(255,215,0,0.08)',
    colorBorder: 'rgba(255,215,0,0.3)',
    features: ['ملاعب غير محدودة', 'جميع مميزات الخطة الفضية', 'تقارير مالية تفصيلية', 'أولوية قصوى في الدعم الفني 24/7', 'تأكيد ودعم فوري'],
    isPopular: false,
  },
];

const PAYMENT_NUMBER = '01126947405';

function daysLeft(expiryStr?: string): number | null {
  if (!expiryStr) return null;
  const expiry = new Date(expiryStr);
  return Math.ceil((expiry.getTime() - Date.now()) / 86400000);
}

export default function SubscriptionPage() {
  const { stadium } = useSession();
  const { showToast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentPlanId = (stadium as any)?.subscriptionPlanId || 'plan-basic';
  const subscriptionStatus = (stadium as any)?.subscriptionStatus || 'trial';
  const subscriptionExpiry = (stadium as any)?.subscriptionExpiry;
  const pendingSubscription = (stadium as any)?.pendingSubscription;
  const remaining = daysLeft(subscriptionExpiry);

  const statusLabel: Record<string, string> = {
    trial: 'تجربة مجانية',
    active: 'نشط',
    expired: 'منتهي',
    suspended: 'موقوف',
  };
  const statusVariant: Record<string, string> = {
    trial: 'info',
    active: 'success',
    expired: 'danger',
    suspended: 'warning',
  };

  const currentPlan = PLANS.find(p => p.id === currentPlanId);

  // Auto-fill amount when plan is selected
  useEffect(() => {
    if (selectedPlan) {
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (plan) setAmount(String(plan.price));
    }
  }, [selectedPlan]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      // Upload
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setReceiptUrl(json.url);
        showToast('تم رفع الإيصال بنجاح ✅', 'success');
      } else {
        showToast(json.error || 'فشل رفع الإيصال', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء رفع الإيصال', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) { showToast('يرجى اختيار خطة الاشتراك', 'error'); return; }
    if (!senderName.trim()) { showToast('يرجى إدخال اسم المرسل', 'error'); return; }
    if (!senderPhone.trim()) { showToast('يرجى إدخال رقم هاتف المرسل', 'error'); return; }
    if (!receiptUrl) { showToast('يرجى رفع صورة إيصال التحويل', 'error'); return; }
    if (!amount || isNaN(Number(amount))) { showToast('يرجى إدخال المبلغ المحوّل', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/stadium/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          senderName: senderName.trim(),
          senderPhone: senderPhone.trim(),
          paymentScreenshot: receiptUrl,
          amount: Number(amount),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم إرسال طلب الاشتراك بنجاح ⏳', 'success');
        setSubmitted(true);
      } else {
        showToast(json.error || 'فشل إرسال الطلب', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💳 باقة الاشتراك</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          إدارة خطة اشتراكك وتجديده لمتابعة الاستمتاع بجميع الخدمات
        </p>
      </div>

      {/* Current Status Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الخطة الحالية</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>{currentPlan?.icon || '📋'}</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>{currentPlan?.name || 'غير محددة'}</span>
            <Badge variant={statusVariant[subscriptionStatus] as any}>{statusLabel[subscriptionStatus] || subscriptionStatus}</Badge>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الأيام المتبقية</p>
          <p style={{
            fontSize: '2rem', fontWeight: 900,
            color: remaining !== null && remaining < 10 ? 'var(--danger)' : remaining !== null && remaining < 30 ? 'var(--warning)' : 'var(--success)'
          }}>
            {remaining !== null ? (remaining > 0 ? `${remaining} يوم` : 'منتهي') : '—'}
          </p>
        </div>
        <div>
          {subscriptionExpiry && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              📅 تنتهي في: <strong>{new Date(subscriptionExpiry).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Pending Approval Alert */}
      {pendingSubscription && !submitted && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--warning)' }}>طلب اشتراك قيد المراجعة</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              لقد قمت بإرسال طلب الاشتراك في <strong>{PLANS.find(p => p.id === pendingSubscription.planId)?.name || pendingSubscription.planId}</strong> بمبلغ <strong>{pendingSubscription.amount} ج.م.</strong>. سيتم مراجعة طلبك من قِبَل الإدارة وتفعيله خلال وقت قصير.
            </p>
          </div>
        </div>
      )}

      {/* Success Message After Submit */}
      {submitted && (
        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--success)', marginBottom: '0.5rem' }}>تم إرسال طلبك بنجاح!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            سيتم مراجعة إيصال التحويل الخاص بك وتفعيل الاشتراك خلال ساعات قليلة.
          </p>
        </div>
      )}

      {/* Plans Grid */}
      {!submitted && (
        <>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>🗂️ اختر الخطة المناسبة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isCurrent = currentPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      position: 'relative',
                      background: isSelected ? plan.colorBg : 'var(--bg-card)',
                      border: `2px solid ${isSelected ? plan.color : isCurrent ? 'var(--primary)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? `0 0 0 3px ${plan.color}33` : 'none',
                    }}
                  >
                    {plan.isPopular && (
                      <div style={{
                        position: 'absolute', top: '-12px', right: '1rem',
                        background: 'var(--primary)', color: '#fff',
                        fontSize: '0.75rem', fontWeight: 700,
                        padding: '2px 12px', borderRadius: 'var(--radius-full)',
                      }}>⭐ الأكثر اختياراً</div>
                    )}
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', top: '-12px', left: '1rem',
                        background: 'var(--success)', color: '#fff',
                        fontSize: '0.75rem', fontWeight: 700,
                        padding: '2px 12px', borderRadius: 'var(--radius-full)',
                      }}>✅ خطتك الحالية</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '2rem' }}>{plan.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: plan.color }}>{plan.name}</span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>{plan.price.toLocaleString('ar-EG')}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}> ج.م. / شهر</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {plan.maxFields === -1 ? 'ملاعب غير محدودة' : `حتى ${plan.maxFields} ${plan.maxFields === 1 ? 'ملعب' : 'ملاعب'}`}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {isSelected && (
                      <div style={{
                        marginTop: '1rem', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                        background: plan.color, color: '#fff', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700,
                      }}>تم الاختيار ✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Instructions */}
          {selectedPlan && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>💸 تعليمات الدفع</h2>
              <div style={{
                background: 'linear-gradient(135deg, rgba(43,130,89,0.12), rgba(43,130,89,0.04))',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  يرجى تحويل مبلغ{' '}
                  <strong style={{ color: 'var(--primary-light)', fontSize: '1.1rem' }}>
                    {PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString('ar-EG')} ج.م.
                  </strong>{' '}
                  إلى الرقم التالي عبر:
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                    borderRadius: 'var(--radius-md)', padding: '0.625rem 1rem',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📲</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>فودافون كاش</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', direction: 'ltr' }}>{PAYMENT_NUMBER}</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(88,28,135,0.08)', border: '1px solid rgba(88,28,135,0.25)',
                    borderRadius: 'var(--radius-md)', padding: '0.625rem 1rem',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>💜</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>انستا باي</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', direction: 'ltr' }}>{PAYMENT_NUMBER}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">👤 اسم المرسل (كما في المحفظة) *</label>
                    <input
                      className="form-input"
                      placeholder="الاسم الذي أُرسل منه التحويل..."
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">📞 رقم الهاتف المرسل منه *</label>
                    <input
                      className="form-input"
                      placeholder="01xxxxxxxxx"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">💰 المبلغ المحوّل (ج.م.) *</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="أدخل المبلغ الذي قمت بتحويله..."
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    dir="ltr"
                  />
                </div>

                {/* Receipt Upload */}
                <div className="form-group">
                  <label className="form-label">📸 صورة إيصال التحويل (إجباري) *</label>
                  <div
                    className={`upload-zone ${receiptPreview ? 'dragover' : ''}`}
                    onClick={() => document.getElementById('sub-receipt-upload')?.click()}
                    style={{ border: '2px dashed var(--primary-light)', minHeight: '140px', cursor: 'pointer' }}
                  >
                    {uploading ? (
                      <div style={{ textAlign: 'center' }}>
                        <div className="btn-spinner" style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>جاري الرفع...</p>
                      </div>
                    ) : receiptPreview ? (
                      <img src={receiptPreview} alt="إيصال الدفع" style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📤</div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          انقر هنا لرفع صورة الإيصال (إجباري)
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>JPG, PNG, WEBP — حتى 10MB</p>
                      </div>
                    )}
                  </div>
                  <input id="sub-receipt-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReceiptUpload} />
                </div>

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={submitting}
                  style={{ marginTop: '0.5rem', fontSize: '1rem', padding: '0.875rem' }}
                >
                  🚀 إرسال طلب الاشتراك للمراجعة
                </Button>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  سيتم مراجعة طلبك وتفعيل اشتراكك خلال ساعات قليلة من استلام الدفع.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

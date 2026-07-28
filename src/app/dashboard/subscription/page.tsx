'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PLATFORM_PAYMENT_PHONE, PLATFORM_PAYMENT_PHONE_INTL } from '@/lib/constants';

interface CommissionData {
  billingMode: 'commission' | 'subscription';
  monthlySubscriptionPrice: number;
  stadiumSlug: string;
  stadiumName: string;
  commissionRate: number;
  isFreeMonth: boolean;
  freeUntilDate: string;
  totalCompletedBookings: number;
  totalCalculatedCommission: number;
  unpaidCommission: number;
  commissionStatus: 'active' | 'blocked';
  lastSettledDate: string | null;
  pendingCommissionPayment: {
    amount: number;
    senderName: string;
    senderPhone: string;
    paymentScreenshot: string;
    createdAt: string;
  } | null;
}

export default function StadiumCommissionPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommissionData | null>(null);

  // Payment upload state
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCommission = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/stadium/commission');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setAmount(String(json.data.unpaidCommission > 0 ? json.data.unpaidCommission : ''));
      }
    } catch {
      showToast('خطأ في تحميل بيانات العمولات والمستحقات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommission();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.url) {
        setScreenshotUrl(json.url);
        showToast('تم رفع صورة الإيصال بنجاح 📸', 'success');
      } else {
        showToast(json.error || 'فشل رفع الصورة', 'error');
      }
    } catch {
      showToast('خطأ أثناء رفع الصورة', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !amount || !screenshotUrl) {
      showToast('يرجى ملء جميع البيانات ورفع صورة إثبات التحويل', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/stadium/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          senderName,
          senderPhone,
          paymentScreenshot: screenshotUrl,
        }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تم إرسال إثبات السداد! بانتظار تأكيد صاحب الموقع وفك الحجب 🎉', 'success');
        fetchCommission();
        setSenderName('');
        setSenderPhone('');
        setScreenshotUrl('');
      } else {
        showToast(json.error || 'فشل إرسال الإثبات', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="btn-spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }} />
        <p>جاري تحميل بيانات المستحقات...</p>
      </div>
    );
  }

  if (!data) return null;

  const isCommission = data.billingMode === 'commission';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto', padding: '0 0.25rem' }}>

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 800 }}>
          {isCommission ? '💵 كشف حساب العمولات' : '💎 نظام الاشتراك الشهري'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {isCommission
            ? `نظام العمولة: ${data.commissionRate} ج.م مصري عن كل حجز مكتمل أو مرّ وقته — بعد انتهاء الشهر الأول المجاني.`
            : `نظام الاشتراك الشهري: ${data.monthlySubscriptionPrice} ج.م / شهر يُسدَّد في بداية كل شهر.`
          }
        </p>
      </div>

      {/* Blocked Banner */}
      {data.commissionStatus === 'blocked' && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1.5px solid rgba(239,68,68,0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '2rem', flexShrink: 0 }}>⛔</div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger)' }}>حسابك محجوب حالياً بسبب تأخر السداد</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              يرجى سداد المبلغ المستحق أدناه ورفع صورة إيصال التحويل. سيتم فك الحجب فور مراجعة الأدمن وتأكيد الاستلام.
            </p>
          </div>
        </div>
      )}

      {/* Free Month Banner */}
      {data.isFreeMonth ? (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '2.5rem' }}>🎁</div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>أنت في الشهر الأول المجاني بالكامل!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              جميع الحجوزات مجانية 100% حتى تاريخ: <strong>{new Date(data.freeUntilDate).toLocaleDateString('ar-EG')}</strong>
            </p>
          </div>
        </div>
      ) : (
        /* Stats Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}>
          <div className="stat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الحجوزات الخاضعة للعمولة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem' }}>{data.totalCompletedBookings} حجز</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>سعر العمولة المحدد لك</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-light)', marginTop: '0.5rem' }}>{data.commissionRate} ج.م / حجز</div>
          </div>

          <div className="stat-card" style={{
            background: data.unpaidCommission > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: data.unpaidCommission > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المبلغ المستحق للسداد</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: data.unpaidCommission > 0 ? 'var(--danger)' : '#10b981', marginTop: '0.5rem' }}>
              {data.unpaidCommission} ج.م
            </div>
          </div>

          {data.lastSettledDate && (
            <div className="stat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>آخر تسوية مؤكدة</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', marginTop: '0.5rem' }}>
                ✅ {new Date(data.lastSettledDate).toLocaleDateString('ar-EG')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Approval Notice */}
      {data.pendingCommissionPayment && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '2rem', flexShrink: 0 }}>⏳</div>
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--warning)' }}>تم إرسال إثبات السداد — بانتظار موافقة الأدمن</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              المبلغ المُرسَل: <strong>{data.pendingCommissionPayment.amount} ج.م</strong> بتاريخ {new Date(data.pendingCommissionPayment.createdAt).toLocaleDateString('ar-EG')}
              {' · '}المُحوِّل: {data.pendingCommissionPayment.senderName}
            </p>
          </div>
        </div>
      )}

      {/* Payment Instructions + Form (always visible) */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.15rem)', fontWeight: 800 }}>
            📱 {isCommission ? 'سداد مستحقات العمولات' : 'سداد الاشتراك الشهري'} (متاح في أي وقت)
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 600 }}>
            ⚡ يمكنك السداد في أي وقت من الشهر
          </span>
        </div>

        {/* Payment Channels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-base)', padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>🔴 فودافون كاش</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-light)', letterSpacing: '0.05em', direction: 'ltr' }}>{PLATFORM_PAYMENT_PHONE}</div>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(PLATFORM_PAYMENT_PHONE); showToast('تم نسخ الرقم!', 'success'); }}
              style={{ alignSelf: 'flex-start', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >📋 نسخ</button>
          </div>

          <div style={{
            background: 'var(--bg-base)', padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>⚡ انستا باي (InstaPay)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', letterSpacing: '0.05em', direction: 'ltr' }}>{PLATFORM_PAYMENT_PHONE}</div>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(PLATFORM_PAYMENT_PHONE); showToast('تم نسخ الرقم!', 'success'); }}
              style={{ alignSelf: 'flex-start', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >📋 نسخ</button>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-subtle)', margin: '1.25rem 0' }} />

        {/* Upload Receipt Form */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📤 رفع صورة إيصال التحويل لتأكيد السداد</h3>
        <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
            <Input
              label="اسم المُحوِّل (مالك الملعب)"
              placeholder="محمد أحمد"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              required
            />
            <Input
              label="رقم هاتف المُحوِّل"
              placeholder="01012345678"
              value={senderPhone}
              onChange={e => setSenderPhone(e.target.value)}
              required
            />
            <Input
              label={`المبلغ المُحوَّل (ج.م) ${data.unpaidCommission > 0 ? `— المستحق: ${data.unpaidCommission} ج.م` : ''}`}
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              صورة الإيصال / سكرين شوت التحويل <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                width: '100%',
                minHeight: screenshotUrl ? 'auto' : '130px',
                borderRadius: 'var(--radius-md)',
                border: screenshotUrl ? '2px solid var(--primary)' : '2px dashed rgba(255,255,255,0.15)',
                background: screenshotUrl ? 'transparent' : 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(34,197,94,0.01) 100%)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.25s ease',
                padding: screenshotUrl ? '0' : '1.5rem 1rem',
                boxSizing: 'border-box',
              }}
              className="upload-dropzone"
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.5rem' }}>
                  <div className="btn-spinner" style={{ width: '32px', height: '32px', borderColor: 'rgba(34,197,94,0.3)', borderTopColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600 }}>جاري رفع الصورة...</span>
                </div>
              ) : screenshotUrl ? (
                <>
                  <img
                    src={screenshotUrl}
                    alt="إيصال السداد"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                    color: 'white', fontSize: '0.8rem', gap: '0.4rem',
                  }} className="upload-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span style={{ fontWeight: 700 }}>تغيير الصورة</span>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '0.5rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>تم رفع الصورة بنجاح</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: '52px', height: '52px',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.08))',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(34,197,94,0.3)',
                    marginBottom: '0.25rem',
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>اضغط لرفع سكرين شوت التحويل</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG / JPG / WEBP — حتى 10 ميجا</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            disabled={!screenshotUrl || uploading}
            style={{ alignSelf: 'flex-start', minWidth: '220px' }}
          >
            🚀 إرسال إثبات السداد للمراجعة
          </Button>
        </form>
      </div>
    </div>
  );
}

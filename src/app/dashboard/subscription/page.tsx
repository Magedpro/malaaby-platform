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
              📸 صورة الإيصال / سكرين شوت التحويل <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                width: '100%',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            />
            {uploading && <p style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginTop: '0.25rem' }}>⏳ جاري رفع الصورة...</p>}
            {screenshotUrl && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={screenshotUrl} alt="إيصال السداد" style={{ maxHeight: '100px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✅ تم رفع الصورة</span>
              </div>
            )}
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

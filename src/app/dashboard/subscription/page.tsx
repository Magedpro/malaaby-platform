'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CommissionData {
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
        setAmount(String(json.data.unpaidCommission || ''));
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
        <p>جاري تحميل حساب عمولات ومستحقات المنصة...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💵 حساب عمولات ومستحقات المنصة</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          نظام العمولة: <strong>5 جنيه مصري</strong> عن كل حجز مكتمل بعد انتهاء الشهر الأول المجاني.
        </p>
      </div>

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
        }}>
          <div style={{ fontSize: '2.5rem' }}>🎁</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>أنت الآن في الشهر الأول المجاني بالكامل!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              جميع الحجوزات مجانية 100% وبدون أي عمولات حتى تاريخ: <strong>{new Date(data.freeUntilDate).toLocaleDateString('ar-EG')}</strong>
            </p>
          </div>
        </div>
      ) : (
        /* Status Card */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          <div className="stat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الحجوزات المكتملة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem' }}>{data.totalCompletedBookings} حجز</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تعريفة العمولة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-light)', marginTop: '0.5rem' }}>{data.commissionRate} ج.م / حجز</div>
          </div>

          <div className="stat-card" style={{
            background: data.unpaidCommission > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: data.unpaidCommission > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>المستحقات المطلوبة للسداد</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: data.unpaidCommission > 0 ? 'var(--danger)' : '#10b981', marginTop: '0.5rem' }}>
              {data.unpaidCommission} ج.م
            </div>
          </div>
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
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--warning)' }}>تم إرسال إثبات السداد وبانتظار موافقة الأدمن</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              المبلغ المرسل: <strong>{data.pendingCommissionPayment.amount} ج.م</strong> بتاريخ {new Date(data.pendingCommissionPayment.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>
      )}

      {/* How & Where to Pay Instructions */}
      {!data.isFreeMonth && data.unpaidCommission > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>📱 طرق سداد العمولات الشهرية</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🔴 فودافون كاش</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-light)', direction: 'ltr', textAlign: 'right' }}>01008432559</div>
            </div>
            <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⚡ انستا باي (InstaPay)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', direction: 'ltr', textAlign: 'right' }}>01008432559</div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '1.5rem 0' }} />

          {/* Upload Receipt Form */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📤 رفع صورة إثبات تحويل المبلغ</h3>
          <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="اسم المحول (مالك الملعب)"
                placeholder="أحمد محمد"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                required
              />
              <Input
                label="رقم هاتف المحوّل منه"
                placeholder="01012345678"
                value={senderPhone}
                onChange={e => setSenderPhone(e.target.value)}
                required
              />
              <Input
                label="المبلغ المحول (ج.م)"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                صورة الإيصال / السكرين شوت
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
                }}
              />
              {uploading && <p style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginTop: '0.25rem' }}>جاري رفع الصورة...</p>}
              {screenshotUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={screenshotUrl} alt="إيصال السداد" style={{ maxHeight: '120px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                </div>
              )}
            </div>

            <Button type="submit" variant="primary" isLoading={submitting} disabled={!screenshotUrl || uploading}>
              تأكيد وإرسال إثبات السداد للأدمن 🚀
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

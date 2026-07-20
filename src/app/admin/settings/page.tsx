'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface Settings {
  platformName: string;
  platformNameEn: string;
  supportEmail: string;
  supportWhatsApp: string;
  ownerApprovalRequired: boolean;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Settings>({
    platformName: '', platformNameEn: '', supportEmail: '',
    supportWhatsApp: '', ownerApprovalRequired: false, maintenanceMode: false
  });

  useEffect(() => {
    fetch('/api/v1/admin/settings').then(r => r.json()).then(j => {
      if (j.success && j.data) {
        setForm(j.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.platformName.trim()) { showToast('اسم المنصة مطلوب', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) { showToast('تم حفظ إعدادات المنصة بنجاح ✅', 'success'); }
      else { showToast(json.error || 'فشلت عملية الحفظ', 'error'); }
    } catch { showToast('خطأ في الاتصال بالخادم', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
      <Skeleton height={40} width="40%" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} height={76} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إعدادات المنصة العامة</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>تكوين المعلمات الأساسية وخيارات تشغيل منصة ملعبي SaaS</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="اسم المنصة بالعربية *" value={form.platformName} onChange={e => setForm({...form, platformName: e.target.value})} />
          <Input label="اسم المنصة بالإنجليزية" value={form.platformNameEn} onChange={e => setForm({...form, platformNameEn: e.target.value})} />
        </div>

        <Input label="بريد دعم المشتركين" type="email" value={form.supportEmail} onChange={e => setForm({...form, supportEmail: e.target.value})} />
        <Input label="رقم واتساب دعم المشتركين" value={form.supportWhatsApp} onChange={e => setForm({...form, supportWhatsApp: e.target.value})} placeholder="+2010..." />

        <div className="divider" style={{ margin: '0.5rem 0' }} />

        {/* Feature Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.ownerApprovalRequired} onChange={e => setForm({...form, ownerApprovalRequired: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>تطلب موافقة المشرف لتفعيل الحسابات الجديدة</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>عند تفعيل هذا الخيار، لن يستطيع المالك إتاحة صفحة حجوزاته للعامة إلا بعد موافقة السوبر أدمن أولاً.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.maintenanceMode} onChange={e => setForm({...form, maintenanceMode: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--danger)' }}>⚠️ تشغيل وضع الصيانة للمنصة بالكامل</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>عند تفعيل وضع الصيانة، سيتم حظر جميع الوصول للمواقع العامة للملاعب وللوحات الملاك عدا السوبر أدمن.</div>
            </div>
          </label>
        </div>

        <Button variant="primary" onClick={handleSave} isLoading={saving} style={{ alignSelf: 'flex-start', minWidth: '180px', marginTop: '1rem' }}>
          💾 حفظ الإعدادات العامة
        </Button>
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/useSession';
import { CITIES_DEFAULT } from '@/lib/constants';
import { compressImage } from '@/lib/utils';

interface StadiumSettings {
  name: string; description: string; phone: string; whatsapp: string;
  email: string; city: string; address: string; googleMapsUrl: string;
  vodafoneCash: string; instaPay: string; paymentInstructions: string;
  logo: string; coverImage: string;
  enableBrowser: boolean;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const { stadium: sessionStadium } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState<'general'|'payment'|'media'|'notifications'>('general');
  const [subscribingPush, setSubscribingPush] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [form, setForm] = useState<StadiumSettings>({
    name: '', description: '', phone: '', whatsapp: '',
    email: '', city: 'القاهرة', address: '', googleMapsUrl: '',
    vodafoneCash: '', instaPay: '', paymentInstructions: '',
    logo: '', coverImage: '',
    enableBrowser: true,
  });

  // Check if push notifications are supported and if user is already subscribed
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsPushSubscribed(!!sub);
        });
      });
    }
  }, []);

  useEffect(() => {
    fetch('/api/v1/stadium/settings').then(r => r.json()).then(j => {
      if (j.success && j.data) {
        const s = j.data;
        setForm({
          name: s.name || '',
          description: s.description || '',
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          email: s.email || '',
          city: s.city || 'القاهرة',
          address: s.address || '',
          googleMapsUrl: s.googleMapsUrl || '',
          vodafoneCash: s.vodafoneCash || '',
          instaPay: s.instaPay || '',
          paymentInstructions: s.paymentInstructions || '',
          logo: s.logo || '',
          coverImage: s.coverImage || '',
          enableBrowser: s.notificationPrefs?.browser !== false,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  // Helper helper to convert base64 VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!pushSupported) return;
    setSubscribingPush(true);
    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('يرجى السماح بالإشعارات في المتصفح لتفعيل هذه الميزة 🔔', 'error');
        setSubscribingPush(false);
        return;
      }

      // 2. Register Service Worker if not registered
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }

      // 3. Fetch VAPID public key
      const keyRes = await fetch('/api/v1/push/vapid-key');
      const keyJson = await keyRes.json();
      if (!keyJson.success || !keyJson.publicKey) {
        throw new Error('Failed to get public VAPID key');
      }

      // 4. Subscribe
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey)
      });

      // 5. Send subscription to API
      const subRes = await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });
      const subJson = await subRes.json();
      if (subJson.success) {
        setIsPushSubscribed(true);
        showToast('تم تفعيل إشعارات المتصفح لهذا الجهاز بنجاح! 🔔', 'success');
      } else {
        showToast(subJson.error || 'فشل تفعيل الإشعار المباشر', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تفعيل إشعارات المتصفح', 'error');
    } finally {
      setSubscribingPush(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('اسم الملعب مطلوب', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        notificationPrefs: {
          whatsapp: false,
          email: true,
          browser: form.enableBrowser,
        }
      };
      const res = await fetch('/api/v1/stadium/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) { showToast('تم حفظ الإعدادات وتفضيلات الإشعارات بنجاح ✅', 'success'); }
      else { showToast(json.error || 'فشل الحفظ', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
    finally { setSaving(false); }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت', 'error');
      return;
    }
    
    if (field === 'logo') setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const compressed = await compressImage(file, 1600, 0.85);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: fd
      });
      const json = await res.json();
      if (json && json.success) {
        setForm(prev => ({ ...prev, [field]: json.url }));
        showToast('تم رفع الصورة بنجاح ✅', 'success');
      } else {
        showToast(json?.error || 'فشل رفع الصورة، يرجى المحاولة لاحقاً', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء رفع الصورة', 'error');
    } finally {
      if (field === 'logo') setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const tabs = [
    { id: 'general', label: '🏟️ المعلومات العامة' },
    { id: 'payment', label: '💰 إعدادات الدفع' },
    { id: 'media', label: '🖼️ الصور والميديا' },
    { id: 'notifications', label: '🔔 تفضيلات الإشعارات' },
  ] as const;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Skeleton height={48} width="40%" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[...Array(6)].map((_, i) => <Skeleton key={i} height={72} />)}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إعدادات الملعب</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>تعديل بيانات مجمع الملاعب والمعلومات الظاهرة للزوار</p>
        </div>
        {sessionStadium?.slug && (
          <a href={`/${sessionStadium.slug}`} target="_blank" rel="noopener" style={{ color: 'var(--primary-light)', fontSize: '0.875rem', fontWeight: 600 }}>
            عرض الموقع العام ↗
          </a>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.75rem 1.25rem',
              fontFamily: 'var(--font-arabic)',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === t.id ? 'var(--primary-light)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              marginBottom: '-1px',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
          <Input label="اسم مجمع الملاعب *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <div className="form-group">
            <label className="form-label">وصف المجمع الرياضي</label>
            <textarea className="form-input form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="وصف احترافي للمجمع يظهر للزوار على موقع الحجز العام..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="رقم التليفون" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="01012345678" />
            <Input label="رقم الواتساب" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="+201012345678" />
          </div>
          <Input label="البريد الإلكتروني (اختياري)" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', alignItems: 'start' }}>
            <div className="form-group">
              <label className="form-label">المدينة</label>
              <select className="form-input form-select" value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                {CITIES_DEFAULT.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="العنوان التفصيلي" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="الشارع، الحي، المحافظة" />
          </div>
          <Input label="رابط خرائط جوجل (اختياري)" value={form.googleMapsUrl} onChange={e => setForm({...form, googleMapsUrl: e.target.value})} placeholder="https://maps.google.com/..." />
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
          <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.875rem', color: 'var(--warning)' }}>
            ⚠️ تأكد من صحة أرقام الدفع. سيستخدمها العملاء لتحويل مبالغ الحجوزات مباشرةً.
          </div>
          <Input label="رقم محفظة فودافون كاش" value={form.vodafoneCash} onChange={e => setForm({...form, vodafoneCash: e.target.value})} placeholder="01012345678" />
          <Input label="عنوان إنستا باي InstaPay Address" value={form.instaPay} onChange={e => setForm({...form, instaPay: e.target.value})} placeholder="khalil@instapay" />
          <div className="form-group">
            <label className="form-label">تعليمات الدفع للعملاء</label>
            <textarea
              className="form-input form-textarea"
              value={form.paymentInstructions}
              onChange={e => setForm({...form, paymentInstructions: e.target.value})}
              placeholder="مثال: يرجى تحويل كامل قيمة الحجز قبل تأكيده ثم رفع لقطة شاشة الإيصال..."
              style={{ minHeight: '100px' }}
            />
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <Input label="رابط شعار المجمع (Logo URL)" value={form.logo} onChange={e => setForm({...form, logo: e.target.value})} placeholder="https://..." />
              </div>
              <label 
                className="btn btn-secondary" 
                style={{ cursor: 'pointer', marginBottom: '4px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
              >
                {uploadingLogo ? 'جاري الرفع...' : '📤 رفع شعار'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  disabled={uploadingLogo} 
                  onChange={(e) => handleUploadFile(e, 'logo')} 
                />
              </label>
            </div>
            {form.logo && <img src={form.logo} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem', border: '2px solid var(--border-default)' }} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <Input label="رابط صورة الغلاف الرئيسية (Cover URL)" value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} placeholder="https://..." />
              </div>
              <label 
                className="btn btn-secondary" 
                style={{ cursor: 'pointer', marginBottom: '4px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
              >
                {uploadingCover ? 'جاري الرفع...' : '📤 رفع غلاف'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  disabled={uploadingCover} 
                  onChange={(e) => handleUploadFile(e, 'coverImage')} 
                />
              </label>
            </div>
            {form.coverImage && <img src={form.coverImage} alt="Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', border: '1px solid var(--border-default)' }} />}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            💡 نصيحة: استخدم صوراً بجودة عالية وأبعاد واسعة (1200×400 على الأقل) لصورة الغلاف لتأثير بصري أفضل.
          </p>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fadeIn">
          {/* Email Auto-notification Info */}
          <div style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📧</span>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--primary-light)', marginBottom: '0.25rem' }}>إشعارات البريد الإلكتروني مفعلة تلقائياً ✅</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                سيتلقى حسابك إشعاراً فورياً على البريد الإلكتروني <strong style={{ color: 'var(--text-secondary)' }}>{form.email}</strong> عند كل حجز جديد تلقائياً بدون أي إعداد.
              </p>
            </div>
          </div>


          {/* Browser Push Settings */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3b82f6' }}>🔔 إشعارات المتصفح الفورية (Browser Push)</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>استقبال إشعارات منبثقة مباشرة على جهاز الكمبيوتر أو الموبايل عند فتح المتصفح</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.enableBrowser}
                  onChange={e => setForm({...form, enableBrowser: e.target.checked})}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '24px',
                  backgroundColor: form.enableBrowser ? '#3b82f6' : 'var(--border-default)',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px',
                    left: form.enableBrowser ? '26px' : '3px', bottom: '3px',
                    backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
            
            {form.enableBrowser && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="animate-fadeIn">
                {pushSupported ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button 
                      type="button" 
                      variant={isPushSubscribed ? 'secondary' : 'primary'}
                      onClick={subscribeToPush}
                      isLoading={subscribingPush}
                      disabled={isPushSubscribed}
                    >
                      {isPushSubscribed ? '✅ تم تفعيل إشعارات المتصفح' : '🔔 تفعيل استقبال إشعارات هذا الجهاز'}
                    </Button>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {isPushSubscribed 
                        ? 'جهازك مسجل حالياً لاستلام إشعارات فورية.' 
                        : 'انقر لتفعيل التنبيهات المباشرة على هذا المتصفح.'}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 600 }}>
                    ⚠️ متصفحك الحالي لا يدعم ميزة الإشعارات المباشرة (Browser Push Notifications). يرجى استخدام متصفح حديث مثل Chrome أو Edge.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Button variant="primary" onClick={handleSave} isLoading={saving} style={{ alignSelf: 'flex-start', minWidth: '180px' }}>
        💾 حفظ التعديلات
      </Button>
    </div>
  );
}
export const dynamic = 'force-dynamic';

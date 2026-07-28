'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CITIES_DEFAULT, APP_URL } from '@/lib/constants';
import { slugify } from '@/lib/utils';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useSession();
  const { showToast } = useToast();

  const selectedPlan = searchParams.get('plan') || 'plan-basic';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFieldCover, setUploadingFieldCover] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    stadiumName: '',
    slug: '',
    city: 'القاهرة',
    address: '',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
    vodafoneCash: '',
    instaPay: '',
    acceptTerms: false,
    // Field setup (step 4)
    fieldName: '',
    fieldPricePerHour: '',
    fieldOpeningTime: '08:00',
    fieldClosingTime: '23:00',
    fieldDuration: '60',
    fieldCoverImage: '', // Will be set by upload
  });

  // Automatically suggest slug based on stadium name
  useEffect(() => {
    if (formData.stadiumName && step === 2) {
      const generated = slugify(formData.stadiumName);
      // Only update if result is not empty or just a dash
      if (generated && generated !== '-') {
        setFormData((prev) => ({
          ...prev,
          slug: generated,
          fieldName: prev.stadiumName,
        }));
      }
    }
  }, [formData.stadiumName, step]);

  // If user is already logged in, redirect away
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
      }
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      }
      if (!formData.phone.trim() || !/^01[0-2,5]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'رقم الموبايل المصري غير صحيح (مثال: 01012345678)';
      }
    }

    if (step === 2) {
      if (!formData.stadiumName.trim()) newErrors.stadiumName = 'اسم الملعب مطلوب';
      if (!formData.slug.trim() || !/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط';
      }
      if (!formData.city) newErrors.city = 'المدينة مطلوبة';
      if (!formData.address.trim()) newErrors.address = 'العنوان التفصيلي مطلوب للعملاء';
    }

    if (step === 3) {
      if (!formData.vodafoneCash && !formData.instaPay) {
        newErrors.vodafoneCash = 'يجب إدخال رقم فودافون كاش أو عنوان إنستا باي لاستقبال الدفع';
      }
    }

    if (step === 4) {
      if (!formData.fieldPricePerHour || isNaN(Number(formData.fieldPricePerHour)) || Number(formData.fieldPricePerHour) <= 0) {
        newErrors.fieldPricePerHour = 'يرجى إدخال سعر صحيح أكبر من صفر';
      }
      if (!formData.fieldOpeningTime) newErrors.fieldOpeningTime = 'وقت الفتح مطلوب';
      if (!formData.fieldClosingTime) newErrors.fieldClosingTime = 'وقت الإغلاق مطلوب';
    }

    if (step === 5) {
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'يجب الموافقة على شروط الخدمة وسياسة الخصوصية';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planId: selectedPlan
        }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('تم إنشاء حساب ملعبك بنجاح! جاري توجيهك للوحة التحكم.', 'success');
        await refresh(); // reload session context
        // Redirect to fields page so user sees the newly created field
        router.push('/dashboard/fields?new=1');
      } else {
        showToast(json.error || 'حدث خطأ أثناء التسجيل', 'error');
        if (json.errors) {
          setErrors(json.errors);
          if (json.errors.email || json.errors.phone) setStep(1);
          else if (json.errors.slug || json.errors.stadiumName) setStep(2);
        }
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setLoading(false);
    }
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
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json && json.success) {
        setFormData(prev => ({ ...prev, [field]: json.url }));
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

  const handleUploadFieldCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت', 'error');
      return;
    }
    setUploadingFieldCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json && json.success) {
        setFormData(prev => ({ ...prev, fieldCoverImage: json.url }));
        showToast('تم رفع صورة الملعب بنجاح ✅', 'success');
      } else {
        showToast(json?.error || 'فشل رفع الصورة', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء رفع الصورة', 'error');
    } finally {
      setUploadingFieldCover(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '3rem 1.5rem' }}>
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🏟️</span>
            <span>ملعبي <span className="gradient-text">Malaaby</span></span>
          </Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem' }}>
            سجل ملعبك واكتسح السوق الرقمي
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            أدخل البيانات التالية لبناء موقع الحجز الخاص بك فوراً
          </p>
        </div>

        {/* Step Indicator */}
        <div className="steps">
          <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
            <div className="step-circle">١</div>
            <div className="step-label">الحساب الشخصي</div>
          </div>
          <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
            <div className="step-circle">٢</div>
            <div className="step-label">بيانات الملعب</div>
          </div>
          <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>
            <div className="step-circle">٣</div>
            <div className="step-label">طرق الدفع</div>
          </div>
          <div className={`step-item ${step === 4 ? 'active' : step > 4 ? 'done' : ''}`}>
            <div className="step-circle">٤</div>
            <div className="step-label">إعداد الملعب</div>
          </div>
          <div className={`step-item ${step === 5 ? 'active' : step > 5 ? 'done' : ''}`}>
            <div className="step-circle">٥</div>
            <div className="step-label">التأكيد</div>
          </div>
        </div>

        <div className="divider" />

        {/* Wizard Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '260px' }}>
          
          {/* Step 1: Account credentials */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
              <Input
                label="الاسم بالكامل (صاحب الملعب)"
                placeholder="أدخل اسمك الثلاثي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Input
                  label="كلمة المرور"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  required
                />
                <Input
                  label="تأكيد كلمة المرور"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  required
                />
              </div>
              <Input
                label="رقم الهاتف (للتواصل الإداري)"
                placeholder="01012345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                required
              />
            </div>
          )}

          {/* Step 2: Stadium info */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
              <Input
                label="اسم مجمع الملاعب"
                placeholder="مثال: ملاعب الخليل الرياضية"
                value={formData.stadiumName}
                onChange={(e) => setFormData({ ...formData, stadiumName: e.target.value })}
                error={errors.stadiumName}
                required
              />
              
              <div className="form-group">
                <label className="form-label">رابط الحجز الخاص بملعبك</label>
                <div style={{ display: 'flex', direction: 'ltr', alignItems: 'stretch' }}>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRight: 'none',
                      borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                      padding: '0.75rem 1rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.8125rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}/
                  </div>
                  <input
                    type="text"
                    className={`form-input ${errors.slug ? 'form-input-error' : ''}`}
                    style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0', flex: 1, direction: 'ltr' }}
                    placeholder="khalil-fields"
                    value={formData.slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');
                      setFormData({ ...formData, slug: val });
                    }}
                  />
                </div>
                {errors.slug && <p className="form-error">⚠️ {errors.slug}</p>}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  ⚠️ يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3-50 حرف)
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">المدينة</label>
                  <select
                    className="form-input form-select"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    {CITIES_DEFAULT.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="العنوان التفصيلي"
                  placeholder="شارع التسعين الشمالي، بجوار الجامعة الأمريكية"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  error={errors.address}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment details */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                أدخل وسيلة دفع واحدة على الأقل ليستلم العملاء أرقام تحويلك
              </h4>
              
              <Input
                label="رقم محفظة فودافون كاش"
                placeholder="01012345678"
                value={formData.vodafoneCash}
                onChange={(e) => setFormData({ ...formData, vodafoneCash: e.target.value })}
                error={errors.vodafoneCash}
              />
              
              <Input
                label="عنوان الدفع إنستا باي"
                placeholder="khalil@instapay"
                value={formData.instaPay}
                onChange={(e) => setFormData({ ...formData, instaPay: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                {/* Logo Upload */}
                <div className="form-group">
                  <label className="form-label">شعار الملعب</label>
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      height: '110px',
                      borderRadius: 'var(--radius-md)',
                      border: formData.logo ? '2px solid var(--primary)' : '2px dashed var(--border-default)',
                      background: 'var(--bg-elevated)',
                      cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {uploadingLogo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                        <div className="btn-spinner" style={{ width: '24px', height: '24px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>جاري الرفع...</span>
                      </div>
                    ) : formData.logo ? (
                      <>
                        <img src={formData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.2s',
                          color: 'white', fontSize: '0.75rem', gap: '0.25rem',
                        }} className="upload-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          تغيير الصورة
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>رفع الشعار</span>
                        <span style={{ fontSize: '0.65rem' }}>مربع • PNG/JPG</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingLogo} onChange={(e) => handleUploadFile(e, 'logo')} />
                  </label>
                </div>

                {/* Cover Upload */}
                <div className="form-group">
                  <label className="form-label">صورة الغلاف</label>
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      height: '110px',
                      borderRadius: 'var(--radius-md)',
                      border: formData.coverImage ? '2px solid var(--primary)' : '2px dashed var(--border-default)',
                      background: 'var(--bg-elevated)',
                      cursor: uploadingCover ? 'not-allowed' : 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {uploadingCover ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                        <div className="btn-spinner" style={{ width: '24px', height: '24px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>جاري الرفع...</span>
                      </div>
                    ) : formData.coverImage ? (
                      <>
                        <img src={formData.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.2s',
                          color: 'white', fontSize: '0.75rem', gap: '0.25rem',
                        }} className="upload-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          تغيير الصورة
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>رفع الغلاف</span>
                        <span style={{ fontSize: '0.65rem' }}>عريض • PNG/JPG</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingCover} onChange={(e) => handleUploadFile(e, 'coverImage')} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: First Field Setup */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
              <div style={{
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--primary-light)', marginBottom: '0.25rem' }}>
                    إعداد أوقات وأسعار {formData.stadiumName}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    حدد سعر الساعة وساعات العمل اليومية. يمكنك إضافة أراضٍ فرعية لاحقاً من لوحة التحكم.
                  </p>
                </div>
              </div>

              <Input
                label="سعر الساعة بالجنيه المصري"
                type="number"
                placeholder="مثال: 200"
                value={formData.fieldPricePerHour}
                onChange={(e) => setFormData({ ...formData, fieldPricePerHour: e.target.value })}
                error={errors.fieldPricePerHour}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">وقت الفتح</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.fieldOpeningTime}
                    onChange={(e) => setFormData({ ...formData, fieldOpeningTime: e.target.value })}
                  />
                  {errors.fieldOpeningTime && <p className="form-error">⚠️ {errors.fieldOpeningTime}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">وقت الإغلاق</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.fieldClosingTime}
                    onChange={(e) => setFormData({ ...formData, fieldClosingTime: e.target.value })}
                  />
                  {errors.fieldClosingTime && <p className="form-error">⚠️ {errors.fieldClosingTime}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">مدة كل حجز</label>
                <select
                  className="form-input form-select"
                  value={formData.fieldDuration}
                  onChange={(e) => setFormData({ ...formData, fieldDuration: e.target.value })}
                >
                  <option value="60">ساعة كاملة (60 دقيقة)</option>
                  <option value="90">ساعة ونصف (90 دقيقة)</option>
                  <option value="120">ساعتان (120 دقيقة)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 5: Confirm terms */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fadeIn">
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <h4 style={{ fontWeight: 700, color: 'var(--primary-light)' }}>مراجعة وتأكيد البيانات</h4>
                <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>صاحب الحساب:</strong> {formData.name}</div>
                  <div><strong>اسم المجمع:</strong> {formData.stadiumName}</div>
                  <div><strong>الرابط العام:</strong> {APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}/{formData.slug}</div>
                  <div><strong>المدينة والعنوان:</strong> {formData.city}، {formData.address}</div>
                  <div><strong>رقم المحفظة:</strong> {formData.vodafoneCash || 'غير مدخل'}</div>
                  <div><strong>إنستا باي:</strong> {formData.instaPay || 'غير مدخل'}</div>
                  <div><strong>الملعب الأول:</strong> {formData.fieldName} — {formData.fieldPricePerHour} ج.م/ساعة — {formData.fieldOpeningTime} إلى {formData.fieldClosingTime}</div>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <input
                  type="checkbox"
                  style={{ accentColor: 'var(--primary)', marginTop: '4px' }}
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                />
                <span>
                  أوافق على <Link href="/terms" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>شروط الاستخدام</Link> و{' '}
                  <Link href="/privacy" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>سياسة الخصوصية</Link> للمنصة.
                </span>
              </label>
              {errors.acceptTerms && <p className="form-error">⚠️ {errors.acceptTerms}</p>}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {step > 1 && (
            <Button variant="secondary" onClick={handlePrev} disabled={loading}>
              السابق
            </Button>
          )}

          {step < 5 ? (
            <Button variant="primary" onClick={handleNext}>
              التالي
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
              تأكيد وإنشاء موقع ملعبك
            </Button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>لديك حساب بالفعل؟ </span>
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
            تسجيل دخول
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="btn-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <p>جاري التحميل...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </React.Suspense>
  );
}

export const dynamic = 'force-dynamic';

'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export const ContactSection: React.FC = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      showToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast('شكراً لتواصلك معنا! سنرد عليك في أقرب وقت ممكن.', 'success');
      setForm({ name: '', email: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  return (
    <section id="contact" className="section bg-base" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <span>✉️</span> اتصل بنا
          </div>
          <h2 className="section-title">نحن هنا لمساعدتك دائماً</h2>
          <p className="section-desc">
            هل لديك أسئلة حول خدماتنا أو ترغب في الحصول على استشارة خاصة لتسجيل مجمع ملاعبك؟ تواصل معنا مباشرة.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* Info Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fadeIn">
            <h3 className="feature-title" style={{ fontSize: '1.5rem' }}>معلومات الاتصال المباشر</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              فريق خدمة العملاء متواجد لمساعدتك في عمليات التسجيل والإعداد طوال أيام الأسبوع من الساعة 9 صباحاً وحتى 11 مساءً.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>📞</span>
                <div>
                  <h4 style={{ fontWeight: 700 }}>اتصال هاتفي</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>01126947405</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>💬</span>
                <div>
                  <h4 style={{ fontWeight: 700 }}>واتساب مباشر</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>+201126947405</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>✉️</span>
                <div>
                  <h4 style={{ fontWeight: 700 }}>البريد الإلكتروني</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Magedprooo8@gmail.com</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>📍</span>
                <div>
                  <h4 style={{ fontWeight: 700 }}>المقر الرئيسي</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>مبنى المكاتب الإدارية، شارع التسعين، القاهرة الجديدة، مصر</p>
                </div>
              </div>
            </div>

            {/* Mock Dark Map */}
            <div
              style={{
                height: '200px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                background: 'linear-gradient(135deg, #0b151f, #15381f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ opacity: 0.15, fontSize: '6rem', position: 'absolute' }}>🗺️</div>
              <div style={{ zIndex: 1, textAlign: 'center', padding: '1rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>موقعنا على الخريطة</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>التجمع الخامس، القاهرة</p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--primary-light)',
                    fontWeight: 600,
                  }}
                >
                  افتح في خرائط جوجل ↗
                </a>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <Card className="animate-fadeIn">
            <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="feature-title" style={{ fontSize: '1.25rem' }}>أرسل لنا رسالة مباشرة</h3>
              
              <Input
                label="الاسم بالكامل"
                placeholder="أدخل اسمك الكريم"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              
              <div className="form-group">
                <label className="form-label">رسالتك أو استفسارك</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="كيف يمكننا مساعدتك اليوم؟"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" variant="primary" isLoading={loading} fullWidth>
                إرسال الاستفسار
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};
export default ContactSection;

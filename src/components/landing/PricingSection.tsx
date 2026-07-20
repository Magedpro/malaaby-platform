import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  isFeatured?: boolean;
}

const plans: Plan[] = [
  {
    id: 'plan-basic',
    name: 'الخطة الأساسية',
    price: '٩٩ ج.م',
    period: '/ شهرياً',
    desc: 'مثالية لأصحاب الملاعب الفردية أو الملاعب الصغيرة.',
    features: [
      'ملعب كرة قدم واحد',
      'صفحة حجز عامة مخصصة',
      'لوحة تحكم أساسية للحجوزات',
      'تتبع الإيرادات وحجوزات اليوم',
      'دعم فني عادي عبر البريد',
    ],
  },
  {
    id: 'plan-pro',
    name: 'خطة الاحتراف (Pro)',
    price: '١٩٩ ج.م',
    period: '/ شهرياً',
    desc: 'الحل الأمثل لمجمعات الملاعب التي تبحث عن أتمتة كاملة.',
    features: [
      'حتى ٥ ملاعب مختلفة',
      'تقويم حجوزات تفاعلي بالألوان',
      'تقارير الإيرادات الشهرية المتقدمة',
      'دعم فني ذو أولوية عبر الواتساب',
      'تحميل وتخزين إيصالات التحويل بأمان',
      'إحصائيات الإشغال وسلوك العملاء',
    ],
    isFeatured: true,
  },
  {
    id: 'plan-premium',
    name: 'الخطة الفاخرة (Premium)',
    price: '٣٤٩ ج.م',
    period: '/ شهرياً',
    desc: 'للنوادي الكبرى والشركاء الذين يبحثون عن أقصى مرونة.',
    features: [
      'عدد ملاعب غير محدود',
      'تقارير مالية وتصدير البيانات Excel',
      'دعم فني مخصص ٢٤/٧ هاتفياً',
      'أولوية الحصول على المميزات الجديدة',
      'ربط نطاق خاص (قريباً)',
      'تكاملات رسائل الدفع والتنبيه (قريباً)',
    ],
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="section bg-surface" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <span>💎</span> خطط الاشتراك
          </div>
          <h2 className="section-title">استثمر في تنمية أعمال ملعبك بأسعار مرنة</h2>
          <p className="section-desc">
            اختر الخطة المناسبة لحجم نشاطك التجاري. يمكنك الترقية أو إلغاء الاشتراك في أي وقت بدون التزامات طويلة الأمد.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`pricing-card animate-fadeInUp ${plan.isFeatured ? 'featured' : ''}`}
            >
              {plan.isFeatured && <div className="pricing-popular">الأكثر طلباً 🔥</div>}
              
              <h3 className="feature-title" style={{ fontSize: 'var(--font-size-xl)' }}>{plan.name}</h3>
              <p className="feature-desc" style={{ minHeight: '44px', fontSize: '0.875rem' }}>{plan.desc}</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', margin: '1.5rem 0' }}>
                <span className="pricing-price">{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>{plan.period}</span>
              </div>
              
              <ul className="pricing-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="pricing-feature">
                    <span className="pricing-feature-icon">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={`/register?plan=${plan.id}`} style={{ marginTop: 'auto', display: 'block' }}>
                <Button variant={plan.isFeatured ? 'primary' : 'secondary'} fullWidth>
                  ابدأ الفترة التجريبية مجاناً
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
export default PricingSection;

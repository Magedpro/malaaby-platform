import React from 'react';

interface Step {
  stepNumber: string;
  icon: string;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    stepNumber: '١',
    icon: '👤',
    title: 'سجل حسابك',
    desc: 'أنشئ حساباً كمالك ملعب وأدخل معلومات ملعبك وبيانات الاتصال والتحويل المالي الخاصة بك.',
  },
  {
    stepNumber: '٢',
    icon: '🏟️',
    title: 'أضف ملاعبك',
    desc: 'أدخل الملاعب الخاصة بك (خماسي، سباعي)، حدد أسعار الساعة، مواقيت العمل اليومية ومدة الحجز.',
  },
  {
    stepNumber: '٣',
    icon: '📱',
    title: 'يحجز اللاعبون',
    desc: 'يتصفح اللاعبون صفحتك العامة الفريدة، يختارون اليوم والساعة الشاغرة، ويدخلون بياناتهم.',
  },
  {
    stepNumber: '٤',
    icon: '🧾',
    title: 'راجع إيصال الدفع',
    desc: 'يصلك إشعار فوري في لوحة التحكم، تراجع لقطة شاشة التحويل التي رفعها العميل مع حسابك المالي.',
  },
  {
    stepNumber: '٥',
    icon: '✅',
    title: 'تأكيد الحجز',
    desc: 'عند موافقتك، يتم تأكيد الحجز فوراً، قفل وقت الموعد للاعب، وإعلامه بنجاح الحجز تلقائياً.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="section bg-base" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <span>⚙️</span> آلية العمل
          </div>
          <h2 className="section-title">كيف تعمل منصة ملعبي؟</h2>
          <p className="section-desc">
            أتمتة كاملة لدورة الحجز وإدارة الملاعب لنوفر عليك الجهد وتراكم المكالمات الهاتفية المزعجة.
          </p>
        </div>

        <div className="how-steps">
          {steps.map((step, i) => (
            <div key={i} className="how-step animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="how-step-number">{step.stepNumber}</div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }} aria-hidden="true">
                {step.icon}
              </div>
              <h3 className="feature-title">{step.title}</h3>
              <p className="feature-desc" style={{ fontSize: '0.875rem' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default HowItWorks;

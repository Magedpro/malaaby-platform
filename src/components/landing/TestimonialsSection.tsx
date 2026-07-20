import React from 'react';
import { Card } from '../ui/Card';

interface Testimonial {
  stars: number;
  text: string;
  name: string;
  role: string;
  initials: string;
}

const testimonials: Testimonial[] = [
  {
    stars: 5,
    text: 'منصة ملعبي وفرت عليّ الاتصالات الهاتفية المزعجة والرسائل العشوائية على الواتساب. اللاعبون الآن يحجزون بأنفسهم وأنا أتحقق من الدفع بضغطة زر. زيادة في المبيعات وتوفير للوقت!',
    name: 'الكابتن محمود خليل',
    role: 'مالك ملاعب الغرين فيلد بالتجمع الخماس',
    initials: 'م خ',
  },
  {
    stars: 5,
    text: 'أفضل استثمار قمنا به لمجمع ملاعبنا الرياضي. التقويم التفاعلي حل لنا مشكلة الحجز المزدوج تماماً، واللاعبون معجبون جداً بتجربة الحجز السلسة من هواتفهم.',
    name: 'المهندس أحمد الجيار',
    role: 'المدير التنفيذي لنادي سبورتينج أكتوبر',
    initials: 'أ ج',
  },
  {
    stars: 5,
    text: 'إمكانية رفع إيصالات تحويل فودافون كاش مذهلة وتمنع التلاعب. لوحة التحكم سهلة الفهم للعمال في الملعب، والتقارير المالية تعطيني صورة واضحة عن الأرباح اليومية.',
    name: 'أ/ محمد عبد القادر',
    role: 'مدير ملاعب الكامب نو بالمنصورة',
    initials: 'م ع',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="section bg-base" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <span>⭐</span> آراء شركائنا
          </div>
          <h2 className="section-title">أصحاب ملاعب يثقون بمنصة ملعبي</h2>
          <p className="section-desc">
            اقرأ كيف ساعدت منصتنا ملاك ملاعب كرة القدم على تنظيم أعمالهم ورفع كفاءة الحجوزات اليومية.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((test, i) => (
            <Card key={i} className="testimonial-card animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="testimonial-stars" aria-label={`تقييم ${test.stars} نجوم`}>
                {'⭐'.repeat(test.stars)}
              </div>
              <p className="testimonial-text">"{test.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{test.initials}</div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{test.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{test.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
export default TestimonialsSection;

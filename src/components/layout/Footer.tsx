import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="footer animate-fadeIn">
      <div className="container footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <Link href="/" className="navbar-logo" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            <div className="logo-icon">🏟️</div>
            <span>ملعبي <span className="gradient-text">Malaaby</span></span>
          </Link>
          <p>
            المنصة الاحترافية الأولى لإنشاء وإدارة مواقع حجز ملاعب كرة القدم. نسعى لتمكين ملاك الملاعب من رقمنة أعمالهم وتوفير تجربة حجز استثنائية للشباب.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="footer-title">روابط سريعة</h4>
          <ul className="footer-links">
            <li><Link href="/#hero" className="footer-link">الرئيسية</Link></li>
            <li><Link href="/#features" className="footer-link">المميزات</Link></li>
            <li><Link href="/#how-it-works" className="footer-link">كيف نعمل</Link></li>
            <li><Link href="/#pricing" className="footer-link">خطط الأسعار</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="footer-title">الدعم والمساعدة</h4>
          <ul className="footer-links">
            <li><Link href="/#faq" className="footer-link">الأسئلة الشائعة</Link></li>
            <li><Link href="/#contact" className="footer-link">اتصل بنا</Link></li>
            <li><Link href="/terms" className="footer-link">الشروط والأحكام</Link></li>
            <li><Link href="/privacy" className="footer-link">سياسة الخصوصية</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="footer-title">معلومات الاتصال</h4>
          <ul className="footer-links" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li>📞 هاتف: <a href="tel:01126947405" style={{color:'var(--text-secondary)',textDecoration:'none'}}>01126947405</a></li>
            <li>💬 واتساب: <a href="https://wa.me/201126947405" target="_blank" rel="noreferrer" style={{color:'var(--text-secondary)',textDecoration:'none'}}>+201126947405</a></li>
            <li>✉️ البريد: <a href="mailto:Magedprooo8@gmail.com" style={{color:'var(--text-secondary)',textDecoration:'none'}}>Magedprooo8@gmail.com</a></li>
            <li>📍 العنوان: التجمع الخامس، القاهرة، مصر</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <div>جميع الحقوق محفوظة © {new Date().getFullYear()} منصة ملعبي (Malaaby)</div>
        <div>صنع بشغف لعشاق كرة القدم ⚽</div>
      </div>
    </footer>
  );
};
export default Footer;

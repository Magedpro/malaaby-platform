export const APP_NAME = 'ملعبي';
export const APP_NAME_EN = 'Malaaby';
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('malaaby.vercel.app')
    ? process.env.NEXT_PUBLIC_APP_URL
    : typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NODE_ENV === 'production'
        ? 'https://www.malaaby.online'
        : 'http://localhost:3000'
);
export const APP_DESCRIPTION = 'منصة احتجاز ملاعب كرة القدم الاحترافية - أنشئ موقعك الخاص لحجز الملاعب بدون كود';

export const BOOKING_STATUSES = {
  pending: { label: 'قيد المراجعة', color: 'warning' },
  confirmed: { label: 'مؤكد', color: 'success' },
  rejected: { label: 'مرفوض', color: 'danger' },
  cancelled: { label: 'ملغي', color: 'muted' },
  completed: { label: 'مكتمل', color: 'info' },
  payment_pending: { label: 'في انتظار الدفع', color: 'warning' },
  payment_failed: { label: 'فشل الدفع', color: 'danger' },
} as const;

export const REJECTION_REASONS = [
  'الوقت محجوز مسبقاً',
  'دفع مكرر',
  'فشل التحقق من الدفع',
  'أخرى',
];

export const FIELD_STATUSES = {
  available: { label: 'متاح', color: 'success' },
  maintenance: { label: 'صيانة', color: 'warning' },
  closed: { label: 'مغلق', color: 'danger' },
} as const;

export const BOOKING_DURATIONS = [
  { value: 30, label: '30 دقيقة' },
  { value: 60, label: '60 دقيقة (ساعة)' },
  { value: 90, label: '90 دقيقة' },
  { value: 120, label: '120 دقيقة (ساعتين)' },
] as const;

export const DAYS_AR = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
} as const;

export const DAY_KEYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUBSCRIPTION_STATUS = {
  trial: { label: 'تجريبي', color: 'info' },
  active: { label: 'نشط', color: 'success' },
  expired: { label: 'منتهي', color: 'danger' },
  suspended: { label: 'موقوف', color: 'warning' },
} as const;

export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const CITIES_DEFAULT = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الأقصر', 'أسوان',
  'المنصورة', 'طنطا', 'الزقازيق', 'الإسماعيلية', 'بورسعيد',
  'السويس', 'المنيا', 'أسيوط', 'سوهاج', 'قنا',
  'شرم الشيخ', 'الغردقة', 'دمياط', 'الفيوم', 'بني سويف',
];

// ── Platform Owner Payment Contact ──────────────────────────────────────────
// All commission & subscription payments are sent to these numbers ONLY.
// Change once here → automatically applies everywhere.
export const PLATFORM_PAYMENT_PHONE     = '01126947405';        // Local EG format
export const PLATFORM_PAYMENT_PHONE_INTL = '201126947405';      // Without + (for wa.me links)
export const PLATFORM_WHATSAPP_LINK      = 'https://wa.me/201126947405';

// ── PayMob Commission Config ──────────────────────────────────────────────────────
// Fixed deductions from each confirmed booking:
export const PLATFORM_COMMISSION_EGP = 5;   // Platform profit per booking
export const PAYMOB_FEE_FLAT_EGP     = 5;   // Approx PayMob fee (covered by platform)
export const TOTAL_DEDUCTION_EGP     = 10;  // Total deducted from stadium owner

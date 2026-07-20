export const APP_NAME = 'ملعبي';
export const APP_NAME_EN = 'Malaaby';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const APP_DESCRIPTION = 'منصة احتجاز ملاعب كرة القدم الاحترافية - أنشئ موقعك الخاص لحجز الملاعب بدون كود';

export const BOOKING_STATUSES = {
  pending: { label: 'قيد المراجعة', color: 'warning' },
  confirmed: { label: 'مؤكد', color: 'success' },
  rejected: { label: 'مرفوض', color: 'danger' },
  cancelled: { label: 'ملغي', color: 'muted' },
  completed: { label: 'مكتمل', color: 'info' },
} as const;

export const REJECTION_REASONS = [
  'لم يتم استلام الدفع',
  'المبلغ غير صحيح',
  'صورة الإيصال غير واضحة',
  'دفع مكرر',
  'الوقت محجوز مسبقاً',
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

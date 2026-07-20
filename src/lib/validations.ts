import { isValidEmail, isValidPhone, isValidSlug } from './utils';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function ok(): ValidationResult { return { valid: true, errors: {} }; }
function fail(errors: Record<string, string>): ValidationResult { return { valid: false, errors }; }

export function validateRegister(body: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2)
    errors.name = 'الاسم يجب أن يكون حرفين على الأقل';

  if (!body.email || !isValidEmail(String(body.email)))
    errors.email = 'البريد الإلكتروني غير صحيح';

  if (!body.password || String(body.password).length < 8)
    errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';

  if (body.password !== body.confirmPassword)
    errors.confirmPassword = 'كلمة المرور غير متطابقة';

  if (!body.phone || !isValidPhone(String(body.phone)))
    errors.phone = 'رقم الهاتف غير صحيح';

  if (!body.stadiumName || typeof body.stadiumName !== 'string' || body.stadiumName.trim().length < 2)
    errors.stadiumName = 'اسم الملعب يجب أن يكون حرفين على الأقل';

  if (!body.slug || !isValidSlug(String(body.slug)))
    errors.slug = 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3-50 حرف)';

  if (!body.city || typeof body.city !== 'string')
    errors.city = 'المدينة مطلوبة';

  if (Object.keys(errors).length > 0) return fail(errors);
  return ok();
}

export function validateLogin(body: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body.email || !isValidEmail(String(body.email)))
    errors.email = 'البريد الإلكتروني غير صحيح';

  if (!body.password || String(body.password).length < 1)
    errors.password = 'كلمة المرور مطلوبة';

  if (Object.keys(errors).length > 0) return fail(errors);
  return ok();
}

export function validateField(body: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2)
    errors.name = 'اسم الملعب يجب أن يكون حرفين على الأقل';

  const price = Number(body.pricePerHour);
  if (!body.pricePerHour || isNaN(price) || price < 1)
    errors.pricePerHour = 'السعر يجب أن يكون أكبر من صفر';

  const duration = Number(body.bookingDuration);
  if (![30, 60, 90, 120].includes(duration))
    errors.bookingDuration = 'مدة الحجز غير صحيحة';

  if (!body.openingTime || !/^\d{2}:\d{2}$/.test(String(body.openingTime)))
    errors.openingTime = 'وقت الفتح غير صحيح';

  if (!body.closingTime || !/^\d{2}:\d{2}$/.test(String(body.closingTime)))
    errors.closingTime = 'وقت الإغلاق غير صحيح';

  if (Object.keys(errors).length > 0) return fail(errors);
  return ok();
}

export function validateBooking(body: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body.customerName || typeof body.customerName !== 'string' || body.customerName.trim().length < 2)
    errors.customerName = 'الاسم يجب أن يكون حرفين على الأقل';

  if (!body.customerPhone || !isValidPhone(String(body.customerPhone)))
    errors.customerPhone = 'رقم الهاتف غير صحيح';

  if (!body.fieldId)
    errors.fieldId = 'الملعب مطلوب';

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(body.date)))
    errors.date = 'التاريخ غير صحيح';

  if (!body.startTime || !/^\d{2}:\d{2}$/.test(String(body.startTime)))
    errors.startTime = 'وقت البداية غير صحيح';

  if (!body.endTime || !/^\d{2}:\d{2}$/.test(String(body.endTime)))
    errors.endTime = 'وقت النهاية غير صحيح';

  if (Object.keys(errors).length > 0) return fail(errors);
  return ok();
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. الأنواع المقبولة: JPG, PNG, WEBP' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'حجم الملف يجب ألا يتجاوز 10 ميجابايت' };
  }
  return { valid: true };
}

import { MONTHS_AR } from './constants';

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  // "14:00" -> "2:00 م"
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    return new Intl.DateTimeFormat('ar-EG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return timeStr;
  }
}

export function formatDateTime(isoStr: string): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(isoStr));
  } catch {
    return isoStr;
  }
}

export function timeAgo(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return formatDate(isoStr);
}

/** Get current Date in Africa/Cairo (Egypt) timezone */
export function getEgyptNow(): Date {
  const now = new Date();
  try {
    const egyptStr = now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    return new Date(egyptStr);
  } catch {
    return now;
  }
}

export function getTodayString(): string {
  const egyptNow = getEgyptNow();
  const year = egyptNow.getFullYear();
  const month = String(egyptNow.getMonth() + 1).padStart(2, '0');
  const day = String(egyptNow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEgyptMinutesNow(): number {
  const egyptNow = getEgyptNow();
  return egyptNow.getHours() * 60 + egyptNow.getMinutes();
}

export function getMonthString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthName(monthStr: string): string {
  const [, month] = monthStr.split('-');
  return MONTHS_AR[parseInt(month) - 1] || monthStr;
}

export function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 0) return '';

  // Local Egyptian number 01xxxxxxxxx (11 digits)
  if (clean.startsWith('01') && clean.length === 11) {
    clean = '2' + clean; // -> 201126947405
  }
  // Local Egyptian number 1xxxxxxxxx (10 digits without leading 0)
  else if (clean.startsWith('1') && clean.length === 10) {
    clean = '20' + clean; // -> 201126947405
  }
  // Egyptian number starting with 002
  else if (clean.startsWith('002')) {
    clean = clean.slice(2);
  }

  return clean;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^(\+20|0)?1[0-2,5]\d{8}$/.test(phone.replace(/\s/g, ''));
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(str: string, length = 60): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
}

export function getWeekdayKey(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

export function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthString(d));
  }
  return months;
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>'"]/g, '').trim();
}

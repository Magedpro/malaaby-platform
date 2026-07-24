// ── OTP & Security Rate Limiting Store ─────────────────────────────────────────

interface OtpEntry {
  code: string;
  expiresAt: number;
}

interface AttemptEntry {
  count: number;
  lockedUntil: number;
}

const otpMap = new Map<string, OtpEntry>();
const attemptsMap = new Map<string, AttemptEntry>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check if an IP or email is currently locked out due to too many failed login attempts
 */
export function isLockedOut(identifier: string): { locked: boolean; remainingMinutes?: number } {
  const clean = identifier.toLowerCase().trim();
  const entry = attemptsMap.get(clean);
  if (!entry) return { locked: false };

  if (Date.now() < entry.lockedUntil) {
    const remainingMinutes = Math.ceil((entry.lockedUntil - Date.now()) / (60 * 1000));
    return { locked: true, remainingMinutes };
  }

  // Lockout expired, clear entry
  if (entry.lockedUntil > 0 && Date.now() >= entry.lockedUntil) {
    attemptsMap.delete(clean);
  }

  return { locked: false };
}

/**
 * Record a failed attempt. Lock out if limit reached.
 */
export function recordFailedAttempt(identifier: string): { locked: boolean; attemptsLeft: number } {
  const clean = identifier.toLowerCase().trim();
  const entry = attemptsMap.get(clean) || { count: 0, lockedUntil: 0 };
  entry.count += 1;

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_TIME_MS;
    attemptsMap.set(clean, entry);
    return { locked: true, attemptsLeft: 0 };
  }

  attemptsMap.set(clean, entry);
  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - entry.count };
}

/**
 * Reset failed attempts on successful login
 */
export function resetFailedAttempts(identifier: string): void {
  attemptsMap.delete(identifier.toLowerCase().trim());
}

/**
 * Generate a 6-digit OTP code for 2FA
 */
export function generateOtp(email: string): string {
  const clean = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpMap.set(clean, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
  return code;
}

/**
 * Verify an OTP code
 */
export function verifyOtp(email: string, code: string): boolean {
  const clean = email.toLowerCase().trim();
  const entry = otpMap.get(clean);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(clean);
    return false;
  }

  if (entry.code === code.trim()) {
    otpMap.delete(clean); // One-time use
    return true;
  }

  return false;
}

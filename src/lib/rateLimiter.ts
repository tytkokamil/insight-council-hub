/**
 * Client-side rate limiter for login attempts.
 * Stores attempt counts in localStorage with expiry.
 * This is a UX layer – real security must be enforced server-side.
 */

const STORAGE_KEY = "login_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface AttemptData {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

function getData(): AttemptData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, firstAttemptAt: Date.now(), lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, firstAttemptAt: Date.now(), lockedUntil: null };
  }
}

function setData(data: AttemptData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isLockedOut(): { locked: boolean; remainingSeconds: number } {
  const data = getData();
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    return { locked: true, remainingSeconds: Math.ceil((data.lockedUntil - Date.now()) / 1000) };
  }
  // Reset if lockout expired
  if (data.lockedUntil && Date.now() >= data.lockedUntil) {
    resetAttempts();
  }
  return { locked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(): { locked: boolean; remainingAttempts: number; lockoutSeconds: number } {
  const data = getData();
  
  // Reset if window expired (e.g. old attempts)
  const windowMs = 15 * 60 * 1000; // 15 min window
  if (Date.now() - data.firstAttemptAt > windowMs) {
    data.count = 0;
    data.firstAttemptAt = Date.now();
    data.lockedUntil = null;
  }

  data.count++;

  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    setData(data);
    return { locked: true, remainingAttempts: 0, lockoutSeconds: LOCKOUT_DURATION_MS / 1000 };
  }

  setData(data);
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - data.count, lockoutSeconds: 0 };
}

export function resetAttempts() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRemainingAttempts(): number {
  const data = getData();
  return Math.max(0, MAX_ATTEMPTS - data.count);
}

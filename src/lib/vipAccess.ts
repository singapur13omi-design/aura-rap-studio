'use client';

const VIP_STORAGE_KEY = 'aura_rap_studio_vip_session';

export interface StoredVipSession {
  activatedAt: number; // timestamp ms
  durationDays: number;
  label?: string;
}

export function getStoredVipSession(): StoredVipSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VIP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Activates local 30-day trial session for anonymous guest mode
 */
export function activate30DayFreeTrial(): StoredVipSession {
  const existing = getStoredVipSession();
  if (existing) {
    return existing;
  }

  const session: StoredVipSession = {
    activatedAt: Date.now(),
    durationDays: 30,
    label: '30-Day Free Studio Trial',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Validates and redeems a VIP or Contest code via the secure server-side API.
 * NO master codes or database tokens are stored on the client!
 */
export async function redeemVipCodeOnServer(code: string): Promise<{
  success: boolean;
  durationDays?: number;
  label?: string;
  error?: string;
}> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { success: false, error: 'Zadajte kód / Please enter a code' };
  }

  try {
    const res = await fetch('/api/vip/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalized }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Neplatný alebo vyčerpaný kód' };
    }

    const session: StoredVipSession = {
      activatedAt: Date.now(),
      durationDays: data.durationDays || 30,
      label: data.label,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(session));
    }

    return {
      success: true,
      durationDays: data.durationDays,
      label: data.label,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Chyba servera pri overovaní kódu',
    };
  }
}

/**
 * Checks client-side VIP / trial session status
 */
export function checkVipAccess(): {
  isUnlocked: boolean;
  daysRemaining: number;
  session: StoredVipSession | null;
  isExpired: boolean;
} {
  let session = getStoredVipSession();

  // If no session exists yet, activate initial 30-day trial
  if (!session) {
    session = activate30DayFreeTrial();
  }

  const now = Date.now();
  const durationMs = (session.durationDays || 30) * 24 * 60 * 60 * 1000;
  const expiresAt = session.activatedAt + durationMs;
  const msRemaining = expiresAt - now;

  if (msRemaining <= 0) {
    return { isUnlocked: false, daysRemaining: 0, session, isExpired: true };
  }

  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    isUnlocked: true,
    daysRemaining,
    session,
    isExpired: false,
  };
}

export function clearVipSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VIP_STORAGE_KEY);
  }
}

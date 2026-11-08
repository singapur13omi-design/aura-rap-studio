'use client';

export interface VipTokenInfo {
  code: string;
  label: string;
  recipient: string;
  durationDays: number;
}

export const VALID_VIP_TOKENS: Record<string, VipTokenInfo> = {
  // 3 Contest Winner Tokens (1 Year Free Access)
  'AURA-CONTEST-WINNER-1': {
    code: 'AURA-CONTEST-WINNER-1',
    label: '13OMI Contest Winner #1',
    recipient: 'Výherca súťaže o 1-ročnú licenciu zdarma',
    durationDays: 365,
  },
  'AURA-CONTEST-WINNER-2': {
    code: 'AURA-CONTEST-WINNER-2',
    label: '13OMI Contest Winner #2',
    recipient: 'Výherca súťaže o 1-ročnú licenciu zdarma',
    durationDays: 365,
  },
  'AURA-CONTEST-WINNER-3': {
    code: 'AURA-CONTEST-WINNER-3',
    label: '13OMI Contest Winner #3',
    recipient: 'Výherca súťaže o 1-ročnú licenciu zdarma',
    durationDays: 365,
  },
  // Beta invites
  'AURA-VIP-FLOW-01': {
    code: 'AURA-VIP-FLOW-01',
    label: 'VIP Rapper 01',
    recipient: 'Artist Beta Invite #1',
    durationDays: 30,
  },
  'AURA-VIP-BEAT-02': {
    code: 'AURA-VIP-BEAT-02',
    label: 'VIP Producer 02',
    recipient: 'Artist Beta Invite #2',
    durationDays: 30,
  },
  'AURA-VIP-PRO-03': {
    code: 'AURA-VIP-PRO-03',
    label: 'VIP Studio 03',
    recipient: 'Artist Beta Invite #3',
    durationDays: 30,
  },
  // Master Creator Pass (Lifetime unlimited for 13OMI Founder)
  'AURA-MASTER-CREATOR-2026': {
    code: 'AURA-MASTER-CREATOR-2026',
    label: 'Master Studio Owner (13OMI)',
    recipient: 'Founder & Studio Owner (Doživotne Zadarmo)',
    durationDays: 3650, // 10 years / lifetime
  },
};

const VIP_STORAGE_KEY = 'aura_rap_studio_vip_session';

export interface StoredVipSession {
  code: string;
  activatedAt: number; // timestamp ms
  durationDays: number;
  isOwner?: boolean;
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
 * Activates a 30-day free trial for any new visitor or registered user without a code
 */
export function activate30DayFreeTrial(): StoredVipSession {
  const existing = getStoredVipSession();
  if (existing && !existing.code.startsWith('AURA-FREE-TRIAL-30D')) {
    // Keep existing custom VIP or Owner session
    return existing;
  }

  const session: StoredVipSession = {
    code: 'AURA-FREE-TRIAL-30D',
    activatedAt: existing?.activatedAt || Date.now(),
    durationDays: 30,
    isOwner: false,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function activateVipToken(code: string): { success: boolean; session?: StoredVipSession; error?: string } {
  const normalized = code.trim().toUpperCase();
  const tokenInfo = VALID_VIP_TOKENS[normalized];

  if (!tokenInfo) {
    return { success: false, error: 'Neplatný VIP / Súťažný kód (Invalid Code)' };
  }

  const isOwner = normalized === 'AURA-MASTER-CREATOR-2026';

  const session: StoredVipSession = {
    code: normalized,
    activatedAt: Date.now(),
    durationDays: tokenInfo.durationDays,
    isOwner,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(session));
  }

  return { success: true, session };
}

export function checkVipAccess(): {
  isUnlocked: boolean;
  daysRemaining: number;
  session: StoredVipSession | null;
  isExpired: boolean;
  isOwner: boolean;
} {
  let session = getStoredVipSession();

  // If no session exists yet, automatically initialize 30-day free trial
  if (!session) {
    session = activate30DayFreeTrial();
  }

  if (session.isOwner || session.code === 'AURA-MASTER-CREATOR-2026') {
    return {
      isUnlocked: true,
      daysRemaining: 999,
      session,
      isExpired: false,
      isOwner: true,
    };
  }

  const now = Date.now();
  const durationMs = session.durationDays * 24 * 60 * 60 * 1000;
  const expiresAt = session.activatedAt + durationMs;
  const msRemaining = expiresAt - now;

  if (msRemaining <= 0) {
    return { isUnlocked: false, daysRemaining: 0, session, isExpired: true, isOwner: false };
  }

  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    isUnlocked: true,
    daysRemaining,
    session,
    isExpired: false,
    isOwner: false,
  };
}

export function clearVipSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VIP_STORAGE_KEY);
  }
}

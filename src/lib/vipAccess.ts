'use client';

export interface VipTokenInfo {
  code: string;
  label: string;
  recipient: string;
  durationDays: number;
}

export const VALID_VIP_TOKENS: Record<string, VipTokenInfo> = {
  'AURA-VIP-FLOW-01': {
    code: 'AURA-VIP-FLOW-01',
    label: 'VIP Rapper 01',
    recipient: 'Artist Beta Invite #1',
    durationDays: 14,
  },
  'AURA-VIP-BEAT-02': {
    code: 'AURA-VIP-BEAT-02',
    label: 'VIP Producer 02',
    recipient: 'Artist Beta Invite #2',
    durationDays: 14,
  },
  'AURA-VIP-PRO-03': {
    code: 'AURA-VIP-PRO-03',
    label: 'VIP Studio 03',
    recipient: 'Artist Beta Invite #3',
    durationDays: 14,
  },
  // Master Creator Pass (unlimited for you)
  'AURA-MASTER-CREATOR-2026': {
    code: 'AURA-MASTER-CREATOR-2026',
    label: 'Master Studio Admin',
    recipient: 'Founder & Studio Owner',
    durationDays: 365,
  },
};

const VIP_STORAGE_KEY = 'aura_rap_studio_vip_session';

export interface StoredVipSession {
  code: string;
  activatedAt: number; // timestamp ms
  durationDays: number;
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

export function activateVipToken(code: string): { success: boolean; session?: StoredVipSession; error?: string } {
  const normalized = code.trim().toUpperCase();
  const tokenInfo = VALID_VIP_TOKENS[normalized];

  if (!tokenInfo) {
    return { success: false, error: 'Neplatný VIP kód / Invalid VIP Access Code' };
  }

  const session: StoredVipSession = {
    code: normalized,
    activatedAt: Date.now(),
    durationDays: tokenInfo.durationDays,
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
} {
  const session = getStoredVipSession();
  if (!session) {
    return { isUnlocked: false, daysRemaining: 0, session: null, isExpired: false };
  }

  const now = Date.now();
  const durationMs = session.durationDays * 24 * 60 * 60 * 1000;
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

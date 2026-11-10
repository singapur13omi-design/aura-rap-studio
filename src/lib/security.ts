/**
 * Server-side Security & Access Control Module
 * Enforces strict authorization, owner verification, and trial checks
 */

export const OWNER_EMAILS = [
  'singapur.13omi@gmail.com',
  (process.env.OWNER_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

/**
 * Strictly verifies whether an email belongs to the authenticated Studio Owner (13OMI).
 * NEVER use loose substring checks like email.includes('13omi')!
 */
export function isOwnerEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  return OWNER_EMAILS.includes(normalized);
}

export interface UserAccessCheck {
  allowed: boolean;
  isOwner: boolean;
  isSubscriber: boolean;
  isTrialActive: boolean;
  daysRemaining: number;
  reason?: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_CANCELED' | 'UNAUTHENTICATED' | 'OK';
}

/**
 * Server-side calculation of user studio access privileges
 */
export function calculateUserAccess(user: {
  role?: string | null;
  email?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | null;
  createdAt?: Date | null;
}): UserAccessCheck {
  const isOwner = user.role === 'OWNER' || isOwnerEmail(user.email);
  if (isOwner) {
    return {
      allowed: true,
      isOwner: true,
      isSubscriber: true,
      isTrialActive: true,
      daysRemaining: 9999,
      reason: 'OK',
    };
  }

  const isSubscriber =
    user.subscriptionStatus === 'ACTIVE' &&
    (user.plan === 'MONTHLY_PASS' ||
      user.plan === 'ANNUAL_PASS' ||
      user.plan === 'PRO_ARTIST' ||
      user.plan === 'STUDIO_PRO');

  if (isSubscriber) {
    return {
      allowed: true,
      isOwner: false,
      isSubscriber: true,
      isTrialActive: false,
      daysRemaining: 365,
      reason: 'OK',
    };
  }

  // Calculate 30-day trial based on server DB trialEndsAt or createdAt fallback
  const now = Date.now();
  let trialExpiryMs: number;

  if (user.trialEndsAt) {
    trialExpiryMs = new Date(user.trialEndsAt).getTime();
  } else if (user.createdAt) {
    // 30 days from creation
    trialExpiryMs = new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  } else {
    // Default 30 days from now for active trial
    trialExpiryMs = now + 30 * 24 * 60 * 60 * 1000;
  }

  const msRemaining = trialExpiryMs - now;

  if (msRemaining > 0) {
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    return {
      allowed: true,
      isOwner: false,
      isSubscriber: false,
      isTrialActive: true,
      daysRemaining,
      reason: 'OK',
    };
  }

  return {
    allowed: false,
    isOwner: false,
    isSubscriber: false,
    isTrialActive: false,
    daysRemaining: 0,
    reason: 'TRIAL_EXPIRED',
  };
}

export interface VideoAccessCheck {
  allowed: boolean;
  isOwner: boolean;
  hasAddon: boolean;
  credits: number;
}

/**
 * Server-side calculation of AURA AI Video Studio access privileges
 * Ensures OWNER has lifetime unlimited access and non-owners need the Video Add-on.
 */
export function calculateVideoAccess(user: {
  role?: string | null;
  email?: string | null;
  hasVideoAccess?: boolean | null;
  videoCredits?: number | null;
}): VideoAccessCheck {
  const isOwner = user.role === 'OWNER' || isOwnerEmail(user.email);
  if (isOwner) {
    return {
      allowed: true,
      isOwner: true,
      hasAddon: true,
      credits: 999999,
    };
  }

  const hasAddon = Boolean(user.hasVideoAccess);
  return {
    allowed: hasAddon,
    isOwner: false,
    hasAddon,
    credits: user.videoCredits || 0,
  };
}

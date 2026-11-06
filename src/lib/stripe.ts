import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    })
  : (null as unknown as Stripe);

export interface SubscriptionPlan {
  id: 'FREE' | 'PRO_ARTIST' | 'STUDIO_PRO';
  name: string;
  nameSk: string;
  tagline: string;
  taglineSk: string;
  priceEur: number;
  stripePriceId?: string;
  features: string[];
  featuresSk: string[];
  highlight?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  FREE: {
    id: 'FREE',
    name: 'Free Trial',
    nameSk: 'Skúšobná verzia',
    tagline: 'Start recording your first rap demo',
    taglineSk: 'Vyskúšaj si nahrať prvé rapové demo',
    priceEur: 0,
    features: [
      '1 Active Project',
      'High-quality Mic Recording (24-bit/48kHz)',
      'Basic Auto-Tune preview',
      'AI Flow Analysis (1 per track)',
      'MP3 192kbps Export',
    ],
    featuresSk: [
      '1 aktívny projekt',
      'Nahrávanie mikrofónu vo vysokej kvalite (24-bit/48kHz)',
      'Základný náhľad Auto-Tune',
      'AI Flow Analýza (1x na track)',
      'Export v MP3 formáte (192 kbps)',
    ],
  },
  PRO_ARTIST: {
    id: 'PRO_ARTIST',
    name: 'PRO Artist',
    nameSk: 'PRO Artist',
    tagline: 'For rappers, vocalists & solo artists',
    taglineSk: 'Pre rapperov, vokalistov a sólo umelcov',
    priceEur: 14.99,
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_artist_monthly',
    highlight: true,
    features: [
      'Unlimited Projects & Multitracks',
      'Real-time Pitch Correction & Auto-Tune FX',
      'AI Vocal Doubler & Ad-Lib Generator',
      'AI Rap Flow & Rhyme Assistant',
      'Master Quality WAV Export (24-bit / 48kHz)',
      'Royalty-Free Hip-Hop Beat Library Access',
    ],
    featuresSk: [
      'Neobmedzený počet projektov a audio stôp',
      'Real-time Pitch Correction & Auto-Tune FX',
      'AI Vocal Doubler & Ad-Lib generátor',
      'AI Rap Flow a rýmový asistent',
      'Master kvalita: WAV export (24-bit / 48 kHz)',
      'Neobmedzený prístup do Beat knižnice bez poplatkov',
    ],
  },
  STUDIO_PRO: {
    id: 'STUDIO_PRO',
    name: 'Studio PRO & Label',
    nameSk: 'Studio PRO & Label',
    tagline: 'Complete DAW power for producers & beatmakers',
    taglineSk: 'Plná sila digitálneho štúdia pre producentov a labely',
    priceEur: 29.99,
    stripePriceId: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID || 'price_studio_pro_monthly',
    features: [
      'Everything in PRO Artist',
      'AI Hip-Hop Beat Generator (Unlimited)',
      'AI Vocal & Beat Stem Separation',
      'Full Multitrack Stems Export (WAV zip)',
      'AI Audio Mastering Suite (-14 LUFS / -9 LUFS targets)',
      'Priority Cloud Rendering & Support',
    ],
    featuresSk: [
      'Všetko z balíka PRO Artist',
      'AI Hip-Hop Beat Generátor (neobmedzene)',
      'AI Vocal & Beat Stem Separation (rozklad na stopy)',
      'Plný Multitrack Stems Export (ZIP jednotlivých WAV stôp)',
      'AI Audio Mastering Suite (-14 LUFS Spotify, -9 LUFS Club)',
      'Prioritné cloudové spracovanie a podpora',
    ],
  },
};

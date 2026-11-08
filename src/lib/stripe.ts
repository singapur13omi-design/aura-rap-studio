import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    })
  : (null as unknown as Stripe);

export interface SubscriptionPlan {
  id: 'FREE_TRIAL' | 'MONTHLY_PASS' | 'ANNUAL_PASS' | 'FREE' | 'PRO_ARTIST' | 'STUDIO_PRO';
  name: string;
  nameSk: string;
  tagline: string;
  taglineSk: string;
  priceEur: number;
  interval?: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  featuresSk: string[];
  highlight?: boolean;
  badge?: string;
  badgeSk?: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  FREE_TRIAL: {
    id: 'FREE_TRIAL',
    name: '30-Day Free Trial',
    nameSk: '30 Dní Zadarmo',
    tagline: 'Full studio access for 30 days from registration',
    taglineSk: 'Plný prístup do štúdia na 30 dní od momentu registrácie',
    priceEur: 0,
    features: [
      '30 Days Full Studio Access',
      'Studio Vocal Recording (24-bit / 48kHz)',
      'Real-time Auto-Tune & Pitch Correction',
      'AI Vocal Doubler & Ad-Lib Generator',
      'Unlimited Hip-Hop Beat Library',
      'High-Quality MP3 & WAV Export',
    ],
    featuresSk: [
      '30 dní plného prístupu do štúdia',
      'Nahrávanie vokálov v štúdiovej kvalite (24-bit / 48 kHz)',
      'Real-time Auto-Tune a ladenie vokálu',
      'AI Vocal Doubler & Ad-Lib generátor',
      'Neobmedzený prístup ku knižnici hip-hopových beatov',
      'Kvalitný MP3 & WAV export trackov',
    ],
  },
  // Backward compatibility alias
  FREE: {
    id: 'FREE',
    name: '30-Day Free Trial',
    nameSk: '30 Dní Zadarmo',
    tagline: 'Full studio access for 30 days from registration',
    taglineSk: 'Plný prístup do štúdia na 30 dní od momentu registrácie',
    priceEur: 0,
    features: [
      '30 Days Full Studio Access',
      'Studio Vocal Recording (24-bit / 48kHz)',
      'Real-time Auto-Tune & Pitch Correction',
      'AI Vocal Doubler & Ad-Lib Generator',
      'Unlimited Hip-Hop Beat Library',
      'High-Quality MP3 & WAV Export',
    ],
    featuresSk: [
      '30 dní plného prístupu do štúdia',
      'Nahrávanie vokálov v štúdiovej kvalite (24-bit / 48 kHz)',
      'Real-time Auto-Tune a ladenie vokálu',
      'AI Vocal Doubler & Ad-Lib generátor',
      'Neobmedzený prístup ku knižnici hip-hopových beatov',
      'Kvalitný MP3 & WAV export trackov',
    ],
  },
  MONTHLY_PASS: {
    id: 'MONTHLY_PASS',
    name: 'Monthly Studio Pass',
    nameSk: 'Mesačný Studio Pass',
    tagline: 'Flexible month-to-month rap studio freedom',
    taglineSk: 'Flexibilné mesačné predplatné bez viazanosti',
    priceEur: 9.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_aura_monthly_999',
    features: [
      'Unlimited Projects & Multitrack Recordings',
      'Real-time Auto-Tune FX & Scale Quantization',
      'AI Vocal Doubler, Harmonizer & Ad-Libs',
      'Full Hip-Hop Beat Library Access (100% Royalty Free)',
      'AI Rap Flow & Rhyme Assistant',
      'Lossless 24-bit / 48kHz WAV Export',
      'Cancel Anytime with 1 Click',
    ],
    featuresSk: [
      'Neobmedzený počet projektov a audio stôp',
      'Real-time Auto-Tune FX & tóninová kvantizácia',
      'AI Vocal Doubler, zdvojovanie a Ad-Liby',
      'Plný prístup do Beat knižnice (100% Royalty Free)',
      'AI Rap Flow a rýmový asistent',
      'Bezstratový 24-bit / 48 kHz WAV export',
      'Kedykoľvek zrušiteľné jedným klikom',
    ],
  },
  // Backward compatibility alias for PRO_ARTIST
  PRO_ARTIST: {
    id: 'PRO_ARTIST',
    name: 'Monthly Studio Pass',
    nameSk: 'Mesačný Studio Pass',
    tagline: 'Flexible month-to-month rap studio freedom',
    taglineSk: 'Flexibilné mesačné predplatné bez viazanosti',
    priceEur: 9.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_aura_monthly_999',
    features: [
      'Unlimited Projects & Multitrack Recordings',
      'Real-time Auto-Tune FX & Scale Quantization',
      'AI Vocal Doubler, Harmonizer & Ad-Libs',
      'Full Hip-Hop Beat Library Access (100% Royalty Free)',
      'AI Rap Flow & Rhyme Assistant',
      'Lossless 24-bit / 48kHz WAV Export',
      'Cancel Anytime with 1 Click',
    ],
    featuresSk: [
      'Neobmedzený počet projektov a audio stôp',
      'Real-time Auto-Tune FX & tóninová kvantizácia',
      'AI Vocal Doubler, zdvojovanie a Ad-Liby',
      'Plný prístup do Beat knižnice (100% Royalty Free)',
      'AI Rap Flow a rýmový asistent',
      'Bezstratový 24-bit / 48 kHz WAV export',
      'Kedykoľvek zrušiteľné jedným klikom',
    ],
  },
  ANNUAL_PASS: {
    id: 'ANNUAL_PASS',
    name: 'Annual Founder Pass',
    nameSk: 'Ročný Founder Pass',
    tagline: 'Save 50% – Complete year of unlimited studio power',
    taglineSk: 'Ušetri 50 % – Celý rok neobmedzenej štúdiovej tvorby',
    priceEur: 59.99,
    interval: 'year',
    stripePriceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_aura_annual_5999',
    highlight: true,
    badge: 'SAVE 50% • RECOMMENDED',
    badgeSk: '50% ZĽAVA • ODPORÚČANÉ',
    features: [
      'Everything in Monthly Pass for a Full 365 Days',
      'Save 60 € / year (Equivalent to just 5.00 € / month)',
      'Unlimited Projects, Vocal Layers & AI Generation',
      'AI Vocal & Beat Stem Separation (WAV Stems Export)',
      'Full Multitrack Stems ZIP Export for Mixing Engineers',
      'AI Mastering Suite (-14 LUFS Spotify & -9 LUFS Club)',
      'Priority Access to New Beat Drops & Sound Packs',
      'Official 13OMI Founder Community Badge',
    ],
    featuresSk: [
      'Všetko z mesačného plánu na celých 365 dní',
      'Ušetríš 60 € ročne (vychádza len 5,00 € / mesiac)',
      'Neobmedzené projekty, vokálové vrstvy a AI beaty',
      'AI Stem Separation (rozklad na jednotlivé stopy)',
      'Plný Multitrack ZIP export pre zvukových inžinierov',
      'AI Mastering Suite (-14 LUFS Spotify, -9 LUFS Club)',
      'Prednostný prístup k novým beatom a sound packom',
      'Oficiálny 13OMI Founder odznak v komunite',
    ],
  },
  // Backward compatibility alias for STUDIO_PRO
  STUDIO_PRO: {
    id: 'STUDIO_PRO',
    name: 'Annual Founder Pass',
    nameSk: 'Ročný Founder Pass',
    tagline: 'Save 50% – Complete year of unlimited studio power',
    taglineSk: 'Ušetri 50 % – Celý rok neobmedzenej štúdiovej tvorby',
    priceEur: 59.99,
    interval: 'year',
    stripePriceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_aura_annual_5999',
    highlight: true,
    badge: 'SAVE 50% • RECOMMENDED',
    badgeSk: '50% ZĽAVA • ODPORÚČANÉ',
    features: [
      'Everything in Monthly Pass for a Full 365 Days',
      'Save 60 € / year (Equivalent to just 5.00 € / month)',
      'Unlimited Projects, Vocal Layers & AI Generation',
      'AI Vocal & Beat Stem Separation (WAV Stems Export)',
      'Full Multitrack Stems ZIP Export for Mixing Engineers',
      'AI Mastering Suite (-14 LUFS Spotify & -9 LUFS Club)',
      'Priority Access to New Beat Drops & Sound Packs',
      'Official 13OMI Founder Community Badge',
    ],
    featuresSk: [
      'Všetko z mesačného plánu na celých 365 dní',
      'Ušetríš 60 € ročne (vychádza len 5,00 € / mesiac)',
      'Neobmedzené projekty, vokálové vrstvy a AI beaty',
      'AI Stem Separation (rozklad na jednotlivé stopy)',
      'Plný Multitrack ZIP export pre zvukových inžinierov',
      'AI Mastering Suite (-14 LUFS Spotify, -9 LUFS Club)',
      'Prednostný prístup k novým beatom a sound packom',
      'Oficiálny 13OMI Founder odznak v komunite',
    ],
  },
};

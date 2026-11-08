'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Crown,
  Sparkles,
  Check,
  Flame,
  ArrowRight,
  Clock,
  Mic,
  Share2,
  Gift,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { useI18n } from '@/lib/i18n';

interface ContestAndPricingSectionProps {
  onEnterStudio: () => void;
  onOpenAuth?: () => void;
  onSelectPlan?: (planId: string) => void;
}

export const ContestAndPricingSection: React.FC<ContestAndPricingSectionProps> = ({
  onEnterStudio,
  onOpenAuth,
  onSelectPlan,
}) => {
  const { language } = useI18n();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isSk = language === 'sk';

  const contestSteps = [
    {
      num: '01',
      titleSk: 'Zaregistruj sa (30 Dní Zadarmo)',
      titleEn: 'Register (30 Days Free Trial)',
      descSk: 'Každý nový umelec automaticky získava 1 mesiac plného štúdia úplne zadarmo od momentu prihlásenia bez nutnosti karty.',
      descEn: 'Every new artist automatically gets 1 full month of studio access free from registration without needing a credit card.',
      icon: <Sparkles className="w-5 h-5 text-brand-electric" />,
    },
    {
      num: '02',
      titleSk: 'Nahraj 16-bars v AURA Štúdiu',
      titleEn: 'Record 16 Bars in AURA Studio',
      descSk: 'Vyber si beat z knižnice (Trap, Boom Bap, Drill), zapni Auto-Tune, nahraj slohu a využi AI Vocal Doubler pre masívny zvuk.',
      descEn: 'Pick any beat from the library, engage Auto-Tune, lay down your 16-bar verse and use the AI Vocal Doubler for huge punch.',
      icon: <Mic className="w-5 h-5 text-brand-gold" />,
    },
    {
      num: '03',
      titleSk: 'Zdieľaj s #AuraRapStudio & @13omi',
      titleEn: 'Post with #AuraRapStudio & @13omi',
      descSk: 'Exportuj ukážku a zaves video alebo snippet na Instagram Reels / TikTok s hashtagom #AuraRapStudio a označením @13omi.',
      descEn: 'Export your snippet and drop a video on Instagram Reels or TikTok with #AuraRapStudio and tag @13omi.',
      icon: <Share2 className="w-5 h-5 text-cyan-400" />,
    },
    {
      num: '04',
      titleSk: 'Vyhraj 1 Rok v Štúdiu Zadarmo',
      titleEn: 'Win 1 Full Year Free Access',
      descSk: '13OMI osobne vyberie 3 najautentickejšie a najtvrdšie výkony, ktoré získajú ročnú VIP licenciu (v hodnote 60 €) úplne zadarmo.',
      descEn: '13OMI will personally select the 3 sickest flows to receive a 1-year VIP pass (worth 60 €) 100% free.',
      icon: <Trophy className="w-5 h-5 text-yellow-400" />,
    },
  ];

  return (
    <section id="pricing-and-contest" className="relative py-24 px-4 sm:px-6 bg-brand-carbon border-b border-brand-concrete/60 overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-brand-electric/10 via-brand-gold/15 to-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-20">
        
        {/* ======================================================== */}
        {/* 1. SÚŤAŽ O 3 ROČNÉ LICENCIE ZDARMA (13OMI AURA CHALLENGE) */}
        {/* ======================================================== */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-brand-concrete/90 via-brand-carbon to-black border-2 border-brand-gold/60 shadow-[0_0_50px_rgba(200,164,93,0.15)] overflow-hidden">
          {/* Street Accent Tag */}
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-brand-gold/25">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold text-brand-gold text-xs font-accent font-extrabold tracking-widest uppercase">
                <Crown className="w-4 h-4 text-brand-gold fill-current" />
                <span>{isSk ? 'EXKLUZÍVNA 13OMI SÚŤAŽ' : 'EXCLUSIVE 13OMI CHALLENGE'}</span>
              </div>
              <h2 className="font-headline text-4xl sm:text-6xl text-white tracking-tight leading-none">
                DROP YOUR FLOW &amp; <span className="text-gold-metallic">VYHRAJ ROK ZDARMA</span>
              </h2>
              <p className="font-sans text-sm sm:text-base text-brand-chrome/80 max-w-2xl">
                {isSk
                  ? 'Ukáž svoj hlas, svoj flow a svoju pravdu. Hľadáme 3 najlepšie undergroundové a autentické rapové výkony, ktoré získajú neobmedzenú ročnú licenciu v AURA RAP STUDIO.'
                  : 'Show your voice, your flow and your real identity. We are picking the 3 hardest underground rap performances to win a 1-year unlimited license.'}
              </p>
            </div>

            {/* Prize Callout Box */}
            <div className="bg-brand-black/90 border border-brand-gold/50 rounded-2xl p-5 text-center sm:text-right min-w-[240px] shadow-lg">
              <span className="font-accent text-[11px] text-brand-steel tracking-widest uppercase block">
                {isSk ? 'HLAVNÁ CENA' : 'GRAND PRIZE'}
              </span>
              <span className="font-headline text-3xl sm:text-4xl text-brand-gold block font-black">
                3× 1 ROK ZDARMA
              </span>
              <span className="font-accent text-xs text-brand-steel block mt-1">
                {isSk ? 'Hodnota: 3× 60 € / rok • Bez poplatkov' : 'Worth: 3× 60 € / yr • 100% Royalty Free'}
              </span>
            </div>
          </div>

          {/* 4 Contest Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {contestSteps.map((step, idx) => (
              <div
                key={idx}
                className="relative p-5 rounded-2xl bg-brand-black/70 border border-brand-concrete hover:border-brand-gold/60 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-headline text-2xl text-brand-gold/80 font-bold group-hover:text-brand-gold">
                      {step.num}
                    </span>
                    <div className="p-2 rounded-xl bg-brand-concrete/60 group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                  </div>
                  <h4 className="font-headline text-lg text-white mb-2 tracking-wide">
                    {isSk ? step.titleSk : step.titleEn}
                  </h4>
                  <p className="font-sans text-xs text-brand-steel leading-relaxed">
                    {isSk ? step.descSk : step.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Contest Action CTA */}
          <div className="mt-8 pt-6 border-t border-brand-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-accent text-brand-gold">
              <Flame className="w-4 h-4 text-brand-gold animate-bounce" />
              <span>
                {isSk
                  ? 'Súťaž beží teraz • Registruj sa a tvojich 30 dní zadarmo sa začne okamžite'
                  : 'Contest is live • Register and your 30 days free begins instantly'}
              </span>
            </div>
            <button
              onClick={onEnterStudio}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-gold via-yellow-400 to-amber-500 hover:brightness-110 text-black font-headline text-lg tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(200,164,93,0.35)] transition"
            >
              <span>{isSk ? 'ZAPOJIŤ SA DO SÚŤAŽE V ŠTÚDIU' : 'JOIN THE CHALLENGE IN STUDIO'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. CENOTVORBA & BALÍČKY (30 DNÍ ZDARMA / 9.99€ / 60€) */}
        {/* ======================================================== */}
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-electric/15 border border-brand-electric/40 text-brand-electric text-xs font-accent font-bold tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>{isSk ? 'FÉROVÉ CENY BEZ PRETVÁRKY' : 'TRANSPARENT ARTIST PRICING'}</span>
            </div>
            <h2 className="font-headline text-4xl sm:text-6xl text-white tracking-tight leading-none">
              VYBER SI <span className="text-aura-gradient">SVOJ PLÁN</span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-brand-chrome/80">
              {isSk
                ? 'Začni s 1 mesiacom zadarmo. Ak sa ti štúdio zapáči, pokračuj flexibilne mesačne alebo ušetri 50 % s ročným Founder pasom.'
                : 'Start with 1 month free. If you love the vibe, continue month-to-month or save 50% with the Annual Founder pass.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CARD 1: 30 DNÍ ZADARMO */}
            <div className="relative rounded-3xl p-8 bg-brand-black border border-brand-concrete hover:border-brand-steel/60 transition-all flex flex-col justify-between shadow-xl">
              <div className="space-y-6">
                <div>
                  <span className="font-accent text-xs font-bold text-brand-electric tracking-widest uppercase block mb-1">
                    {isSk ? 'ŠTART BEZ RIZIKA' : 'RISK-FREE TRIAL'}
                  </span>
                  <h3 className="font-headline text-3xl text-white tracking-wide">
                    {isSk ? '30 Dní Zadarmo' : '30-Day Free Trial'}
                  </h3>
                  <p className="font-sans text-xs text-brand-steel mt-2">
                    {isSk
                      ? 'Plný prístup do štúdia na 30 dní od momentu registrácie.'
                      : 'Full studio access for 30 days from moment of registration.'}
                  </p>
                </div>

                <div className="py-4 border-y border-brand-concrete/60">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-5xl text-white font-black">0 €</span>
                    <span className="font-accent text-xs text-brand-steel uppercase tracking-wider">
                      {isSk ? '/ prvých 30 dní' : '/ first 30 days'}
                    </span>
                  </div>
                  <span className="font-accent text-[11px] text-brand-electric mt-1 block">
                    {isSk ? '✓ Bez nutnosti zadávať platobnú kartu' : '✓ No credit card required'}
                  </span>
                </div>

                <ul className="space-y-3 font-sans text-xs text-brand-chrome/90">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? '30 dní plného prístupu do štúdia' : '30 days full DAW access'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? '24-bit / 48 kHz nahrávanie mikrofónu' : '24-bit / 48kHz mic recording'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'Real-time Auto-Tune & Pitch Correction' : 'Real-time Auto-Tune & Scale FX'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'Neobmedzená knižnica hip-hopových beatov' : 'Royalty-free hip-hop beat library'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'WAV a MP3 export vlastných skladieb' : 'WAV & MP3 track export'}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onEnterStudio}
                className="mt-8 w-full py-3.5 rounded-xl bg-brand-concrete hover:bg-brand-steel text-white font-headline text-base tracking-wider uppercase transition text-center"
              >
                {isSk ? 'SPUSTIŤ 30 DNÍ ZADARMO' : 'START 30 DAYS FREE'}
              </button>
            </div>

            {/* CARD 2: MESAČNÝ PASS (9.99 €) */}
            <div className="relative rounded-3xl p-8 bg-brand-black border border-brand-electric/50 hover:border-brand-electric transition-all flex flex-col justify-between shadow-2xl">
              <div className="space-y-6">
                <div>
                  <span className="font-accent text-xs font-bold text-brand-electric tracking-widest uppercase block mb-1">
                    {isSk ? 'FLEXIBILNÉ BEZ VIAZANOSTI' : 'MONTH-TO-MONTH'}
                  </span>
                  <h3 className="font-headline text-3xl text-white tracking-wide">
                    {isSk ? 'Mesačný Pass' : 'Monthly Studio Pass'}
                  </h3>
                  <p className="font-sans text-xs text-brand-steel mt-2">
                    {isSk
                      ? 'Pre aktívnych raperov s mesačnou slobodou.'
                      : 'For active artists who prefer monthly freedom.'}
                  </p>
                </div>

                <div className="py-4 border-y border-brand-concrete/60">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-5xl text-brand-electric font-black">9,99 €</span>
                    <span className="font-accent text-xs text-brand-steel uppercase tracking-wider">
                      {isSk ? '/ mesiac' : '/ month'}
                    </span>
                  </div>
                  <span className="font-accent text-[11px] text-brand-steel mt-1 block">
                    {isSk ? '✓ Zrušiteľné kedykoľvek na 1 klik' : '✓ Cancel anytime with 1 click'}
                  </span>
                </div>

                <ul className="space-y-3 font-sans text-xs text-brand-chrome/90">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'Neobmedzený počet projektov a audio stôp' : 'Unlimited multitracks & projects'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'AI Vocal Doubler, zdvojovanie a Ad-Liby' : 'AI Vocal Doubler & Ad-Lib engine'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'AI Rap Flow a rýmový asistent' : 'AI Rap Flow & Rhyme assistant'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? 'Bezstratový 24-bit / 48 kHz WAV export' : 'Lossless 24-bit / 48kHz WAV export'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-electric shrink-0 mt-0.5" />
                    <span>{isSk ? '100% autorské práva patria tebe' : '100% rights stay with the artist'}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan ? onSelectPlan('MONTHLY_PASS') : onEnterStudio()}
                className="mt-8 w-full py-3.5 rounded-xl bg-brand-electric hover:bg-blue-600 text-black font-headline text-base tracking-wider uppercase transition text-center shadow-[0_0_20px_rgba(40,107,255,0.3)]"
              >
                {isSk ? 'ZVOLIŤ MESAČNÝ PASS (9,99 €)' : 'GET MONTHLY PASS (9.99 €)'}
              </button>
            </div>

            {/* CARD 3: ROČNÝ PASS (60 € / 50% ZĽAVA) - HIGHLIGHT */}
            <div className="relative rounded-3xl p-8 bg-gradient-to-b from-brand-concrete/80 to-brand-black border-2 border-brand-gold shadow-[0_0_40px_rgba(200,164,93,0.25)] flex flex-col justify-between transform lg:-translate-y-2">
              {/* Highlight Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-gold text-black font-accent text-[11px] font-black tracking-widest uppercase shadow-md flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>{isSk ? '50% ZĽAVA • ODPORÚČANÉ' : '50% OFF • RECOMMENDED'}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="font-accent text-xs font-bold text-brand-gold tracking-widest uppercase block mb-1">
                    {isSk ? 'MAXIMÁLNA HODNOTA' : 'ULTIMATE VALUE'}
                  </span>
                  <h3 className="font-headline text-3xl text-white tracking-wide">
                    {isSk ? 'Ročný Founder Pass' : 'Annual Founder Pass'}
                  </h3>
                  <p className="font-sans text-xs text-brand-steel mt-2">
                    {isSk
                      ? 'Celý rok neobmedzenej tvorby za polovicu bežnej ceny.'
                      : 'Full year of unlimited studio power at 50% off.'}
                  </p>
                </div>

                <div className="py-4 border-y border-brand-gold/30">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-5xl text-gold-metallic font-black">60 €</span>
                    <span className="font-accent text-xs text-brand-steel uppercase tracking-wider">
                      {isSk ? '/ rok' : '/ year'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-accent text-xs text-brand-gold font-bold">
                      {isSk ? 'Len 5,00 € / mesiac' : 'Just 5.00 € / month'}
                    </span>
                    <span className="text-brand-steel text-xs line-through">119,88 €</span>
                    <span className="px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold font-accent text-[10px] font-black">
                      -50%
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 font-sans text-xs text-brand-chrome/90">
                  <li className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span className="font-semibold text-white">
                      {isSk ? 'Všetko z mesačného plánu na celých 365 dní' : 'Everything in monthly for a full 365 days'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>{isSk ? 'Ušetríš 60 € ročne oproti mesačnej platbe' : 'Save 60 €/year vs month-to-month'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>{isSk ? 'AI Stem Separation (rozklad tracku na stopy)' : 'AI Vocal & Beat Stem Separation'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>{isSk ? 'Plný Multitrack ZIP export pre mastering' : 'Full Multitrack ZIP stems export'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>{isSk ? 'AI Audio Mastering (-14 LUFS Spotify, -9 Club)' : 'AI Audio Mastering Suite'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>{isSk ? 'Oficiálny 13OMI Founder odznak v komunite' : 'Official 13OMI Founder community badge'}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan ? onSelectPlan('ANNUAL_PASS') : onEnterStudio()}
                className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-brand-gold via-yellow-400 to-amber-500 hover:brightness-110 text-black font-headline text-lg tracking-wider uppercase transition text-center shadow-[0_0_30px_rgba(200,164,93,0.35)]"
              >
                {isSk ? 'ZÍSKAŤ ROČNÝ PASS (60 €)' : 'GET ANNUAL PASS (60 €)'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

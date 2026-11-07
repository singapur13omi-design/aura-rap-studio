'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, Sparkles, Mic, Play, Volume2, Shield } from 'lucide-react';
import { BRAND_IDENTITY } from '@/lib/branding';
import { useI18n } from '@/lib/i18n';

interface LandingHeroProps {
  onEnterStudio: () => void;
  onExploreCulture: () => void;
  onOpenTutorial: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnterStudio,
  onExploreCulture,
  onOpenTutorial,
}) => {
  const { language } = useI18n();

  const tagline = language === 'sk' ? BRAND_IDENTITY.taglineSk : BRAND_IDENTITY.tagline;
  const subline = language === 'sk' ? BRAND_IDENTITY.sublineSk : BRAND_IDENTITY.subline;
  const endorsement = language === 'sk' ? BRAND_IDENTITY.endorsementSk : BRAND_IDENTITY.endorsement;

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-brand-black bg-audio-grid border-b border-brand-concrete/60 select-none">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-brand-electric/15 via-brand-violet/20 to-brand-neon/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Sub-Header */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/branding/aura-symbol.svg"
            alt="AURA Symbol"
            className="w-10 h-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]"
          />
          <div>
            <span className="font-headline text-2xl tracking-widest text-white block leading-none">
              AURA RAP STUDIO
            </span>
            <span className="font-accent text-[10px] tracking-[0.25em] text-brand-steel uppercase font-bold">
              UNDERGROUND × DIGITAL DAW
            </span>
          </div>
        </div>

        {/* 13OMI Signature Stamp */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-carbon/80 border border-brand-gold/40 shadow-sm">
          <img
            src="/assets/branding/13omi-signature.svg"
            alt="13OMI Signature"
            className="h-6 w-auto object-contain"
          />
          <span className="font-accent text-[10px] text-brand-gold font-bold tracking-widest uppercase hidden sm:inline">
            ORIGINAL
          </span>
        </div>
      </div>

      {/* Central Cinematic Typography & Callouts */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 my-auto text-center py-12">
        {/* Culture Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-carbon/90 border border-brand-electric/40 text-brand-electric text-xs font-accent font-bold tracking-[0.2em] uppercase mb-6 shadow-[0_0_20px_rgba(40,107,255,0.2)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{endorsement}</span>
        </div>

        {/* Massive Street Poster Headline */}
        <h1 className="font-headline text-6xl sm:text-8xl md:text-9xl tracking-tight text-white leading-[0.88] drop-shadow-2xl">
          AURA <span className="text-aura-gradient">RAP</span> STUDIO
        </h1>

        {/* Dynamic Tagline */}
        <p className="font-headline text-2xl sm:text-4xl md:text-5xl tracking-widest text-brand-gold mt-4 uppercase">
          {tagline}
        </p>

        {/* Subtitle description */}
        <p className="font-sans text-sm sm:text-base md:text-lg text-brand-chrome/80 max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
          {subline}
        </p>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            onClick={onEnterStudio}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-electric via-cyan-400 to-brand-violet hover:brightness-110 text-black font-headline text-xl tracking-widest uppercase flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(40,107,255,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{language === 'sk' ? 'VSTÚPIŤ DO ŠTÚDIA' : 'ENTER THE STUDIO'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={onExploreCulture}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-brand-carbon/90 hover:bg-brand-concrete text-white border border-brand-concrete/80 font-accent text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2.5 transition shadow-lg"
          >
            <Mic className="w-4 h-4 text-brand-gold" />
            <span>{language === 'sk' ? 'OBJAVIŤ HIP-HOP KULTÚRU' : 'DISCOVER THE CULTURE'}</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-transparent hover:bg-brand-carbon/60 text-brand-steel hover:text-white border border-transparent hover:border-brand-steel/40 font-accent text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition"
          >
            <Play className="w-3.5 h-3.5 text-brand-electric fill-current" />
            <span>{language === 'sk' ? 'VIDEO NÁVOD' : 'VIDEO MASTERCLASS'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Equalizer Bar & 13OMI Endorsement */}
      <div className="relative z-10 border-t border-brand-concrete/40 bg-brand-carbon/60 backdrop-blur-md py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-accent text-brand-steel">
            <span className="flex items-center gap-1.5 text-brand-gold font-bold">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              13OMI ARTISTIC VISION
            </span>
            <span className="text-brand-concrete">|</span>
            <span>BRONX ROOTS × 808 TRAP × MODERN AI</span>
            <span className="text-brand-concrete hidden sm:inline">|</span>
            <span className="hidden sm:inline">24-BIT / 48 KHZ HIGH-DEFINITION SOUND</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-accent text-[11px] text-brand-steel uppercase tracking-widest">
              SOUND SIGNATURE:
            </span>
            <img
              src="/assets/branding/13omi-signature.svg"
              alt="13OMI"
              className="h-7 w-auto object-contain opacity-90 hover:opacity-100 transition"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

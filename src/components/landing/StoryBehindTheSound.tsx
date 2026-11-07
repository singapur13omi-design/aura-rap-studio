'use client';

import React from 'react';
import { BRAND_IDENTITY } from '@/lib/branding';
import { useI18n } from '@/lib/i18n';
import { Sparkles, Mic, Flame, Shield, Quote, Disc } from 'lucide-react';

export const StoryBehindTheSound: React.FC<{ onEnterStudio?: () => void }> = ({ onEnterStudio }) => {
  const { language } = useI18n();

  const story = BRAND_IDENTITY.story;
  const heading = language === 'sk' ? story.headingSk : story.headingEn;
  const subheading = language === 'sk' ? story.subheadingSk : story.subheadingEn;
  const belief = language === 'sk' ? story.beliefSk : story.beliefEn;
  const paragraphs = language === 'sk' ? story.manifestoParagraphsSk : story.manifestoParagraphsEn;

  return (
    <section id="the-story" className="relative py-28 bg-brand-carbon text-white select-none overflow-hidden border-b border-brand-concrete">
      {/* Ambient Glows */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-violet/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Pill */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-black border border-brand-gold/40 text-brand-gold text-xs font-accent font-bold tracking-[0.25em] uppercase mb-4 shadow-[0_0_15px_rgba(200,164,93,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THE STORY BEHIND THE SOUND</span>
          </div>

          <h2 className="font-headline text-5xl sm:text-7xl md:text-8xl tracking-tight text-white leading-none">
            {heading}
          </h2>

          <p className="font-headline text-2xl sm:text-3xl tracking-widest text-brand-gold mt-4 uppercase">
            {subheading}
          </p>

          <p className="font-sans text-sm sm:text-base text-brand-chrome/80 mt-2 italic max-w-xl mx-auto">
            &ldquo;{belief}&rdquo;
          </p>
        </div>

        {/* Editorial Layout: Portrait Canvas (Left 5) + Manifesto (Right 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Founder Portrait Canvas (Left) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-brand-black border-2 border-brand-concrete shadow-2xl flex flex-col justify-between p-8 group">
              {/* Background Street/Studio Mood Texture */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-carbon/60 via-brand-black to-brand-black" />
              
              {/* Concentric Vinyl Circles Backdrop */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <div className="w-80 h-80 rounded-full border border-brand-chrome/30" />
                <div className="w-64 h-64 rounded-full border border-brand-chrome/20" />
                <div className="w-48 h-48 rounded-full border border-brand-chrome/40" />
              </div>

              {/* Top Card Tag */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-brand-carbon/90 border border-brand-gold/50 text-brand-gold text-[10px] font-accent font-black tracking-widest uppercase">
                  FOUNDER & ARTISTIC VISION
                </span>
                <Disc className="w-6 h-6 text-brand-gold animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              {/* Center Portrait Area with 13OMI Metallic Seal */}
              <div className="relative z-10 my-auto text-center py-8">
                <img
                  src="/assets/signature/13omi-metallic-seal.svg"
                  alt="13OMI Seal"
                  className="w-36 h-36 mx-auto drop-shadow-[0_0_25px_rgba(200,164,93,0.35)] transform group-hover:scale-105 transition-transform duration-500"
                />

                <div className="mt-6">
                  <span className="font-headline text-5xl tracking-widest text-white block">
                    13OMI
                  </span>
                  <span className="font-accent text-xs tracking-[0.3em] text-brand-steel uppercase font-bold">
                    ARCHITECT & RAP PURIST
                  </span>
                </div>
              </div>

              {/* Bottom Signature Card Strip */}
              <div className="relative z-10 pt-4 border-t border-brand-concrete/60 flex items-center justify-between">
                <div>
                  <p className="font-accent text-[10px] text-brand-steel uppercase tracking-widest">
                    LOCATION
                  </p>
                  <p className="font-accent text-xs text-white font-bold">
                    SLOVAKIA × GLOBAL STREET
                  </p>
                </div>
                <img
                  src="/assets/branding/13omi-signature.svg"
                  alt="Signature"
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Artistic Manifesto (Right 7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-6 text-brand-chrome text-sm sm:text-base leading-relaxed font-sans font-normal">
              {paragraphs.map((p, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <span className="font-headline text-2xl text-brand-gold/60 shrink-0 select-none">
                    0{idx + 1}
                  </span>
                  <p>{p}</p>
                </div>
              ))}
            </div>

            {/* Core Values Strip */}
            <div className="pt-6 border-t border-brand-concrete grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-brand-black p-4 rounded-2xl border border-brand-concrete">
                <Mic className="w-5 h-5 text-brand-electric mb-2" />
                <h4 className="font-headline text-lg text-white tracking-wide">
                  {language === 'sk' ? 'AUTENTICKÝ HLAS' : 'AUTHENTIC VOICE'}
                </h4>
                <p className="font-sans text-[11px] text-brand-steel mt-0.5">
                  {language === 'sk' ? 'AI hlas nikdy nenahradí.' : 'AI never replaces the artist.'}
                </p>
              </div>

              <div className="bg-brand-black p-4 rounded-2xl border border-brand-concrete">
                <Flame className="w-5 h-5 text-brand-gold mb-2" />
                <h4 className="font-headline text-lg text-white tracking-wide">
                  {language === 'sk' ? 'STREET ART ODKAZ' : 'STREET ART ROOTS'}
                </h4>
                <p className="font-sans text-[11px] text-brand-steel mt-0.5">
                  {language === 'sk' ? 'Kultúra, rýmy a flow.' : 'Culture, cadence and flow.'}
                </p>
              </div>

              <div className="bg-brand-black p-4 rounded-2xl border border-brand-concrete col-span-2 sm:col-span-1">
                <Shield className="w-5 h-5 text-brand-violet mb-2" />
                <h4 className="font-headline text-lg text-white tracking-wide">
                  {language === 'sk' ? 'NEZÁVISLOSŤ' : 'INDEPENDENCE'}
                </h4>
                <p className="font-sans text-[11px] text-brand-steel mt-0.5">
                  {language === 'sk' ? 'Tvoja hudba, tvoje práva.' : 'Your music, your rights.'}
                </p>
              </div>
            </div>

            {/* Final Signature Quote */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-headline text-2xl tracking-widest text-brand-gold">
                  &ldquo;LEAVE YOUR MARK ON THE CONCRETE.&rdquo;
                </p>
                <p className="font-accent text-xs text-brand-steel tracking-wider uppercase mt-0.5">
                  — 13OMI, FOUNDER OF AURA RAP STUDIO
                </p>
              </div>

              {onEnterStudio && (
                <button
                  onClick={onEnterStudio}
                  className="hidden sm:inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 text-black font-headline text-base tracking-widest uppercase hover:brightness-110 shadow-lg shadow-brand-gold/20 transition shrink-0"
                >
                  {language === 'sk' ? 'VSTÚPIŤ DO BOOTHU' : 'ENTER THE BOOTH'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

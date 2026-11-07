'use client';

import React, { useState } from 'react';
import { BRAND_IDENTITY } from '@/lib/branding';
import { useI18n } from '@/lib/i18n';
import { Radio, Headphones, Flame, Paintbrush, ArrowUpRight } from 'lucide-react';

export const HipHopCultureSection: React.FC<{ onEnterStudio?: () => void }> = ({ onEnterStudio }) => {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('mcing');

  const pillars = BRAND_IDENTITY.culturePillars;

  return (
    <section id="hip-hop-culture" className="relative py-24 bg-brand-carbon text-white select-none overflow-hidden border-b border-brand-concrete">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-violet/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-electric/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-concrete/60 border border-brand-steel/30 text-brand-steel text-xs font-accent font-bold tracking-[0.25em] uppercase mb-4">
            <span>THE 4 ELEMENTS</span>
          </div>

          <h2 className="font-headline text-5xl sm:text-7xl tracking-wide text-white leading-none">
            BORN FROM <span className="text-aura-gradient">HIP-HOP</span> CULTURE
          </h2>

          <p className="font-sans text-sm sm:text-base text-brand-chrome/80 mt-4 max-w-xl mx-auto leading-relaxed">
            {language === 'sk'
              ? 'AURA RAP STUDIO nie je sterilný softvér. Je to pocta štyrom pôvodným pilierom ulice, ktoré definujú rap od Bronxu až po dnešný svet.'
              : 'AURA RAP STUDIO is not sterile software. It is a digital homage to the four foundational street elements that gave birth to hip-hop.'}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const quote = language === 'sk' ? pillar.quoteSk : pillar.quoteEn;
            const desc = language === 'sk' ? pillar.descSk : pillar.descEn;

            return (
              <div
                key={pillar.id}
                className="group relative bg-brand-black border border-brand-concrete rounded-3xl p-6 flex flex-col justify-between overflow-hidden hover:border-brand-steel/60 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(40,107,255,0.15)]"
              >
                {/* Visual Artwork Container */}
                <div>
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-brand-carbon border border-brand-concrete/60 mb-6 group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={pillar.image}
                      alt={pillar.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent opacity-80" />
                    
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-accent font-black tracking-widest uppercase border"
                      style={{
                        borderColor: `${pillar.accentColor}50`,
                        backgroundColor: '#08090C90',
                        color: pillar.accentColor,
                      }}
                    >
                      {pillar.subtitle}
                    </span>
                  </div>

                  {/* Title & Cultural Quote */}
                  <h3 className="font-headline text-3xl tracking-wide text-white group-hover:text-brand-chrome transition">
                    {pillar.title}
                  </h3>

                  <p className="font-headline text-lg text-brand-gold mt-1 tracking-wider uppercase">
                    &ldquo;{quote}&rdquo;
                  </p>

                  <p className="font-sans text-xs text-brand-steel mt-3 leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* Bottom Interactive CTA */}
                <div className="mt-6 pt-4 border-t border-brand-concrete/40 flex items-center justify-between">
                  <span className="font-accent text-[10px] text-brand-steel uppercase tracking-widest">
                    AURA CORE ENGINE
                  </span>
                  <div
                    className="w-8 h-8 rounded-full bg-brand-carbon border border-brand-concrete flex items-center justify-center text-brand-steel group-hover:text-white group-hover:border-brand-steel transition"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Culture Endorsement Banner */}
        <div className="mt-12 bg-gradient-to-r from-brand-black via-brand-carbon to-brand-black border border-brand-concrete/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <img
              src="/assets/signature/13omi-metallic-seal.svg"
              alt="13OMI Seal"
              className="w-16 h-16 shrink-0 drop-shadow-[0_0_15px_rgba(200,164,93,0.3)]"
            />
            <div>
              <h4 className="font-headline text-2xl tracking-wide text-white">
                {language === 'sk' ? 'REŠPEKT K PÔVODU. TECHNOLÓGIA PRE BUDÚCNOSŤ.' : 'ROOTED IN CULTURE. BUILT FOR THE FUTURE.'}
              </h4>
              <p className="font-sans text-xs text-brand-steel max-w-xl mt-1">
                {language === 'sk'
                  ? 'Žiadne lacné generické slučky. Štúdio je postavené tak, aby každý raper zachoval svoj originálny hlas a ľudský flow.'
                  : 'No disposable AI toys. This studio is engineered to preserve your raw human cadence and authentic storytelling.'}
              </p>
            </div>
          </div>

          {onEnterStudio && (
            <button
              onClick={onEnterStudio}
              className="px-6 py-3.5 rounded-xl bg-brand-electric hover:brightness-110 text-black font-headline text-lg tracking-widest uppercase shrink-0 transition shadow-lg shadow-brand-electric/25"
            >
              {language === 'sk' ? 'ZAČAŤ TVORIŤ' : 'START CREATING'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

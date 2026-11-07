'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Mic, ArrowUp } from 'lucide-react';

export const LandingFooter: React.FC<{
  onEnterStudio: () => void;
  onScrollToTop?: () => void;
}> = ({ onEnterStudio, onScrollToTop }) => {
  const { language, setLanguage } = useI18n();

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-brand-black text-white border-t border-brand-concrete/80 py-16 px-4 sm:px-6 select-none relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-brand-concrete">
          {/* Col 1: Brand & Signature (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/aura-symbol.svg"
                alt="AURA"
                className="w-10 h-10"
              />
              <span className="font-headline text-3xl tracking-widest text-white">
                AURA RAP STUDIO
              </span>
            </div>

            <p className="font-headline text-xl tracking-wider text-brand-gold uppercase">
              {language === 'sk' ? 'TVOJ HLAS. TVOJ FLOW. TVOJ ZVUK.' : 'YOUR VOICE. YOUR FLOW. YOUR SOUND.'}
            </p>

            <p className="font-sans text-xs text-brand-steel max-w-sm leading-relaxed">
              {language === 'sk'
                ? 'Profesionálne digitálne rapové štúdio spájajúce hip-hopovú kultúru, vinylový sound a modernú umelú inteligenciu. Bez kompromisov.'
                : 'Next-gen digital hip-hop workstation fusing underground street culture, vinyl warmth, and cutting-edge audio AI. No compromise.'}
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="font-accent text-xs text-brand-steel uppercase tracking-widest">
                {language === 'sk' ? 'AUTORSKÝ PODPIS:' : 'VISION BY:'}
              </span>
              <img
                src="/assets/branding/13omi-signature.svg"
                alt="13OMI"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          {/* Col 2: Studio Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-3 font-accent text-xs">
            <h4 className="font-headline text-lg tracking-widest text-white uppercase mb-4">
              {language === 'sk' ? 'ŠTÚDIO & ENGINE' : 'STUDIO & ENGINE'}
            </h4>
            <ul className="space-y-2.5 text-brand-steel">
              <li>
                <button
                  onClick={onEnterStudio}
                  className="hover:text-brand-electric transition flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-electric" />
                  <span>{language === 'sk' ? 'Spustiť nahrávanie (DAW)' : 'Launch Studio DAW'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('hip-hop-culture')}
                  className="hover:text-white transition"
                >
                  {language === 'sk' ? '4 Piliere Hip-Hopu' : '4 Pillars of Hip-Hop'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('the-story')}
                  className="hover:text-white transition"
                >
                  {language === 'sk' ? 'Príbeh 13OMI' : 'The 13OMI Story'}
                </button>
              </li>
              <li>
                <button
                  onClick={onEnterStudio}
                  className="hover:text-white transition"
                >
                  {language === 'sk' ? 'AI Beat Generátor' : 'AI Beat Generator'}
                </button>
              </li>
              <li>
                <button
                  onClick={onEnterStudio}
                  className="hover:text-white transition"
                >
                  {language === 'sk' ? 'Auto-Tune Pro Rack' : 'Auto-Tune Pro Rack'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Language & Legal (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-headline text-lg tracking-widest text-white uppercase">
              {language === 'sk' ? 'JAZYK & PRÁVA' : 'LANGUAGE & LEGAL'}
            </h4>

            {/* Language Switcher */}
            <div className="inline-flex items-center bg-brand-carbon border border-brand-concrete rounded-xl p-1">
              <button
                onClick={() => setLanguage('sk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-accent font-bold transition flex items-center gap-1.5 ${
                  language === 'sk'
                    ? 'bg-brand-electric text-black shadow-glow'
                    : 'text-brand-steel hover:text-white'
                }`}
              >
                <span>🇸🇰</span>
                <span>SLOVENČINA</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-accent font-bold transition flex items-center gap-1.5 ${
                  language === 'en'
                    ? 'bg-brand-electric text-black shadow-glow'
                    : 'text-brand-steel hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span>ENGLISH</span>
              </button>
            </div>

            <p className="font-accent text-[11px] text-brand-steel leading-relaxed">
              {language === 'sk'
                ? 'Všetky práva na vytvorené vokály a skladby patria výhradne umelcovi. Všetky beaty v knižnici sú 100% royalty-free.'
                : 'All rights to recorded vocal stems belong entirely to the artist. All beats include full royalty-free commercial clearance.'}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-accent text-brand-steel">
          <div>
            <span>© {new Date().getFullYear()} AURA RAP STUDIO. ALL RIGHTS RESERVED.</span>
            <span className="text-brand-concrete mx-2">•</span>
            <span className="text-brand-gold font-bold">CREATED WITH VISION BY 13OMI.</span>
          </div>

          <button
            onClick={() => {
              if (onScrollToTop) {
                onScrollToTop();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            <span>{language === 'sk' ? 'HORE' : 'BACK TO TOP'}</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

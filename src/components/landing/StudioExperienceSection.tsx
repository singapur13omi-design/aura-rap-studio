'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  Mic,
  Sliders,
  Sparkles,
  Layers,
  Music,
  Check,
  Play,
  Volume2,
  HardDrive,
  Cpu,
  ArrowRight,
} from 'lucide-react';

export const StudioExperienceSection: React.FC<{ onEnterStudio: () => void }> = ({ onEnterStudio }) => {
  const { language } = useI18n();
  const [activeFeature, setActiveFeature] = useState<number>(0);

  const features = [
    {
      id: 'timeline',
      titleSk: 'Viacstopová Časová Os (DAW)',
      titleEn: 'Multitrack Timeline (DAW)',
      tagSk: 'PROFESIONÁLNE VRSTVENIE',
      tagEn: 'PRO MULTITRACK LAYERS',
      descSk: 'Nahrávaj samostatne Lead Vocal, Double Vocal, Hype Ad-libs aj backingy. Každá stopa má vlastný volume fader, stereo panovanie, mute a solo.',
      descEn: 'Record Lead Vocals, Doubles, Hype Ad-libs, and Chorus stems independently. Each track features independent gain staging, stereo pan, mute, and soloing.',
      icon: Layers,
      color: '#00E5FF',
    },
    {
      id: 'autotune',
      titleSk: 'Real-Time Auto-Tune & Pitch FX',
      titleEn: 'Real-Time Auto-Tune & Pitch FX',
      tagSk: 'LADIČKA TÓNINY',
      tagEn: 'PITCH QUANTIZATION',
      descSk: 'Automatické kvantovanie tónov do stupnice tracku (C Minor, D Minor, Trap Scales). Od jemného moderného lesku až po agresívny Travis Scott robotický hard-tune.',
      descEn: 'Instant note quantization locking off-pitch tones to your scale. From subtle studio transparent smoothing to hard Travis Scott robotic glide tuning.',
      icon: Sliders,
      color: '#A24EFF',
    },
    {
      id: 'beats',
      titleSk: '808 Beat Engine & Knižnica',
      titleEn: '808 Beat Engine & Beat Library',
      tagSk: 'PROCEDURÁLNA SYNTÉZA',
      tagEn: 'SYNTHESIZED 808 SLAMS',
      descSk: 'Okamžité generovanie trapových sub-basov, UK drill glidov a boom-bap bicích priamo cez Web Audio syntetizátor. Autorsky 100% voľná komerčná licencia.',
      descEn: 'Synthesize custom 808 kicks, crisp hi-hat rolls, and punchy snares via in-browser DSP. 100% royalty-free commercial license included.',
      icon: Music,
      color: '#286BFF',
    },
    {
      id: 'mastering',
      titleSk: 'AI Mastering & LUFS Metering',
      titleEn: 'AI Mastering & LUFS Metering',
      tagSk: 'SPOTIFY READY SOUND',
      tagEn: 'STREAMING READY',
      descSk: 'Presné cielenie hlasitosti podľa štandardu ITU-R BS.1770 (-14 LUFS pre Spotify, -9 LUFS pre kluby). Export do 24-bit / 48 kHz WAV s plnými multitrack stems.',
      descEn: 'ITU-R BS.1770 true loudness compliance targeting -14 LUFS for Spotify and -9 LUFS for clubs. Export finished 24-bit/48kHz masters plus isolated stems.',
      icon: Sparkles,
      color: '#C8A45D',
    },
  ];

  return (
    <section className="relative py-24 bg-brand-black text-white select-none overflow-hidden border-b border-brand-concrete">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-carbon border border-brand-electric/30 text-brand-electric text-xs font-accent font-bold tracking-[0.25em] uppercase mb-4">
              <span>WORKSTATION CAPABILITIES</span>
            </div>
            <h2 className="font-headline text-5xl sm:text-7xl tracking-wide text-white leading-none">
              BUILT LIKE A <span className="text-aura-gradient">WORLD-CLASS</span> FACILITY
            </h2>
          </div>

          <button
            onClick={onEnterStudio}
            className="self-start md:self-end px-7 py-3.5 rounded-2xl bg-brand-electric hover:brightness-110 text-black font-headline text-lg tracking-widest uppercase flex items-center gap-2.5 transition shadow-lg shadow-brand-electric/25 shrink-0"
          >
            <span>{language === 'sk' ? 'OTVORIŤ ŠTÚDIO' : 'LAUNCH WORKSTATION'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Interactive Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Feature Selector Tabs (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {features.map((feat, idx) => {
              const isActive = activeFeature === idx;
              const Icon = feat.icon;
              const title = language === 'sk' ? feat.titleSk : feat.titleEn;
              const tag = language === 'sk' ? feat.tagSk : feat.tagEn;
              const desc = language === 'sk' ? feat.descSk : feat.descEn;

              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveFeature(idx)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-carbon border-brand-electric/60 shadow-[0_0_25px_rgba(40,107,255,0.2)] translate-x-2'
                      : 'bg-brand-carbon/40 border-brand-concrete hover:border-brand-steel/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-accent font-black tracking-widest uppercase px-2 py-0.5 rounded"
                      style={{
                        color: feat.color,
                        backgroundColor: `${feat.color}15`,
                      }}
                    >
                      {tag}
                    </span>
                    <Icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>

                  <h3 className="font-headline text-2xl tracking-wide text-white">
                    {title}
                  </h3>

                  <p className="font-sans text-xs text-brand-steel mt-2 leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive DAW Mockup Preview (Right 7 cols) */}
          <div className="lg:col-span-7 bg-brand-carbon border-2 border-brand-concrete rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-violet/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Mock DAW Top Bar */}
            <div className="flex items-center justify-between border-b border-brand-concrete pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-brand-electric animate-pulse" />
                <span className="font-headline text-lg tracking-widest text-white">
                  AURA RAP STUDIO — DEMONIC TRAP FREESTYLE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-brand-black text-[10px] font-mono text-brand-gold border border-brand-gold/40 font-bold">
                  140 BPM
                </span>
                <span className="px-2 py-0.5 rounded bg-brand-black text-[10px] font-mono text-brand-electric border border-brand-electric/40 font-bold">
                  C MINOR
                </span>
              </div>
            </div>

            {/* Mock Audio Tracks Stack */}
            <div className="space-y-3 font-mono text-xs">
              {/* Track 1: Lead Vocal */}
              <div className="bg-brand-black border border-brand-electric/40 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-electric" />
                  <span className="font-bold text-white text-xs">MAIN VOCAL</span>
                </div>
                {/* Waveform graphic */}
                <div className="flex-1 h-8 bg-brand-carbon/60 rounded flex items-center justify-around px-2 overflow-hidden">
                  {[40, 70, 95, 30, 80, 60, 100, 45, 90, 75, 30, 85, 60, 40].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-brand-electric rounded-full transition-all"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-brand-electric/20 text-brand-electric font-bold">
                    AUTO-TUNE ON
                  </span>
                </div>
              </div>

              {/* Track 2: Double Vocal */}
              <div className="bg-brand-black border border-brand-violet/40 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-violet" />
                  <span className="font-bold text-white text-xs">DOUBLE VOCAL</span>
                </div>
                <div className="flex-1 h-8 bg-brand-carbon/60 rounded flex items-center justify-around px-2 overflow-hidden">
                  {[20, 50, 80, 40, 70, 50, 85, 35, 75, 60, 20, 70, 40, 30].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-brand-violet rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-brand-carbon text-brand-steel">
                    PAN L-20
                  </span>
                </div>
              </div>

              {/* Track 3: Ad-Libs */}
              <div className="bg-brand-black border border-brand-gold/40 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-gold" />
                  <span className="font-bold text-white text-xs">HYPE AD-LIBS</span>
                </div>
                <div className="flex-1 h-8 bg-brand-carbon/60 rounded flex items-center justify-around px-2 overflow-hidden">
                  {[10, 0, 0, 90, 85, 0, 0, 95, 100, 0, 0, 70, 80, 0].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-brand-gold rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-brand-carbon text-brand-steel">
                    PAN R+30
                  </span>
                </div>
              </div>

              {/* Track 4: 808 Trap Beat */}
              <div className="bg-brand-black border border-brand-steel/30 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-bold text-white text-xs">808 TRAP BEAT</span>
                </div>
                <div className="flex-1 h-8 bg-brand-carbon/60 rounded flex items-center justify-around px-2 overflow-hidden">
                  {[90, 30, 60, 40, 95, 30, 60, 40, 90, 30, 60, 40, 100, 40].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-red-400 rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-brand-carbon text-brand-steel">
                    MASTER 0.0dB
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status Info */}
            <div className="mt-6 pt-4 border-t border-brand-concrete flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-steel font-accent">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {language === 'sk' ? 'Ultra-nízka latencia (AudioWorklet engine)' : 'Ultra-low latency Web AudioWorklet engine'}
              </span>
              <button
                onClick={onEnterStudio}
                className="text-brand-electric hover:underline flex items-center gap-1 font-bold"
              >
                <span>{language === 'sk' ? 'Vyskúšať nahrávanie zadarmo' : 'Try recording for free'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

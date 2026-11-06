'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  Mic,
  Headphones,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  Layers,
  Flame,
  Radio,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StudioMasterclassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording?: () => void;
}

export const StudioMasterclassModal: React.FC<StudioMasterclassModalProps> = ({
  isOpen,
  onClose,
  onStartRecording,
}) => {
  const { language } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      step: '01',
      titleSk: 'KROK 1: Vyber si Beat a Štýl',
      titleEn: 'STEP 1: Choose Your Beat & Style',
      subtitleSk: 'Základom každého dobrého rapu je rytmus a tempo.',
      subtitleEn: 'Every great rap track starts with the right tempo and pulse.',
      icon: Radio,
      color: 'from-cyan-500 to-blue-600',
      badgeColor: 'border-cyan-400/40 text-cyan-300 bg-cyan-950/40',
      tipsSk: [
        'V sekcii Knižnica beatov si vyber trapový 808 podklad, UK drill alebo klasický boom-bap.',
        'Alebo použi AI Beat Generátor, ktorý ti automaticky vygeneruje originálny beat na mieru.',
        'Štúdio automaticky nastaví tempo (BPM) a tóninu (Scale) pre tvoj vokál.',
      ],
      tipsEn: [
        'In the Beat Library, select a heavy 808 trap beat, UK drill glide, or vintage boom-bap.',
        'Or use the AI Beat Generator to synthesize a brand new custom beat instantly.',
        'The studio automatically locks the BPM and musical key for perfect vocal alignment.',
      ],
      visualType: 'beat',
    },
    {
      step: '02',
      titleSk: 'KROK 2: Vstúp do Vokálnej Búdky',
      titleEn: 'STEP 2: Enter the Vocal Booth',
      subtitleSk: 'Správne nastavenie mikrofónu rozhoduje o čistote nahrávky.',
      subtitleEn: 'Proper microphone configuration ensures a clean, studio-grade capture.',
      icon: Headphones,
      color: 'from-amber-400 to-orange-500',
      badgeColor: 'border-amber-400/40 text-amber-300 bg-amber-950/40',
      tipsSk: [
        'Vždy používaj SLÚCHADLÁ – beat ti nesmie unikať z reproduktorov späť do mikrofónu!',
        'Udržuj vzdialenosť približne 15 cm od mikrofónu pre plný a vyrovnaný hlas.',
        'Sleduj VU meter: Hlasitosť by mala byť v zelenej/žltej zóne (-12 dB až -6 dB), nikdy nie v červenej!',
      ],
      tipsEn: [
        'Always wear HEADPHONES – ensure the beat does not bleed into your microphone!',
        'Keep a consistent distance of about 15 cm from your mic for a balanced low-end proximity effect.',
        'Watch the VU meter: Keep peaks in the green/yellow zone (-12 dB to -6 dB), never clip into the red!',
      ],
      visualType: 'booth',
    },
    {
      step: '03',
      titleSk: 'KROK 3: Nahraj Hlavnú Slohu (Lead Vocal)',
      titleEn: 'STEP 3: Record Your Lead Vocal Flow',
      subtitleSk: 'Stlač nahrávanie a choď do svojho flowu.',
      subtitleEn: 'Hit record and deliver your flow with high energy and cadence.',
      icon: Mic,
      color: 'from-red-500 to-pink-600',
      badgeColor: 'border-red-400/40 text-red-300 bg-red-950/40',
      tipsSk: [
        'Rýchla klávesová skratka: Stlač klávesu [R] a otvorí sa nahrávacie okno.',
        'Stlač [MEDZERNÍK] na spustenie prehrávania alebo nahrávania.',
        'Ak sa ti pokus nepodarí, jednoducho klikni "Nahrať znova" – štúdio nahráva nedestruktívne.',
      ],
      tipsEn: [
        'Keyboard shortcut: Press [R] anywhere in the studio to pop open the recording booth.',
        'Press [SPACEBAR] to instantly play, pause, or record.',
        'If you miss a bar, hit "Re-record" – our engine is completely non-destructive.',
      ],
      visualType: 'lead',
    },
    {
      step: '04',
      titleSk: 'KROK 4: Navrstvi Hype & Ad-libs',
      titleEn: 'STEP 4: Layer Doubles & Ad-Libs',
      subtitleSk: 'Tajomstvo moderného rapového zvuku je vo vrstvách.',
      subtitleEn: 'The secret sauce of modern trap is stereo layering.',
      icon: Layers,
      color: 'from-purple-500 to-indigo-600',
      badgeColor: 'border-purple-400/40 text-purple-300 bg-purple-950/40',
      tipsSk: [
        'Double Vocal (Stopa 2): Nahraj tú istú slohu ešte raz na zvýraznenie refrénu a rýmov.',
        'Ad-Libs (Stopa 3): Nahraj výkriky, hype zvuky a echá (Yeah, Skrrt, Let’s go!).',
        'V sekcii Mixáž ich roztiahni do sterea (Pan -30% vľavo a +30% vpravo) pre masívny priestor.',
      ],
      tipsEn: [
        'Double Vocal (Track 2): Re-record the same verses to thicken up the chorus and end-rhymes.',
        'Ad-Libs (Track 3): Add backing hype phrases, shouts, and accents (Yeah, Skrrt, Hey!).',
        'Pan your ad-libs left and right in the Mixing studio for that wide commercial depth.',
      ],
      visualType: 'layers',
    },
    {
      step: '05',
      titleSk: 'KROK 5: Auto-Tune, AI Mix & Master',
      titleEn: 'STEP 5: Auto-Tune, AI Mix & Master',
      subtitleSk: 'Z nahrávky spravíme finálny rádiový hit za pár sekúnd.',
      subtitleEn: 'Transform raw vocal cuts into polished streaming masters in seconds.',
      icon: Sparkles,
      color: 'from-emerald-400 to-cyan-500',
      badgeColor: 'border-emerald-400/40 text-emerald-300 bg-emerald-950/40',
      tipsSk: [
        'V sekcii Auto-Tune Rack zapni automatickú korekciu tóniny (od jemnej korekcie až po Travis Scott hard-tune efekt).',
        'AI Mixing Assistant automaticky odstráni dunenie (High-pass 85Hz) a dodá moderný kompresor a reverb.',
        'V sekcii AI Mastering zvoľ cieľ Spotify (-14 LUFS) a stiahni hotový WAV súbor pripravený na vydanie!',
      ],
      tipsEn: [
        'In the Auto-Tune Rack, turn on pitch correction (from subtle polish to classic hard Travis Scott tune).',
        'The AI Mixing Assistant cleans mud (85Hz cut), balances lead vocals, and glues the 808.',
        'In AI Mastering, select Spotify (-14 LUFS) or Club (-9 LUFS) and download your 24-bit master WAV!',
      ],
      visualType: 'master',
    },
  ];

  const current = slides[currentStep];
  const StepIcon = current.icon;
  const tips = language === 'sk' ? current.tipsSk : current.tipsEn;
  const title = language === 'sk' ? current.titleSk : current.titleEn;
  const subtitle = language === 'sk' ? current.subtitleSk : current.subtitleEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden flex flex-col justify-between">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Masterclass Badge & Progress Indicator */}
        <div>
          <div className="flex items-center justify-between mb-4 pr-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
              <Play className="w-3 h-3 fill-current" />
              <span>{language === 'sk' ? 'AURA RAP MASTERCLASS' : 'AURA STUDIO MASTERCLASS'}</span>
            </div>

            {/* Step Pills */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-7 bg-primary'
                      : idx < currentStep
                      ? 'w-2 bg-zinc-600'
                      : 'w-2 bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Title & Badge */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${current.color} p-0.5 shadow-lg shrink-0 flex items-center justify-center`}
            >
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${current.badgeColor}`}>
                  {current.step} / 05
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {title}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Visual Showcase Box */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-inner">
          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>

          {/* Mini Interactive Preview Bar */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {language === 'sk' ? 'Live DSP Engine: 24-bit / 48 kHz' : 'Live DSP Engine: 24-bit / 48 kHz'}
            </span>
            <span>{language === 'sk' ? 'Nedestruktívne nahrávanie' : 'Non-destructive recording'}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'sk' ? 'Späť' : 'Previous'}</span>
            </span>
          </button>

          {currentStep < slides.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(slides.length - 1, prev + 1))}
              className="px-6 py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 hover:brightness-110 shadow-lg shadow-primary/20 transition active:scale-95"
            >
              <span>{language === 'sk' ? 'Ďalší krok' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onStartRecording) onStartRecording();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-aura-gold to-amber-500 text-black font-black text-xs tracking-wider uppercase flex items-center gap-2 hover:brightness-110 shadow-lg shadow-aura-gold/30 transition active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>{language === 'sk' ? 'ZAČAŤ NAHRÁVAŤ TERAZ' : 'START RECORDING NOW'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

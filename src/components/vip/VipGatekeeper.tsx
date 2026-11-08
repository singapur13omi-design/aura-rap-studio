'use client';

import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  Mic,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Headphones,
  Music2,
  Crown,
  Trophy,
  Zap,
} from 'lucide-react';
import { activateVipToken, activate30DayFreeTrial } from '@/lib/vipAccess';
import { useI18n } from '@/lib/i18n';

interface VipGatekeeperProps {
  onUnlock: () => void;
  onBackToLanding?: () => void;
  initialErrorCode?: string | null;
}

export const VipGatekeeper: React.FC<VipGatekeeperProps> = ({
  onUnlock,
  onBackToLanding,
  initialErrorCode,
}) => {
  const { language, setLanguage } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(initialErrorCode || null);
  const [loading, setLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const isSk = language === 'sk';

  const handleInstantTrial = () => {
    activate30DayFreeTrial();
    onUnlock();
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    const res = activateVipToken(code.trim());
    if (res.success) {
      onUnlock();
    } else {
      setError(
        isSk
          ? 'Tento VIP alebo súťažný kód je neplatný. Skontroluj kód od 13OMI.'
          : 'Invalid VIP or contest code. Please verify your code from 13OMI.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-electric/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Language Switcher in corner */}
      <div className="absolute top-6 right-6 flex items-center bg-brand-carbon border border-brand-concrete rounded-xl p-1 z-20">
        <button
          onClick={() => setLanguage('sk')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            language === 'sk' ? 'bg-brand-electric text-black shadow-glow' : 'text-brand-steel hover:text-white'
          }`}
        >
          <span>🇸🇰</span>
          <span>SK</span>
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            language === 'en' ? 'bg-brand-electric text-black shadow-glow' : 'text-brand-steel hover:text-white'
          }`}
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>
      </div>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-lg bg-brand-carbon/95 border border-brand-concrete rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center z-10">
        {/* Glowing Studio Logo Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-electric/30 to-brand-gold/30 border border-brand-gold/40 text-brand-gold mb-6 shadow-[0_0_30px_rgba(200,164,93,0.25)]">
          <Mic className="w-8 h-8 text-brand-gold animate-pulse" />
        </div>

        {/* 30 Days Free Trial Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-electric/15 border border-brand-electric/40 text-brand-electric text-[11px] font-extrabold uppercase tracking-widest mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>{isSk ? '1 MESIAC ZADARMO PRE KAŽDÉHO' : '1 MONTH FREE FOR EVERYONE'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight text-white mb-2">
          AURA RAP STUDIO
        </h1>
        <p className="text-xs sm:text-sm text-brand-steel max-w-md mx-auto mb-8 leading-relaxed font-sans">
          {isSk
            ? 'Digitálne hip-hopové štúdio. Spusť si svojich 30 dní zadarmo od dnešného dňa bez nutnosti zadávať platobnú kartu.'
            : 'Next-gen digital rap workstation. Launch your 30 days free access starting today with no credit card required.'}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action: Instant 30-Day Free Trial Launch */}
        <div className="space-y-4">
          <button
            onClick={handleInstantTrial}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-electric via-cyan-400 to-brand-violet hover:brightness-110 text-black font-headline text-lg tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(40,107,255,0.4)] transition active:scale-[0.99]"
          >
            <span>{isSk ? 'SPUSTIŤ 30 DNÍ ZADARMO' : 'LAUNCH 30 DAYS FREE'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Toggle Súťažný / VIP kód */}
          {!showCodeInput ? (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="text-xs font-accent text-brand-gold hover:underline transition flex items-center justify-center gap-1.5 mx-auto"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{isSk ? 'Máš VIP kód alebo kód výhercu súťaže?' : 'Have a VIP or Contest Winner code?'}</span>
            </button>
          ) : (
            <form onSubmit={handleSubmitCode} className="space-y-3 pt-2 text-left animate-fade-in">
              <label className="text-[11px] font-accent text-brand-steel uppercase tracking-wider block">
                {isSk ? 'VIP / Súťažný kód (alebo Owner pass):' : 'VIP / Contest Winner Code:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="AURA-..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-brand-black border border-brand-concrete rounded-xl px-4 py-2.5 text-center font-mono text-sm text-white tracking-widest placeholder-brand-steel/60 focus:outline-none focus:border-brand-gold uppercase"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-brand-gold text-black font-headline text-sm tracking-wider uppercase hover:brightness-110"
                >
                  {isSk ? 'ODOMKNÚŤ' : 'UNLOCK'}
                </button>
              </div>
            </form>
          )}

          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="w-full py-2 text-xs font-accent text-brand-steel hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <span>← {isSk ? 'Späť na prezentáciu, súťaž a príbeh 13OMI' : 'Back to Presentation, Contest & 13OMI Story'}</span>
            </button>
          )}
        </div>

        {/* Feature Pills */}
        <div className="mt-8 pt-6 border-t border-brand-concrete/60 grid grid-cols-3 gap-2 text-center">
          <div className="bg-brand-black/60 p-2.5 rounded-xl border border-brand-concrete">
            <Headphones className="w-4 h-4 text-brand-electric mx-auto mb-1" />
            <span className="text-[10px] text-brand-steel font-bold block">Auto-Tune PRO</span>
          </div>
          <div className="bg-brand-black/60 p-2.5 rounded-xl border border-brand-concrete">
            <Music2 className="w-4 h-4 text-brand-gold mx-auto mb-1" />
            <span className="text-[10px] text-brand-steel font-bold block">808 Beat Engine</span>
          </div>
          <div className="bg-brand-black/60 p-2.5 rounded-xl border border-brand-concrete">
            <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] text-brand-steel font-bold block">WAV 24-bit Master</span>
          </div>
        </div>

        <p className="text-[11px] text-brand-steel/80 mt-6 flex items-center justify-center gap-1.5 font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isSk ? 'Všetky nahrávky sú súkromné a 100% tvoje' : 'All recordings are private and 100% yours'}</span>
        </p>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Lock, Sparkles, Mic, ArrowRight, ShieldCheck, AlertCircle, Headphones, Music2 } from 'lucide-react';
import { activateVipToken } from '@/lib/vipAccess';
import { useI18n } from '@/lib/i18n';

interface VipGatekeeperProps {
  onUnlock: () => void;
  initialErrorCode?: string | null;
}

export const VipGatekeeper: React.FC<VipGatekeeperProps> = ({ onUnlock, initialErrorCode }) => {
  const { language, setLanguage } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(initialErrorCode || null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    const res = activateVipToken(code.trim());
    if (res.success) {
      onUnlock();
    } else {
      setError(
        language === 'sk'
          ? 'Tento VIP kód je neplatný alebo vypršal. Skontroluj kód od producenta.'
          : 'Invalid or expired VIP invite code. Please check your invitation.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Language Switcher in corner */}
      <div className="absolute top-6 right-6 flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 z-20">
        <button
          onClick={() => setLanguage('sk')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            language === 'sk' ? 'bg-primary text-black shadow-glow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🇸🇰</span>
          <span>SK</span>
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            language === 'en' ? 'bg-primary text-black shadow-glow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>
      </div>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-lg bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center z-10">
        {/* Glowing Studio Logo Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-600/30 border border-primary/40 text-primary mb-6 shadow-[0_0_30px_rgba(0,229,255,0.25)]">
          <Mic className="w-8 h-8 text-primary animate-pulse" />
        </div>

        {/* Private Access Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-widest mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>{language === 'sk' ? 'PRÍSTUP LEN NA VIP POZVÁNKU' : 'PRIVATE VIP BETA ACCESS'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          AURA RAP STUDIO
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
          {language === 'sk'
            ? 'Digitálne nahrávacie štúdio pre trap, hip-hop a drill. Momentálne v uzatvorenej beta fáze pre vybraných umelcov.'
            : 'Next-gen digital rap workstation for Trap, Drill and Melodic Hip-Hop. Currently in private beta for selected artists.'}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              placeholder={language === 'sk' ? 'Zadaj VIP kód (napr. AURA-VIP-...)' : 'Enter VIP invite code...'}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl px-5 py-4 text-center font-mono font-black text-base text-white tracking-widest placeholder-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary via-cyan-300 to-purple-500 hover:brightness-110 text-black font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition active:scale-[0.99] disabled:opacity-50"
          >
            <span>{language === 'sk' ? 'ODOMKNÚŤ ŠTÚDIO (14 DNÍ ZDARMA)' : 'UNLOCK STUDIO (14 DAYS FREE)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Feature Pills */}
        <div className="mt-8 pt-6 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
            <Headphones className="w-4 h-4 text-primary mx-auto mb-1" />
            <span className="text-[10px] text-zinc-400 font-bold block">Auto-Tune PRO</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
            <Music2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] text-zinc-400 font-bold block">808 Beat Engine</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
            <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] text-zinc-400 font-bold block">WAV 24-bit Master</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{language === 'sk' ? 'Všetky nahrávky sú súkromné a šifrované' : 'All recordings are private and encrypted'}</span>
        </p>
      </div>
    </div>
  );
};

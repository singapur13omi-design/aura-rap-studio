'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Play,
  Pause,
  Square,
  Circle,
  Volume2,
  Clock,
  Sparkles,
  Save,
  Globe,
  User as UserIcon,
  LogIn,
  LogOut,
  Crown,
  Zap,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { formatTime, formatBarsBeats } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface StudioHeaderProps {
  projectTitle: string;
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  keyScale: string;
  masterVolume: number;
  metronomeOn: boolean;
  masterPeakDb: number;
  isSaving: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecordClick: () => void;
  onBpmChange: (bpm: number) => void;
  onKeyScaleChange: (keyScale: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMetronome: () => void;
  onToggleAiAssistant: () => void;
  onSaveProject: () => void;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  projectTitle,
  isPlaying,
  currentTime,
  bpm,
  keyScale,
  masterVolume,
  metronomeOn,
  masterPeakDb,
  isSaving,
  onPlay,
  onPause,
  onStop,
  onRecordClick,
  onBpmChange,
  onKeyScaleChange,
  onMasterVolumeChange,
  onToggleMetronome,
  onToggleAiAssistant,
  onSaveProject,
  onOpenPricing,
  onOpenAuth,
}) => {
  const { data: session } = useSession();
  const { language, setLanguage, t } = useI18n();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const plan = (session?.user as any)?.plan || 'FREE';
  const isSubscribed = (session?.user as any)?.subscriptionStatus === 'ACTIVE';

  // Metronome visual pulse calculation
  const secondsPerBeat = 60 / bpm;
  const isBeatPulse = isPlaying && metronomeOn && (currentTime % secondsPerBeat) < 0.1;

  // VU meter percentage (-60dB to 0dB)
  const vuPercent = Math.max(0, Math.min(100, ((masterPeakDb + 60) / 60) * 100));
  const isClipping = masterPeakDb >= -0.3;

  return (
    <header className="h-16 bg-surface-200 border-b border-surface-50/20 px-3 md:px-4 flex items-center justify-between select-none z-30 relative">
      {/* Left: Project title & save indicator */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-aura-blue animate-pulse-glow" />
          <h1 className="font-bold text-white text-xs sm:text-sm md:text-base tracking-wide truncate max-w-[120px] sm:max-w-[180px] md:max-w-xs">
            {projectTitle}
          </h1>
        </div>

        <button
          onClick={onSaveProject}
          title={t.saveProject}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100 hover:bg-surface-50 text-xs text-gray-300 border border-surface-50/40 transition-colors"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-aura-blue border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 text-aura-blue" />
          )}
          <span className="hidden sm:inline">{isSaving ? t.saving : t.saved}</span>
        </button>
      </div>

      {/* Center: Main Transport & Counter Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Playback buttons */}
        <div className="flex items-center bg-surface-300 rounded-lg p-1 border border-surface-50/30 gap-1">
          <button
            onClick={onStop}
            title={t.stopRewind}
            className="p-1.5 rounded-md hover:bg-surface-100 text-gray-400 hover:text-white transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPause}
              title={t.pause}
              className="p-1.5 rounded-md bg-surface-50 text-aura-blue hover:brightness-110 transition-colors"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              title={t.play}
              className="p-1.5 rounded-md bg-aura-blue text-black hover:brightness-110 transition-colors shadow-glow"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={onRecordClick}
            title={t.recVocal}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-aura-red/20 hover:bg-aura-red/30 text-aura-red border border-aura-red/40 transition-colors"
          >
            <Circle className="w-3 h-3 fill-current animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider hidden md:inline">{t.recVocal}</span>
          </button>
        </div>

        {/* Time display: Bars/Beats & Minutes/Seconds */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-300 px-3 py-1.5 rounded-lg border border-surface-50/30 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-aura-blue" />
          <span className="text-white font-bold">{formatBarsBeats(currentTime, bpm)}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300">{formatTime(currentTime)}</span>
        </div>

        {/* Tempo (BPM) control */}
        <div className="flex items-center bg-surface-300 rounded-lg px-2.5 py-1 border border-surface-50/30 text-xs">
          <span className="text-gray-400 mr-1.5 font-bold">{t.bpm}</span>
          <input
            type="number"
            min="60"
            max="220"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value) || 140)}
            className="w-12 bg-transparent text-white font-mono font-bold focus:outline-none"
          />
        </div>

        {/* Key Scale Badge */}
        <div className="hidden lg:flex items-center bg-surface-300 rounded-lg px-2.5 py-1 border border-surface-50/30 text-xs text-gray-300">
          <span className="text-aura-purple font-semibold mr-1">KEY:</span>
          <span>{keyScale}</span>
        </div>

        {/* Metronome Toggle Button */}
        <button
          onClick={onToggleMetronome}
          title={t.click}
          className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all ${
            metronomeOn
              ? isBeatPulse
                ? 'bg-aura-gold text-black border-aura-gold shadow-glow'
                : 'bg-surface-50 text-aura-gold border-aura-gold/50'
              : 'bg-surface-300 text-gray-500 border-surface-50/30 hover:text-gray-300'
          }`}
        >
          {t.click}
        </button>
      </div>

      {/* Right: Language, Pricing/Upgrade, User Auth, Master Volume */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher Pill */}
        <div className="flex items-center bg-surface-300 p-0.5 rounded-lg border border-surface-50/30">
          <button
            onClick={() => setLanguage('sk')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              language === 'sk'
                ? 'bg-aura-blue text-black font-bold shadow-glow'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Prepnúť do slovenčiny"
          >
            <span>🇸🇰</span>
            <span className="text-[11px]">SK</span>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              language === 'en'
                ? 'bg-aura-blue text-black font-bold shadow-glow'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Switch to English"
          >
            <span>🇬🇧</span>
            <span className="text-[11px]">EN</span>
          </button>
        </div>

        {/* Upgrade / Pricing Button */}
        {plan !== 'STUDIO_PRO' && (
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-aura-gold/20 to-amber-500/30 hover:from-aura-gold/30 hover:to-amber-500/40 border border-aura-gold/60 text-aura-gold hover:text-white text-xs font-extrabold tracking-wide transition-all shadow-[0_0_12px_rgba(255,215,0,0.25)]"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">{t.upgradeToPro}</span>
          </button>
        )}

        {/* User Account / Auth Button */}
        {session ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-300 hover:bg-surface-100 border border-surface-50/40 text-xs text-white transition"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-[10px] font-bold text-black uppercase">
                {(session.user?.name || session.user?.email || 'U')[0]}
              </div>
              <span className="hidden md:inline font-semibold max-w-[100px] truncate">
                {session.user?.name || session.user?.email?.split('@')[0]}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                  plan === 'STUDIO_PRO'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : plan === 'PRO_ARTIST'
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {plan === 'STUDIO_PRO' ? 'STUDIO' : plan === 'PRO_ARTIST' ? 'PRO' : 'FREE'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                  <p className="text-xs font-bold text-white truncate">
                    {session.user?.name || 'Artist'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{session.user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    if (onOpenPricing) onOpenPricing();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>{t.pricing} / {t.manageBilling}</span>
                </button>

                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition"
          >
            <LogIn className="w-3.5 h-3.5 text-primary" />
            <span>{t.signIn}</span>
          </button>
        )}

        {/* Master Volume Knob / Fader & VU meter */}
        <div className="hidden 2xl:flex items-center gap-2 bg-surface-300 px-2.5 py-1 rounded-lg border border-surface-50/30">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1.5 accent-aura-blue bg-surface-50 rounded-lg cursor-pointer"
          />

          {/* Master VU Meter Bar */}
          <div className="w-14 h-2.5 bg-black/60 rounded overflow-hidden flex items-center p-0.5 border border-surface-50/30">
            <div
              className={`h-full rounded-sm transition-all duration-75 ${
                isClipping ? 'bg-aura-red' : vuPercent > 80 ? 'bg-aura-gold' : 'bg-aura-green'
              }`}
              style={{ width: `${vuPercent}%` }}
            />
          </div>
        </div>

        {/* AI Assistant Pill */}
        <button
          onClick={onToggleAiAssistant}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-aura-purple/30 to-aura-blue/20 hover:from-aura-purple/40 hover:to-aura-blue/30 border border-aura-purple/50 text-white text-xs font-medium transition-all shadow-glow-purple"
        >
          <Sparkles className="w-3.5 h-3.5 text-aura-blue animate-pulse" />
          <span className="hidden sm:inline">{t.aiProducer}</span>
        </button>
      </div>
    </header>
  );
};

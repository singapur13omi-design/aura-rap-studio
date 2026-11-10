'use client';

import React from 'react';
import {
  Clapperboard,
  Sparkles,
  Crown,
  Film,
  Zap,
  Sliders,
  Maximize2,
  Layers,
  Wand2,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  Music,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface VideoStudioLockedPresentationProps {
  isOwner?: boolean;
  onUnlockOrEnter: () => void;
  onOpenPricing?: () => void;
}

export const VideoStudioLockedPresentation: React.FC<VideoStudioLockedPresentationProps> = ({
  isOwner = false,
  onUnlockOrEnter,
  onOpenPricing,
}) => {
  const { language } = useI18n();
  const isSk = language === 'sk';

  return (
    <div className="flex-1 bg-[#08090C] text-[#C6CBD3] p-6 sm:p-10 overflow-y-auto selection:bg-[#713BFF] selection:text-white">
      {/* Background Cinematic Ambience */}
      <div className="max-w-6xl mx-auto space-y-12 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#286BFF]/10 via-[#713BFF]/15 to-[#C8A45D]/10 blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <div className="text-center space-y-4 pt-6 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111318] border border-[#C8A45D]/40 text-[#C8A45D] text-xs font-mono font-bold tracking-widest uppercase shadow-glow">
            <Crown className="w-3.5 h-3.5" />
            <span>{isOwner ? (isSk ? 'OWNER LIFETIME ACCESS' : 'OWNER LIFETIME ACCESS') : (isSk ? 'PRÉMIOVÝ FILMOVÝ MODUL' : 'PREMIUM CINEMATIC MODULE')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
            AURA <span className="bg-gradient-to-r from-[#286BFF] via-[#713BFF] to-[#C8A45D] bg-clip-text text-transparent">AI VIDEO STUDIO</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono tracking-widest text-[#C8A45D] uppercase font-bold">
            CREATE YOUR MUSIC VIDEO. YOUR VISION. YOUR SOUND.
          </p>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {isSk
              ? 'Prvé online filmové štúdio vyvinuté špeciálne pre rapovú a hip-hopovú kultúru. Premeň svoje skladby z AURA RAP STUDIO na profesionálne filmové videoklipy pomocou generatívnej AI, automatickej synchronizácie s beatom a multitrack editora.'
              : 'The first cinematic production suite engineered specifically for underground hip-hop culture. Transform your tracks from AURA RAP STUDIO into complete music videos with generative AI, beat sync, and multitrack editing.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isOwner ? (
              <button
                onClick={onUnlockOrEnter}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#C8A45D] to-[#713BFF] text-black font-extrabold text-sm shadow-glow flex items-center gap-2.5 hover:scale-105 transition-all"
              >
                <Clapperboard className="w-4 h-4 fill-current" />
                <span>{isSk ? 'VSTÚPIŤ DO VIDEO ŠTÚDIA (OWNER)' : 'ENTER VIDEO STUDIO (OWNER)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onUnlockOrEnter}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#286BFF] via-[#713BFF] to-[#C8A45D] text-white font-extrabold text-sm shadow-glow flex items-center gap-2.5 hover:opacity-95 hover:scale-105 transition-all"
              >
                <Clapperboard className="w-4 h-4 fill-current" />
                <span>{isSk ? 'AKTIVOVAŤ VIDEO STUDIO PRÍSTUP' : 'ACTIVATE VIDEO STUDIO ACCESS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <ShieldCheck className="w-4 h-4 text-[#286BFF]" />
              <span>{isSk ? 'Komerčná licencia na vygenerované klipy' : 'Full commercial license included'}</span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Feature 1 */}
          <div className="bg-[#111318] border border-[#24262C] p-6 rounded-2xl space-y-4 hover:border-[#286BFF]/60 transition-all shadow-xl group">
            <div className="w-12 h-12 rounded-xl bg-[#286BFF]/15 text-[#286BFF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isSk ? 'AI Music Video Generator' : 'AI Music Video Generator'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isSk
                ? 'Text-to-Video, Image-to-Video a Cinematic Scene generation. Generuj fotorealistické filmové zábery na základe slovenských a anglických promptov priamo pre jednotlivé sekvencie skladby.'
                : 'Text-to-Video, Image-to-Video, and Cinematic Scene generation. Generate photorealistic shots tailored to your lyrics and mood.'}
            </p>
            <div className="text-[11px] font-mono text-[#286BFF] font-bold flex items-center gap-1">
              <span>Runway Gen-3 • Luma Ray 2 • Kling 1.5</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#111318] border border-[#24262C] p-6 rounded-2xl space-y-4 hover:border-[#713BFF]/60 transition-all shadow-xl group">
            <div className="w-12 h-12 rounded-xl bg-[#713BFF]/15 text-[#713BFF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isSk ? 'Multitrack Video Editor' : 'Multitrack Video Editor'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isSk
                ? 'Profesionálna strihová časová os s viacerými video stopami, strihom, splitom klipov, prolínačkami, B-Roll vrstvami, textami piesne a animovanými titulkami.'
                : 'Full-featured timeline with multiple video tracks, clip splitting, transitions, B-Roll overlays, and synced lyric typography.'}
            </p>
            <div className="text-[11px] font-mono text-[#713BFF] font-bold flex items-center gap-1">
              <span>{isSk ? 'Plynulý Canvas preview v reálnom čase' : 'Real-time Canvas WebGL Preview'}</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#111318] border border-[#24262C] p-6 rounded-2xl space-y-4 hover:border-[#C8A45D]/60 transition-all shadow-xl group">
            <div className="w-12 h-12 rounded-xl bg-[#C8A45D]/15 text-[#C8A45D] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isSk ? 'AI Music Sync & Director' : 'AI Music Sync & Director'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isSk
                ? 'Inteligentná analýza BPM, rytmu a dropov 808 basy. AI Director navrhne kompletný scenár (Intro, Verse, Chorus, Outro) a magneticky prichytí strihy presne na beat.'
                : 'Beat detection and automatic drop snapping. AI Director crafts the entire storyboard and snaps cuts magnetically to bars and 808 kicks.'}
            </p>
            <div className="text-[11px] font-mono text-[#C8A45D] font-bold flex items-center gap-1">
              <span>{isSk ? 'Automatický strih na beat' : 'Magnetic Beat Grid Alignment'}</span>
            </div>
          </div>
        </div>

        {/* Cinematic Presets Showcase */}
        <div className="bg-[#111318] border border-[#24262C] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262C] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C8A45D]" />
                <span>{isSk ? '10 Filmových Rapových Presetov' : '10 Cinematic Rap Presets'}</span>
              </h3>
              <p className="text-xs text-gray-400">
                {isSk ? 'Pripravené farebné korekcie, prompty a svetelné atmosféry' : 'Pre-configured color grading, lighting setups, and camera moves'}
              </p>
            </div>
            <div className="text-xs font-mono text-[#C8A45D] font-bold">
              1080p • 4K • 16:9 • 9:16
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'DARK_TRAP', name: 'Dark Trap', desc: 'Neon blue/purple, deep shadows, moody' },
              { id: 'UNDERGROUND_STREET', name: 'Underground', desc: 'Raw concrete, film grain, gritty' },
              { id: 'LUXURY_RAP', name: 'Luxury Rap', desc: 'Gold tones, supercars, cinematic high-key' },
              { id: 'CINEMATIC_HIPHOP', name: 'Cinematic', desc: '2.39:1 anamorphic, teal & orange' },
              { id: 'DRILL_STREET', name: 'Drill Street', desc: 'Fast motion, smoke, high-contrast strobe' },
              { id: 'EMOTIONAL_RAP', name: 'Emotional', desc: 'Rain, melancholic, desaturated soft focus' },
              { id: 'FUTURISTIC_RAP', name: 'Futuristic', desc: 'Cyberpunk, holographic, laser reflections' },
              { id: 'OLD_SCHOOL_HIPHOP', name: '90s Boom-Bap', desc: 'VHS tape warmth, retro fisheye look' },
              { id: 'NEON_CITY', name: 'Neon City', desc: 'Night skyline, wet asphalt, bokeh glow' },
              { id: 'DOCUMENTARY_STYLE', name: 'Documentary', desc: 'Behind the scenes, handheld 16mm raw' },
            ].map((preset) => (
              <div
                key={preset.id}
                className="bg-[#08090C] border border-[#24262C] p-3.5 rounded-xl space-y-1 hover:border-[#286BFF]/40 transition-colors"
              >
                <div className="text-xs font-bold text-white">{preset.name}</div>
                <div className="text-[10px] text-gray-400 leading-tight">{preset.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Formats & Standards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-[#111318] border border-[#24262C] p-4 rounded-xl">
            <span className="text-lg font-mono font-bold text-white block">16:9 Widescreen</span>
            <span className="text-[11px] text-gray-400 font-mono">YouTube, TV, Desktop</span>
          </div>
          <div className="bg-[#111318] border border-[#24262C] p-4 rounded-xl">
            <span className="text-lg font-mono font-bold text-[#713BFF] block">9:16 Vertical</span>
            <span className="text-[11px] text-gray-400 font-mono">TikTok, Reels, Shorts</span>
          </div>
          <div className="bg-[#111318] border border-[#24262C] p-4 rounded-xl">
            <span className="text-lg font-mono font-bold text-[#C8A45D] block">1:1 Square</span>
            <span className="text-[11px] text-gray-400 font-mono">Instagram Feed, Artwork</span>
          </div>
        </div>
      </div>
    </div>
  );
};

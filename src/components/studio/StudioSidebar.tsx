'use client';

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Mic2,
  Sliders,
  AudioWaveform,
  Disc3,
  Flame,
  UserCheck,
  Download,
  Compass,
  FileText,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export type StudioTab =
  | 'DASHBOARD'
  | 'STUDIO'
  | 'AI_PRODUCER'
  | 'VOCAL_LAYERS'
  | 'MIXING'
  | 'AUTOTUNE'
  | 'MASTERING'
  | 'BEAT_LIBRARY'
  | 'NOTEPAD'
  | 'MY_VOICE'
  | 'EXPORT';

interface StudioSidebarProps {
  currentTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onSwitchToLanding?: () => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  currentTab,
  onSelectTab,
  onSwitchToLanding,
}) => {
  const { t } = useI18n();

  const navItems = [
    { id: 'DASHBOARD' as StudioTab, label: t.navDashboard, icon: LayoutDashboard },
    { id: 'STUDIO' as StudioTab, label: t.navStudio, icon: Layers, highlight: true },
    { id: 'AI_PRODUCER' as StudioTab, label: t.navAiProducer, icon: Sparkles, badge: 'AI' },
    { id: 'VOCAL_LAYERS' as StudioTab, label: t.navVocalLayers, icon: Mic2 },
    { id: 'MIXING' as StudioTab, label: t.navMixing, icon: Sliders },
    { id: 'AUTOTUNE' as StudioTab, label: t.navAutoTune, icon: AudioWaveform },
    { id: 'MASTERING' as StudioTab, label: t.navMastering, icon: Disc3, badge: 'LUFS' },
    { id: 'BEAT_LIBRARY' as StudioTab, label: t.navBeatLibrary, icon: Flame },
    { id: 'NOTEPAD' as StudioTab, label: t.navNotepad, icon: FileText },
    { id: 'MY_VOICE' as StudioTab, label: t.navMyVoice, icon: UserCheck },
    { id: 'EXPORT' as StudioTab, label: t.navExport, icon: Download },
  ];

  return (
    <aside className="w-16 md:w-60 bg-surface-300 border-r border-surface-50/20 flex flex-col justify-between select-none">
      {/* Top: Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center gap-3 border-b border-surface-50/20">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aura-blue via-aura-purple to-aura-red flex items-center justify-center font-black text-black text-lg shadow-glow">
            A
          </div>
          <div className="hidden md:block">
            <h2 className="font-extrabold text-sm tracking-wider text-white flex items-center gap-1.5">
              AURA <span className="text-aura-blue font-mono text-xs">RAP</span>
            </h2>
            <p className="text-[10px] text-gray-400 font-mono tracking-tight">
              {t.brandTagline}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {onSwitchToLanding && (
            <button
              onClick={onSwitchToLanding}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-accent font-bold text-brand-gold bg-brand-black/90 border border-brand-gold/30 hover:border-brand-gold hover:bg-brand-carbon transition mb-3 shadow-sm"
              title="Hip-Hop Culture & 13OMI Story"
            >
              <Compass className="w-4 h-4 text-brand-gold shrink-0" />
              <span className="hidden md:inline truncate tracking-wider">CULTURE & STORY</span>
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-aura-blue/15 text-aura-blue border border-aura-blue/30 shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-surface-200'
                }`}
                title={item.label}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-aura-blue' : 'text-gray-400'
                  }`}
                />
                <span className="hidden md:inline truncate">{item.label}</span>
                {item.badge && (
                  <span className="hidden md:inline-block ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-aura-purple/30 text-aura-purple border border-aura-purple/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Studio System Status */}
      <div className="p-3 border-t border-surface-50/20 hidden md:block">
        <div className="bg-surface-200/60 p-2.5 rounded-xl border border-surface-50/20 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-gray-400 font-mono">
            <span>{t.audioEngineStatus}</span>
            <span className="text-aura-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-aura-green animate-pulse" /> 48 kHz
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-400 font-mono">
            <span>{t.aiProducer}</span>
            <span className="text-aura-blue">{t.aiProducerActive}</span>
          </div>

          <div className="pt-2 border-t border-brand-concrete/40 flex items-center justify-between">
            <span className="font-accent text-[8.5px] text-brand-steel tracking-widest uppercase">
              VISION BY
            </span>
            <img
              src="/assets/branding/13omi-signature.svg"
              alt="13OMI"
              className="h-4.5 w-auto object-contain opacity-80 hover:opacity-100 transition"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

'use client';

import React from 'react';
import { AudioWaveform, Zap, Sparkles, Music } from 'lucide-react';
import { AudioTrackItem, AutoTuneSettings } from '@/types';
import { NOTE_NAMES } from '@/lib/audio/autotune';
import { useI18n } from '@/lib/i18n';

interface AutoTuneModuleProps {
  tracks: AudioTrackItem[];
  onUpdateTrackAutoTune: (trackId: string, settings: AutoTuneSettings) => void;
  onApplyOfflineAutoTune: (trackId: string) => void;
}

export const AutoTuneModule: React.FC<AutoTuneModuleProps> = ({
  tracks,
  onUpdateTrackAutoTune,
  onApplyOfflineAutoTune,
}) => {
  const { t } = useI18n();
  const vocalTracks = tracks.filter((tItem) => tItem.layerType !== 'BEAT' && tItem.layerType !== 'INSTRUMENTAL');
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>(vocalTracks[0]?.id || tracks[0]?.id || '');

  const currentTrack = tracks.find((tItem) => tItem.id === selectedTrackId);
  const settings = currentTrack?.effects.autoTune || {
    enabled: true,
    key: 'C',
    scale: 'minor' as const,
    strength: 0.85,
    speed: 5,
    humanize: 15,
  };

  const update = (updates: Partial<AutoTuneSettings>) => {
    if (!currentTrack) return;
    const newSettings: AutoTuneSettings = {
      ...settings,
      ...updates,
    };
    onUpdateTrackAutoTune(currentTrack.id, newSettings);
  };

  const applyAutoTuneStyle = (style: 'HARD_TRAP' | 'MELODIC_SMOOTH' | 'NATURAL_DRILL') => {
    if (style === 'HARD_TRAP') {
      update({ enabled: true, strength: 1.0, speed: 0, humanize: 5 });
    } else if (style === 'MELODIC_SMOOTH') {
      update({ enabled: true, strength: 0.75, speed: 18, humanize: 35 });
    } else if (style === 'NATURAL_DRILL') {
      update({ enabled: true, strength: 0.45, speed: 45, humanize: 60 });
    }
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-200 border border-surface-50/30 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <AudioWaveform className="w-5 h-5 text-aura-blue" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.autoTuneTitle}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t.autoTuneDesc}
          </p>
        </div>

        <button
          onClick={() => update({ enabled: !settings.enabled })}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border ${
            settings.enabled
              ? 'bg-aura-blue text-black border-aura-blue shadow-glow'
              : 'bg-surface-100 text-gray-400 border-surface-50/40 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          {settings.enabled ? t.autoTuneActive : t.autoTuneBypass}
        </button>
      </div>

      {/* Track Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {vocalTracks.map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setSelectedTrackId(tItem.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
              selectedTrackId === tItem.id
                ? 'bg-surface-100 text-white border-aura-blue shadow-glow'
                : 'bg-surface-200 text-gray-400 border-surface-50/20 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tItem.color }} />
            <span>{tItem.name}</span>
          </button>
        ))}
      </div>

      {currentTrack && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Key & Scale */}
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-50/20 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                {t.keyAndScale}
              </h3>
              <Music className="w-4 h-4 text-aura-purple" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase">{t.rootKey}</label>
              <div className="grid grid-cols-4 gap-2">
                {NOTE_NAMES.map((note) => (
                  <button
                    key={note}
                    onClick={() => update({ key: note })}
                    className={`py-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                      settings.key === note
                        ? 'bg-aura-blue text-black border-aura-blue shadow-glow'
                        : 'bg-surface-100 text-gray-400 border-surface-50/20 hover:text-white'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase">{t.scaleType}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'minor', label: t.scaleMinor },
                  { id: 'pentatonic_minor', label: t.scalePentatonic },
                  { id: 'major', label: t.scaleMajor },
                  { id: 'chromatic', label: t.scaleChromatic },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update({ scale: s.id as any })}
                    className={`p-2.5 rounded-lg text-left text-xs font-medium transition-all border ${
                      settings.scale === s.id
                        ? 'bg-aura-purple/20 text-aura-purple border-aura-purple/50'
                        : 'bg-surface-100 text-gray-400 border-surface-50/20 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Dynamics */}
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-50/20 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                {t.tuningDynamics}
              </h3>
              <span className="text-[10px] font-mono text-aura-blue">
                {settings.speed === 0 ? t.instantSnap : `${settings.speed} ${t.speedMs}`}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] text-gray-400">
                <span>{t.retuneSpeed}</span>
                <span className="text-white font-bold">{settings.speed} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={settings.speed}
                onChange={(e) => update({ speed: Number(e.target.value) })}
                className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
              />
              <p className="text-[10px] text-gray-500">
                0ms = Instant hard snap (Travis Scott / Future).
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-mono text-[10px] text-gray-400">
                <span>{t.correctionStrength}</span>
                <span className="text-aura-purple font-bold">
                  {Math.round(settings.strength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.strength}
                onChange={(e) => update({ strength: parseFloat(e.target.value) })}
                className="w-full h-1.5 accent-aura-purple bg-surface-50 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-mono text-[10px] text-gray-400">
                <span>{t.humanizeVibrato}</span>
                <span className="text-aura-gold font-bold">{settings.humanize}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.humanize}
                onChange={(e) => update({ humanize: Number(e.target.value) })}
                className="w-full h-1.5 accent-aura-gold bg-surface-50 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Column 3: Profiles */}
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-surface-50/20 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                  {t.profilesTitle}
                </h3>
                <Sparkles className="w-4 h-4 text-aura-gold" />
              </div>

              <div className="space-y-2 mt-4">
                <button
                  onClick={() => applyAutoTuneStyle('HARD_TRAP')}
                  className="w-full p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-50/30 text-left transition-colors"
                >
                  <span className="font-bold text-xs text-white block">{t.profileHardTrap}</span>
                  <span className="text-[10px] text-gray-400">{t.profileHardTrapDesc}</span>
                </button>

                <button
                  onClick={() => applyAutoTuneStyle('MELODIC_SMOOTH')}
                  className="w-full p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-50/30 text-left transition-colors"
                >
                  <span className="font-bold text-xs text-white block">{t.profileMelodic}</span>
                  <span className="text-[10px] text-gray-400">{t.profileMelodicDesc}</span>
                </button>

                <button
                  onClick={() => applyAutoTuneStyle('NATURAL_DRILL')}
                  className="w-full p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-50/30 text-left transition-colors"
                >
                  <span className="font-bold text-xs text-white block">{t.profileNatural}</span>
                  <span className="text-[10px] text-gray-400">{t.profileNaturalDesc}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-50/20">
              <button
                onClick={() => onApplyOfflineAutoTune(currentTrack.id)}
                className="w-full py-3 rounded-xl bg-aura-purple/20 hover:bg-aura-purple/30 text-aura-purple border border-aura-purple/40 font-bold text-xs shadow-glow-purple transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> {t.bakeAutoTuneBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AudioTrackItem, TrackFXChain } from '@/types';
import { calculateAIMix, AIMixResult } from '@/lib/ai/mixingAssistant';
import { useI18n } from '@/lib/i18n';

interface MixingStudioProps {
  tracks: AudioTrackItem[];
  onUpdateTrackFX: (trackId: string, fx: TrackFXChain) => void;
  onUpdateTrackVolumePan: (trackId: string, volume: number, pan: number) => void;
  onPlay: () => void;
}

export const VOCAL_PRESETS: Record<string, Partial<TrackFXChain>> = {
  'Clean Rap Vocal': {
    highPassFreq: 90,
    eq: { low: -2.0, mid: 2.0, midFreq: 3000, high: 2.0 },
    compressor: { threshold: -20, ratio: 4.0, attack: 0.02, release: 0.12, knee: 10 },
    deEsser: { enabled: true, threshold: -18, frequency: 6500 },
    saturation: { enabled: false, drive: 0, warmth: 50 },
    reverb: { enabled: true, decay: 1.2, preDelay: 0.02, mix: 0.12 },
    delay: { enabled: false, time: 0.25, feedback: 0.2, mix: 0.08, cutoff: 3500 },
  },
  'Aggressive Rap': {
    highPassFreq: 95,
    eq: { low: -3.0, mid: 4.5, midFreq: 2800, high: 3.5 },
    compressor: { threshold: -24, ratio: 6.0, attack: 0.01, release: 0.08, knee: 6 },
    deEsser: { enabled: true, threshold: -16, frequency: 6200 },
    saturation: { enabled: true, drive: 35, warmth: 60 },
    reverb: { enabled: true, decay: 1.4, preDelay: 0.01, mix: 0.15 },
    delay: { enabled: true, time: 0.2, feedback: 0.25, mix: 0.12, cutoff: 3200 },
  },
  'Modern Trap Vocal': {
    highPassFreq: 100,
    eq: { low: -4.0, mid: 3.0, midFreq: 3200, high: 4.0 },
    compressor: { threshold: -22, ratio: 4.5, attack: 0.015, release: 0.1, knee: 8 },
    deEsser: { enabled: true, threshold: -20, frequency: 6800 },
    saturation: { enabled: true, drive: 20, warmth: 50 },
    reverb: { enabled: true, decay: 1.8, preDelay: 0.02, mix: 0.18 },
    delay: { enabled: true, time: 0.25, feedback: 0.35, mix: 0.16, cutoff: 4000 },
  },
  'Drill Vocal': {
    highPassFreq: 110,
    eq: { low: -4.5, mid: 3.5, midFreq: 2600, high: 3.0 },
    compressor: { threshold: -25, ratio: 5.5, attack: 0.01, release: 0.09, knee: 5 },
    deEsser: { enabled: true, threshold: -18, frequency: 6000 },
    saturation: { enabled: true, drive: 25, warmth: 45 },
    reverb: { enabled: true, decay: 1.3, preDelay: 0.01, mix: 0.1 },
    delay: { enabled: false, time: 0.2, feedback: 0.2, mix: 0.05, cutoff: 3000 },
  },
  'Deep Rap Vocal': {
    highPassFreq: 75,
    eq: { low: 2.0, mid: 1.0, midFreq: 2200, high: 1.5 },
    compressor: { threshold: -18, ratio: 3.5, attack: 0.03, release: 0.15, knee: 12 },
    deEsser: { enabled: true, threshold: -20, frequency: 6000 },
    saturation: { enabled: true, drive: 22, warmth: 75 },
    reverb: { enabled: true, decay: 1.6, preDelay: 0.03, mix: 0.14 },
    delay: { enabled: false, time: 0.25, feedback: 0.2, mix: 0.08, cutoff: 3500 },
  },
  'Radio Vocal': {
    highPassFreq: 350,
    eq: { low: -8.0, mid: 5.0, midFreq: 2000, high: -4.0 },
    compressor: { threshold: -28, ratio: 8.0, attack: 0.005, release: 0.05, knee: 4 },
    deEsser: { enabled: false, threshold: -20, frequency: 6000 },
    saturation: { enabled: true, drive: 40, warmth: 30 },
    reverb: { enabled: true, decay: 2.5, preDelay: 0.01, mix: 0.3 },
    delay: { enabled: true, time: 0.35, feedback: 0.5, mix: 0.35, cutoff: 3000 },
  },
};

export const MixingStudio: React.FC<MixingStudioProps> = ({
  tracks,
  onUpdateTrackFX,
  onUpdateTrackVolumePan,
}) => {
  const { t } = useI18n();
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');
  const [aiMixResult, setAiMixResult] = useState<AIMixResult | null>(null);
  const [isMixing, setIsMixing] = useState<boolean>(false);
  const [isABComparing, setIsABComparing] = useState<boolean>(false);
  const [originalSnapshots, setOriginalSnapshots] = useState<Map<string, { volume: number; pan: number; fx: TrackFXChain }>>(new Map());

  const currentTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  const handleRunAIMix = () => {
    setIsMixing(true);

    const snap = new Map();
    for (const tItem of tracks) {
      snap.set(tItem.id, { volume: tItem.volume, pan: tItem.pan, fx: JSON.parse(JSON.stringify(tItem.effects)) });
    }
    setOriginalSnapshots(snap);

    setTimeout(() => {
      const result = calculateAIMix(tracks);
      setAiMixResult(result);

      for (const rec of result.recommendations) {
        onUpdateTrackVolumePan(rec.trackId, rec.newVolume, rec.newPan);
        onUpdateTrackFX(rec.trackId, rec.newFxChain);
      }

      setIsMixing(false);
    }, 600);
  };

  const toggleABCompare = () => {
    if (!isABComparing) {
      for (const [id, snap] of Array.from(originalSnapshots.entries())) {
        onUpdateTrackVolumePan(id, snap.volume, snap.pan);
        onUpdateTrackFX(id, snap.fx);
      }
      setIsABComparing(true);
    } else {
      if (aiMixResult) {
        for (const rec of aiMixResult.recommendations) {
          onUpdateTrackVolumePan(rec.trackId, rec.newVolume, rec.newPan);
          onUpdateTrackFX(rec.trackId, rec.newFxChain);
        }
      }
      setIsABComparing(false);
    }
  };

  const applyPreset = (presetName: string) => {
    if (!currentTrack) return;
    const preset = VOCAL_PRESETS[presetName];
    if (preset) {
      const updatedFX: TrackFXChain = {
        ...currentTrack.effects,
        ...preset,
      };
      onUpdateTrackFX(currentTrack.id, updatedFX);
    }
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-200 border border-surface-50/30 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-aura-blue" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.mixingStudioTitle}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t.mixingStudioDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {aiMixResult && (
            <button
              onClick={toggleABCompare}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                isABComparing
                  ? 'bg-aura-gold text-black border-aura-gold'
                  : 'bg-surface-100 text-aura-blue border-aura-blue/30'
              }`}
            >
              {isABComparing ? t.abListeningBefore : t.abCompareAfter}
            </button>
          )}

          <button
            onClick={handleRunAIMix}
            disabled={isMixing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-aura-blue hover:bg-aura-blue/90 text-black font-bold text-xs shadow-glow transition-all disabled:opacity-50"
          >
            {isMixing ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isMixing ? t.mixingAllTracks : t.aiMixBtn}
          </button>
        </div>
      </div>

      {aiMixResult && (
        <div className="bg-surface-200/90 border border-surface-50/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-aura-green flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4" /> AI Mix Report
            </span>
            <div className="flex items-center gap-4 text-gray-400 font-mono text-[11px]">
              <span>
                {t.vocalClarity}:{' '}
                <strong className="text-aura-blue">{aiMixResult.vocalClarityScore}%</strong>
              </span>
              <span>
                {t.beatBalance}:{' '}
                <strong className="text-aura-green">{aiMixResult.beatBalanceScore}%</strong>
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{aiMixResult.summary}</p>
        </div>
      )}

      {/* Track Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tracks.map((tItem) => (
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

      {/* Presets */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-gray-400 uppercase">
          {t.presetsLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(VOCAL_PRESETS).map((pName) => (
            <button
              key={pName}
              onClick={() => applyPreset(pName)}
              className="px-3 py-1 rounded-lg bg-surface-200 hover:bg-surface-100 border border-surface-50/20 text-xs text-gray-300 hover:text-aura-blue transition-colors"
            >
              {pName}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Strip */}
      {currentTrack && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1: EQ */}
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-50/20 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                {t.eqModuleTitle}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.hpfLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.highPassFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="350"
                  step="5"
                  value={currentTrack.effects.highPassFreq}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      highPassFreq: Number(e.target.value),
                    })
                  }
                  className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.lowShelfLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.eq.low} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={currentTrack.effects.eq.low}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      eq: { ...currentTrack.effects.eq, low: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.midPresenceLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.eq.mid} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={currentTrack.effects.eq.mid}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      eq: { ...currentTrack.effects.eq, mid: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.highAirLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.eq.high} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={currentTrack.effects.eq.high}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      eq: { ...currentTrack.effects.eq, high: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Module 2: Compressor */}
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-50/20 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                {t.compModuleTitle}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.thresholdLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.compressor.threshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="0"
                  step="1"
                  value={currentTrack.effects.compressor.threshold}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      compressor: { ...currentTrack.effects.compressor, threshold: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 accent-aura-purple bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.ratioLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.compressor.ratio}:1</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={currentTrack.effects.compressor.ratio}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      compressor: { ...currentTrack.effects.compressor, ratio: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 accent-aura-purple bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.deEsserLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.deEsser.frequency} Hz</span>
                </div>
                <input
                  type="range"
                  min="4000"
                  max="9000"
                  step="100"
                  value={currentTrack.effects.deEsser.frequency}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      deEsser: { ...currentTrack.effects.deEsser, frequency: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 accent-aura-purple bg-surface-50 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Module 3: Space & Saturation */}
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-50/20 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                {t.spaceModuleTitle}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.tapeDriveLabel}</span>
                  <span className="text-white font-bold">{currentTrack.effects.saturation.drive}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={currentTrack.effects.saturation.drive}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      saturation: {
                        ...currentTrack.effects.saturation,
                        enabled: Number(e.target.value) > 0,
                        drive: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full h-1.5 accent-aura-gold bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.reverbMixLabel}</span>
                  <span className="text-white font-bold">
                    {Math.round(currentTrack.effects.reverb.mix * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.02"
                  value={currentTrack.effects.reverb.mix}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      reverb: {
                        ...currentTrack.effects.reverb,
                        enabled: parseFloat(e.target.value) > 0,
                        mix: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>{t.delayMixLabel}</span>
                  <span className="text-white font-bold">
                    {Math.round(currentTrack.effects.delay.mix * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.02"
                  value={currentTrack.effects.delay.mix}
                  onChange={(e) =>
                    onUpdateTrackFX(currentTrack.id, {
                      ...currentTrack.effects,
                      delay: {
                        ...currentTrack.effects.delay,
                        enabled: parseFloat(e.target.value) > 0,
                        mix: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full h-1.5 accent-aura-purple bg-surface-50 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

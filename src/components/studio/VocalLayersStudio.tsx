'use client';

import React from 'react';
import {
  Mic,
  Sliders,
  Volume2,
  Sparkles,
  Headphones,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { AudioTrackItem, LayerType } from '@/types';
import { useI18n } from '@/lib/i18n';

interface VocalLayersStudioProps {
  tracks: AudioTrackItem[];
  onRecordLayer: (layerType: LayerType) => void;
  onOpenFX: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrackItem>) => void;
  onPlay: () => void;
}

export const VocalLayersStudio: React.FC<VocalLayersStudioProps> = ({
  tracks,
  onRecordLayer,
  onOpenFX,
  onUpdateTrack,
}) => {
  const { t } = useI18n();

  const layersConfig: {
    type: LayerType;
    title: string;
    subtitle: string;
    color: string;
    description: string;
    aiTip: string;
  }[] = [
    {
      type: 'MAIN_VOCAL',
      title: t.layerMain,
      subtitle: t.layerMainSub,
      color: '#00E5FF',
      description: t.layerMainDesc,
      aiTip: 'Center pan, clean 90Hz HPF, fast 4:1 compression, subtle tape warmth.',
    },
    {
      type: 'DOUBLE_VOCAL',
      title: t.layerDouble,
      subtitle: t.layerDoubleSub,
      color: '#9D4EDD',
      description: t.layerDoubleDesc,
      aiTip: 'Pan slightly off-center (L/R 35%), tuck -4dB under main vocal, heavy compression.',
    },
    {
      type: 'AD_LIBS',
      title: t.layerAdlibs,
      subtitle: t.layerAdlibsSub,
      color: '#FFD166',
      description: t.layerAdlibsDesc,
      aiTip: 'Wide stereo pan (L/R 60%), telephone bandpass filter, wet ping-pong echo.',
    },
    {
      type: 'BACKING',
      title: t.layerBacking,
      subtitle: t.layerBackingSub,
      color: '#05FFA1',
      description: t.layerBackingDesc,
      aiTip: 'Highpass 150Hz, stereo widening, lush reverb space.',
    },
    {
      type: 'CHORUS',
      title: t.layerChorus,
      subtitle: t.layerChorusSub,
      color: '#FF2A6D',
      description: t.layerChorusDesc,
      aiTip: 'Wide stereo spread, bright 10kHz vocal shine, glued with bus compression.',
    },
    {
      type: 'HARMONIES',
      title: t.layerHarmonies,
      subtitle: t.layerHarmoniesSub,
      color: '#3B82F6',
      description: t.layerHarmoniesDesc,
      aiTip: 'AutoTune quantized, smoothed highs, gentle chorus modulation.',
    },
    {
      type: 'INTRO',
      title: t.layerIntro,
      subtitle: t.layerIntroSub,
      color: '#EC4899',
      description: t.layerIntroDesc,
      aiTip: 'Lo-fi radio filter (highpass 300Hz, lowpass 4kHz) with deep reverb decay.',
    },
    {
      type: 'OUTRO',
      title: t.layerOutro,
      subtitle: t.layerOutroSub,
      color: '#A855F7',
      description: t.layerOutroDesc,
      aiTip: 'Automated delay throw, slow lowpass filter sweep into silence.',
    },
  ];

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-200 border border-surface-50/30 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-aura-purple" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.vocalLayersTitle}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t.vocalLayersSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-aura-blue/10 border border-aura-blue/30 rounded-xl text-xs text-aura-blue">
          <Headphones className="w-4 h-4 shrink-0" />
          <span>{t.headphoneTip}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {layersConfig.map((layer) => {
          const matchingTrack = tracks.find((t) => t.layerType === layer.type);
          const hasRecording = Boolean(matchingTrack && matchingTrack.audioBuffer);

          return (
            <div
              key={layer.type}
              className="bg-surface-200 border border-surface-50/30 rounded-2xl p-4 flex flex-col justify-between hover:border-surface-50 transition-all space-y-4 shadow-lg relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: layer.color }}
              />

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">{layer.title}</h3>
                  {hasRecording ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-aura-green bg-aura-green/10 px-2 py-0.5 rounded border border-aura-green/30">
                      <CheckCircle className="w-3 h-3" /> {t.recordedBadge}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500 bg-surface-100 px-2 py-0.5 rounded">
                      {t.emptyBadge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">{layer.subtitle}</span>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">{layer.description}</p>
              </div>

              <div className="bg-surface-100/70 p-2.5 rounded-xl border border-surface-50/20 text-[11px] text-gray-300 space-y-1">
                <div className="flex items-center gap-1.5 text-aura-blue font-semibold text-[10px] uppercase font-mono">
                  <Sparkles className="w-3 h-3" /> {t.aiProducer}
                </div>
                <p className="text-gray-400 leading-tight">{layer.aiTip}</p>
              </div>

              {matchingTrack && (
                <div className="pt-2 border-t border-surface-50/20 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 flex-1">
                    <Volume2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={matchingTrack.volume}
                      onChange={(e) =>
                        onUpdateTrack(matchingTrack.id, { volume: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => onOpenFX(matchingTrack.id)}
                    className="p-1.5 rounded hover:bg-surface-100 text-gray-400 hover:text-aura-blue transition-colors"
                    title={t.dspFxRack}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={() => onRecordLayer(layer.type)}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-glow"
                style={{
                  backgroundColor: `${layer.color}20`,
                  color: layer.color,
                  border: `1px solid ${layer.color}50`,
                }}
              >
                <Mic className="w-3.5 h-3.5" />
                {hasRecording ? t.overdubNewTake : t.recordThisLayer}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

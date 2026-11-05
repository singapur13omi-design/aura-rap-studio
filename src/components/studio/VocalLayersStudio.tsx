'use client';

import React from 'react';
import {
  Mic,
  Sliders,
  Volume2,
  Sparkles,
  Headphones,
  CheckCircle,
  Play,
  Layers,
} from 'lucide-react';
import { AudioTrackItem, LayerType } from '@/types';

interface VocalLayersStudioProps {
  tracks: AudioTrackItem[];
  onRecordLayer: (layerType: LayerType) => void;
  onOpenFX: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrackItem>) => void;
  onPlay: () => void;
}

interface LayerDefinition {
  type: LayerType;
  title: string;
  subtitle: string;
  color: string;
  description: string;
  aiTip: string;
}

export const VOCAL_LAYERS: LayerDefinition[] = [
  {
    type: 'MAIN_VOCAL',
    title: '1. MAIN VOCAL',
    subtitle: 'Lead Rap Performance',
    color: '#00E5FF',
    description: 'The foundation of the song. Punchy, dynamic, centered, and crisp.',
    aiTip: 'Center pan, clean 90Hz HPF, fast 4:1 compression, subtle tape warmth.',
  },
  {
    type: 'DOUBLE_VOCAL',
    title: '2. DOUBLE VOCAL',
    subtitle: 'Vocal Doubler / Stacks',
    color: '#9D4EDD',
    description: 'Tightly mirrors the main rap to give fullness, weight, and presence.',
    aiTip: 'Pan slightly off-center (L/R 35%), tuck -4dB under main vocal, heavy compression.',
  },
  {
    type: 'AD_LIBS',
    title: '3. AD-LIBS',
    subtitle: 'Hype Shouts & Echoes',
    color: '#FFD166',
    description: 'Signature rap shouts ("Skrrt!", "Yeah!", punchy rhymes at line ends).',
    aiTip: 'Wide stereo pan (L/R 60%), telephone bandpass filter, wet ping-pong echo.',
  },
  {
    type: 'BACKING',
    title: '4. BACKING VOCALS',
    subtitle: 'Background Chants & Pads',
    color: '#05FFA1',
    description: 'Supporting vocal fills and atmospheric chant layers under the verses.',
    aiTip: 'Highpass 150Hz, stereo widening, lush reverb space.',
  },
  {
    type: 'CHORUS',
    title: '5. CHORUS / HOOK',
    subtitle: 'Anthemic Hook',
    color: '#FF2A6D',
    description: 'Big, memorable hook recording. Double or triple layered for maximum impact.',
    aiTip: 'Wide stereo spread, bright 10kHz vocal shine, glued with bus compression.',
  },
  {
    type: 'HARMONIES',
    title: '6. HARMONIES',
    subtitle: 'Pitch & Chord Layers',
    color: '#3B82F6',
    description: 'Thirds, fifths, or octaves that add musical depth to melodic rap parts.',
    aiTip: 'AutoTune quantized, smoothed highs, gentle chorus modulation.',
  },
  {
    type: 'INTRO',
    title: '7. INTRO VOCAL',
    subtitle: 'Intro Speech & Drops',
    color: '#EC4899',
    description: 'Opening words, producer tag, speech, or filtered prelude.',
    aiTip: 'Lo-fi radio filter (highpass 300Hz, lowpass 4kHz) with deep reverb decay.',
  },
  {
    type: 'OUTRO',
    title: '8. OUTRO VOCAL',
    subtitle: 'Closing Remarks & Fades',
    color: '#A855F7',
    description: 'Final vocal fade, concluding rap thoughts, or echoing sign-off.',
    aiTip: 'Automated delay throw, slow lowpass filter sweep into silence.',
  },
];

export const VocalLayersStudio: React.FC<VocalLayersStudioProps> = ({
  tracks,
  onRecordLayer,
  onOpenFX,
  onUpdateTrack,
  onPlay,
}) => {
  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-200 border border-surface-50/30 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-aura-purple" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Vocal Layers Studio
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Build a multi-dimensional, professional hip-hop track by recording individual specialized vocal layers.
          </p>
        </div>

        {/* Headphone reminder */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-aura-blue/10 border border-aura-blue/30 rounded-xl text-xs text-aura-blue">
          <Headphones className="w-4 h-4 shrink-0" />
          <span>Headphones recommended to record over existing beat and main vocal.</span>
        </div>
      </div>

      {/* Grid of the 8 Vocal Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VOCAL_LAYERS.map((layer) => {
          // Find if there's an existing track with this layer
          const matchingTrack = tracks.find((t) => t.layerType === layer.type);
          const hasRecording = Boolean(matchingTrack && matchingTrack.audioBuffer);

          return (
            <div
              key={layer.type}
              className="bg-surface-200 border border-surface-50/30 rounded-2xl p-4 flex flex-col justify-between hover:border-surface-50 transition-all space-y-4 shadow-lg relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: layer.color }}
              />

              {/* Title & Status */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">{layer.title}</h3>
                  {hasRecording ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-aura-green bg-aura-green/10 px-2 py-0.5 rounded border border-aura-green/30">
                      <CheckCircle className="w-3 h-3" /> Recorded
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500 bg-surface-100 px-2 py-0.5 rounded">
                      Empty
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">{layer.subtitle}</span>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">{layer.description}</p>
              </div>

              {/* AI Producer Recommendation Tip */}
              <div className="bg-surface-100/70 p-2.5 rounded-xl border border-surface-50/20 text-[11px] text-gray-300 space-y-1">
                <div className="flex items-center gap-1.5 text-aura-blue font-semibold text-[10px] uppercase font-mono">
                  <Sparkles className="w-3 h-3" /> AI Producer Setup
                </div>
                <p className="text-gray-400 leading-tight">{layer.aiTip}</p>
              </div>

              {/* Track Controls if track exists */}
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
                    title="DSP Effects Chain"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action: Record Button */}
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
                {hasRecording ? 'OVERDUB / RECORD NEW TAKE' : 'RECORD THIS LAYER'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  Disc3,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AudioTrackItem, MasteringTarget } from '@/types';
import { MASTERING_TARGETS } from '@/lib/ai/masteringEngine';
import { renderOfflineMixdown } from '@/lib/audio/export';
import { calculateLoudnessStats, MeteringResult } from '@/lib/audio/metering';

interface MasteringStudioProps {
  tracks: AudioTrackItem[];
  projectDuration: number;
  onPlayMasterPreview: (masterBuffer: AudioBuffer) => void;
  onNavigateToExport: () => void;
}

export const MasteringStudio: React.FC<MasteringStudioProps> = ({
  tracks,
  projectDuration,
  onPlayMasterPreview,
  onNavigateToExport,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<MasteringTarget>(MASTERING_TARGETS[0]);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [finishStep, setFinishStep] = useState<string>('');
  const [masteredBuffer, setMasteredBuffer] = useState<AudioBuffer | null>(null);
  const [loudnessStats, setLoudnessStats] = useState<MeteringResult | null>(null);

  const steps = [
    'ANALYZING MULTITRACK AUDIO',
    'CLEANING VOCAL FREQUENCIES',
    'BALANCING 808 BASS & PUNCH',
    'PROCESSING STEREO IMAGE',
    'COMPUTING INTEGRATED LUFS MASTER',
    'FINAL TRUE PEAK LIMITING CHECK',
  ];

  // Execute AI FINISH MY TRACK
  const handleAiFinishTrack = async () => {
    setIsFinishing(true);

    for (let i = 0; i < steps.length; i++) {
      setFinishStep(steps[i]);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      // Real multitrack DSP mixdown & mastering render
      const totalSec = Math.max(10, projectDuration);
      const masterBuffer = await renderOfflineMixdown(
        tracks,
        totalSec,
        selectedTarget,
        44100
      );

      // Real ITU-R BS.1770 LUFS analysis
      const stats = calculateLoudnessStats(masterBuffer);
      setMasteredBuffer(masterBuffer);
      setLoudnessStats(stats);
    } catch (err) {
      console.error('Mastering failed:', err);
    } finally {
      setIsFinishing(false);
      setFinishStep('');
    }
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      {/* Top Banner: AI FINISH MY TRACK */}
      <div className="bg-gradient-to-r from-surface-200 via-surface-200 to-aura-purple/20 border border-aura-purple/40 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Disc3 className="w-6 h-6 text-aura-purple animate-spin-slow" />
            <h2 className="text-2xl font-black text-white tracking-wide">
              AI FINISH MY TRACK
            </h2>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            One-click master polish. Automatically inspects phase, clears mud, matches commercial Hip-Hop loudness standards, and prevents digital clipping.
          </p>
        </div>

        <button
          onClick={handleAiFinishTrack}
          disabled={isFinishing}
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-aura-purple via-aura-blue to-aura-green text-black font-extrabold text-sm shadow-glow hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isFinishing ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isFinishing ? 'FINISHING TRACK...' : 'AI FINISH MY TRACK'}
        </button>
      </div>

      {/* Step by Step Progress Visualizer */}
      {isFinishing && (
        <div className="bg-surface-200 border border-surface-50/30 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-aura-blue font-bold">
            <span>MASTERING PIPELINE</span>
            <span>{finishStep}</span>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isCurrent = finishStep === step;
              const isPast = steps.indexOf(finishStep) > idx;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-mono transition-all ${
                    isCurrent
                      ? 'bg-aura-blue/20 text-aura-blue border border-aura-blue/40 font-bold'
                      : isPast
                      ? 'text-aura-green font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-aura-green shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-aura-blue border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Loudness Presets */}
      <div className="space-y-3">
        <label className="text-xs font-mono text-gray-400 uppercase">
          Mastering Target Standard
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MASTERING_TARGETS.map((target) => (
            <button
              key={target.id}
              onClick={() => setSelectedTarget(target)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                selectedTarget.id === target.id
                  ? 'bg-surface-100 border-aura-blue text-white shadow-glow'
                  : 'bg-surface-200 border-surface-50/30 text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <span className="font-bold text-xs block text-white">{target.name}</span>
                <span className="text-[10px] text-aura-blue font-mono">
                  {target.targetLUFS} LUFS
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{target.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Real Loudness & Metering Stats Report */}
      {loudnessStats && masteredBuffer && (
        <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-50/20 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-aura-green" />
              <h3 className="font-bold text-sm text-white">
                Master Quality Assurance (EBU R128 / ITU-R BS.1770)
              </h3>
            </div>
            <button
              onClick={() => onPlayMasterPreview(masteredBuffer)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aura-blue text-black font-bold text-xs shadow-glow hover:bg-aura-blue/90 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> PLAY MASTER PREVIEW
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
            {/* Integrated LUFS */}
            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">
                Integrated Loudness
              </span>
              <span className="text-2xl font-bold text-aura-blue">
                {loudnessStats.integratedLUFS} LUFS
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                Target: {selectedTarget.targetLUFS} LUFS
              </span>
            </div>

            {/* True Peak */}
            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">True Peak</span>
              <span
                className={`text-2xl font-bold ${
                  loudnessStats.isClipping ? 'text-aura-red' : 'text-aura-green'
                }`}
              >
                {loudnessStats.truePeakDb} dBFS
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">Ceiling: -0.3 dBFS</span>
            </div>

            {/* Dynamic Range (LRA) */}
            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">Loudness Range (LRA)</span>
              <span className="text-2xl font-bold text-aura-gold">
                {loudnessStats.dynamicRangeLra} LU
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">Punchy Hip-Hop Dynamic</span>
            </div>

            {/* Clipping Safety Check */}
            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">Clipping Status</span>
              <span
                className={`text-2xl font-bold ${
                  loudnessStats.isClipping ? 'text-aura-red' : 'text-aura-green'
                }`}
              >
                {loudnessStats.isClipping ? 'CLIPPED' : 'SAFE'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                {loudnessStats.isClipping ? 'Check peak ceiling' : 'Zero digital overs'}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onNavigateToExport}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-aura-green hover:bg-aura-green/90 text-black font-extrabold text-xs shadow-glow transition-all"
            >
              CONTINUE TO EXPORT STUDIO <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

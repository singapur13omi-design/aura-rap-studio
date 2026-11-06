'use client';

import React, { useState } from 'react';
import {
  Disc3,
  Sparkles,
  CheckCircle2,
  Play,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AudioTrackItem, MasteringTarget } from '@/types';
import { MASTERING_TARGETS } from '@/lib/ai/masteringEngine';
import { renderOfflineMixdown } from '@/lib/audio/export';
import { calculateLoudnessStats, MeteringResult } from '@/lib/audio/metering';
import { useI18n } from '@/lib/i18n';

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
  const { t, language } = useI18n();
  const [selectedTarget, setSelectedTarget] = useState<MasteringTarget>(MASTERING_TARGETS[0]);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [finishStep, setFinishStep] = useState<string>('');
  const [masteredBuffer, setMasteredBuffer] = useState<AudioBuffer | null>(null);
  const [loudnessStats, setLoudnessStats] = useState<MeteringResult | null>(null);

  const stepsSK = [
    'ANALÝZA VIACSTOPOVÉHO AUDIA',
    'ČISTENIE VOKÁLNYCH FREKVENCIÍ',
    'VYVÁŽENIE 808 SUB-BASU & BICÍCH',
    'SPRACOVANIE STEREO ŠÍRKY',
    'VÝPOČET INTEGRATED LUFS MASTRA',
    'KONTROLA TRUE PEAK A DIGITAL CLIPPINGU',
  ];

  const stepsEN = [
    'ANALYZING MULTITRACK AUDIO',
    'CLEANING VOCAL FREQUENCIES',
    'BALANCING 808 BASS & PUNCH',
    'PROCESSING STEREO IMAGE',
    'COMPUTING INTEGRATED LUFS MASTER',
    'FINAL TRUE PEAK LIMITING CHECK',
  ];

  const activeSteps = language === 'sk' ? stepsSK : stepsEN;

  const handleAiFinishTrack = async () => {
    setIsFinishing(true);

    for (let i = 0; i < activeSteps.length; i++) {
      setFinishStep(activeSteps[i]);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const totalSec = Math.max(10, projectDuration);
      const masterBuffer = await renderOfflineMixdown(
        tracks,
        totalSec,
        selectedTarget,
        44100
      );

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
      <div className="bg-gradient-to-r from-surface-200 via-surface-200 to-aura-purple/20 border border-aura-purple/40 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Disc3 className="w-6 h-6 text-aura-purple animate-spin-slow" />
            <h2 className="text-2xl font-black text-white tracking-wide">
              {t.masteringTitle}
            </h2>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            {t.masteringDesc}
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
          {isFinishing ? t.finishingTrack : t.aiFinishBtn}
        </button>
      </div>

      {isFinishing && (
        <div className="bg-surface-200 border border-surface-50/30 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-aura-blue font-bold">
            <span>MASTERING PIPELINE</span>
            <span>{finishStep}</span>
          </div>

          <div className="space-y-2">
            {activeSteps.map((step, idx) => {
              const isCurrent = finishStep === step;
              const isPast = activeSteps.indexOf(finishStep) > idx;

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

      {/* Target Standards */}
      <div className="space-y-3">
        <label className="text-xs font-mono text-gray-400 uppercase">
          {t.targetStandardLabel}
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

      {loudnessStats && masteredBuffer && (
        <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-50/20 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-aura-green" />
              <h3 className="font-bold text-sm text-white">
                {t.masterQA}
              </h3>
            </div>
            <button
              onClick={() => onPlayMasterPreview(masteredBuffer)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aura-blue text-black font-bold text-xs shadow-glow hover:bg-aura-blue/90 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> {t.playMasterPreview}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">
                {t.integratedLoudness}
              </span>
              <span className="text-2xl font-bold text-aura-blue">
                {loudnessStats.integratedLUFS} LUFS
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                Target: {selectedTarget.targetLUFS} LUFS
              </span>
            </div>

            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">{t.truePeak}</span>
              <span
                className={`text-2xl font-bold ${
                  loudnessStats.isClipping ? 'text-aura-red' : 'text-aura-green'
                }`}
              >
                {loudnessStats.truePeakDb} dBFS
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">Ceiling: -0.3 dBFS</span>
            </div>

            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">{t.loudnessRange}</span>
              <span className="text-2xl font-bold text-aura-gold">
                {loudnessStats.dynamicRangeLra} LU
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">Punchy Hip-Hop Dynamic</span>
            </div>

            <div className="bg-surface-100 p-4 rounded-xl border border-surface-50/30">
              <span className="text-[10px] text-gray-400 block uppercase">{t.clippingStatus}</span>
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
              {t.continueToExport} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

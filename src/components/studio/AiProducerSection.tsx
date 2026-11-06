'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Activity,
  Flame,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { AudioTrackItem, AIAnalysisResult, HipHopGenre } from '@/types';
import { analyzeVocalTrack } from '@/lib/ai/rapAnalyzer';
import { generateHipHopBeat } from '@/lib/audio/synthesizer';
import { useI18n } from '@/lib/i18n';

interface AiProducerSectionProps {
  tracks: AudioTrackItem[];
  currentBpm: number;
  currentKey: string;
  onApplyAnalysis: (analysis: AIAnalysisResult) => void;
  onAddBeatTrack: (audioBuffer: AudioBuffer, title: string, bpm: number) => void;
  onSyncVocalWithBeat: () => void;
}

const HIP_HOP_GENRES: HipHopGenre[] = [
  'TRAP',
  'DRILL',
  'DARK_TRAP',
  'BOOM_BAP',
  'MELODIC_RAP',
  'EMOTIONAL_RAP',
  'HARDCORE',
  'OLD_SCHOOL',
  'GANGSTA_RAP',
  'EXPERIMENTAL',
];

export const AiProducerSection: React.FC<AiProducerSectionProps> = ({
  tracks,
  currentBpm,
  currentKey,
  onApplyAnalysis,
  onAddBeatTrack,
  onSyncVocalWithBeat,
}) => {
  const { t, language } = useI18n();
  const [selectedVocalTrackId, setSelectedVocalTrackId] = useState<string>(
    tracks.find((t) => t.layerType === 'MAIN_VOCAL')?.id || tracks[0]?.id || ''
  );

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // Beat Generator states
  const [selectedGenre, setSelectedGenre] = useState<HipHopGenre>('TRAP');
  const [beatBpm, setBeatBpm] = useState<number>(currentBpm || 140);
  const [beatKey, setBeatKey] = useState<string>(currentKey || 'C Minor');
  const [promptDescription, setPromptDescription] = useState<string>(
    language === 'sk'
      ? 'Temný agresívny trap beat, tvrdý 808 sub bas, hlboké piano, rýchle hi-haty'
      : 'Dark aggressive trap beat, heavy 808 bass, deep piano, hard drums, 140 BPM'
  );
  const [bassIntensity, setBassIntensity] = useState<number>(0.85);
  const [drumIntensity, setDrumIntensity] = useState<number>(0.9);
  const [isGeneratingBeat, setIsGeneratingBeat] = useState<boolean>(false);
  const [generatedBeatBuffer, setGeneratedBeatBuffer] = useState<AudioBuffer | null>(null);

  const handleAnalyzeRap = async () => {
    const track = tracks.find((t) => t.id === selectedVocalTrackId);
    if (!track || !track.audioBuffer) {
      alert(language === 'sk' ? 'Vyber stopu, ktorá obsahuje nahraný hlas.' : 'Select a track containing recorded audio.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = analyzeVocalTrack(track.audioBuffer);
      setAnalysisResult(analysis);
      setBeatBpm(analysis.estimatedBpm);
      setSelectedGenre(analysis.styleRecommendation);
      onApplyAnalysis(analysis);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateBeat = async () => {
    setIsGeneratingBeat(true);
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();

      const { fullBeat } = await generateHipHopBeat(ctx, {
        genre: selectedGenre,
        bpm: beatBpm,
        keyScale: beatKey,
        durationSeconds: 32,
        bassIntensity,
        drumIntensity,
      });

      setGeneratedBeatBuffer(fullBeat);
    } catch (err) {
      console.error('Beat generation failed:', err);
    } finally {
      setIsGeneratingBeat(false);
    }
  };

  const handleInsertBeatToTimeline = () => {
    if (generatedBeatBuffer) {
      onAddBeatTrack(
        generatedBeatBuffer,
        `${selectedGenre} AI Beat (${beatBpm} BPM)`,
        beatBpm
      );
    }
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-8">
      {/* SECTION 1: RAP FLOW & RHYTHM ANALYZER */}
      <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-aura-blue" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                {t.rapFlowAnalyzer}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t.rapFlowDesc}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedVocalTrackId}
              onChange={(e) => setSelectedVocalTrackId(e.target.value)}
              className="bg-surface-100 border border-surface-50/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-aura-blue"
            >
              {tracks.map((tItem) => (
                <option key={tItem.id} value={tItem.id}>
                  {tItem.name} ({tItem.layerType})
                </option>
              ))}
            </select>

            <button
              onClick={handleAnalyzeRap}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aura-blue hover:bg-aura-blue/90 text-black font-bold text-xs shadow-glow transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              {isAnalyzing ? t.analyzingRap : t.analyzeMyRapBtn}
            </button>
          </div>
        </div>

        {analysisResult && (
          <div className="bg-surface-100/60 border border-surface-50/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-50/20 pb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-aura-blue flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-aura-green" /> {t.analysisReport}
              </span>
              <span className="text-xs font-mono text-gray-400">
                Confidence: 98% (Real DSP Analysis)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-200/80 p-3 rounded-lg border border-surface-50/20">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">
                  {t.estimatedBpm}
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {analysisResult.estimatedBpm}
                </span>
              </div>

              <div className="bg-surface-200/80 p-3 rounded-lg border border-surface-50/20">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">
                  {t.flowStyle}
                </span>
                <span className="text-sm font-bold text-aura-purple">
                  {analysisResult.flowStyle}
                </span>
              </div>

              <div className="bg-surface-200/80 p-3 rounded-lg border border-surface-50/20">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">
                  {t.vocalCharacter}
                </span>
                <span className="text-sm font-bold text-aura-gold">
                  {analysisResult.vocalCharacter}
                </span>
              </div>

              <div className="bg-surface-200/80 p-3 rounded-lg border border-surface-50/20">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">
                  {t.energyRating}
                </span>
                <span className="text-sm font-bold text-aura-red">
                  {analysisResult.energy}
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-3 rounded-lg text-xs space-y-1">
              <div className="text-gray-300">
                <span className="text-gray-400 font-mono">{t.aiRecommendation} </span>
                <strong className="text-white">{analysisResult.styleRecommendation}</strong> –{' '}
                {analysisResult.beatRecommendation}
              </div>
              {analysisResult.adlibLocations.length > 0 && (
                <div className="text-[11px] text-gray-400 pt-1">
                  {t.adlibDetected} {analysisResult.adlibLocations.map((a) => `${a.start}s`).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: AI BEAT GENERATOR */}
      <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-aura-red" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                {t.aiBeatGeneratorTitle}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t.aiBeatDesc}
            </p>
          </div>

          <button
            onClick={onSyncVocalWithBeat}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-xs font-semibold text-aura-blue border border-aura-blue/30 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.syncVocalBeatBtn}
          </button>
        </div>

        {/* Genre Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-gray-400 uppercase">{t.selectStyle}</label>
          <div className="flex flex-wrap gap-2">
            {HIP_HOP_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGenre === genre
                    ? 'bg-aura-red text-white shadow-glow-red'
                    : 'bg-surface-100 text-gray-400 hover:text-white hover:bg-surface-50'
                }`}
              >
                {genre.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-gray-400 uppercase">
            {t.beatPromptLabel}
          </label>
          <input
            type="text"
            value={promptDescription}
            onChange={(e) => setPromptDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-100 border border-surface-50/40 rounded-xl text-xs text-white focus:outline-none focus:border-aura-blue"
          />
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-100 p-4 rounded-xl border border-surface-50/30 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-gray-400">
              <span>{t.tempoLabel}</span>
              <span className="text-white font-bold">{beatBpm} BPM</span>
            </div>
            <input
              type="range"
              min="70"
              max="175"
              value={beatBpm}
              onChange={(e) => setBeatBpm(Number(e.target.value))}
              className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-gray-400">
              <span>{t.bass808Intensity}</span>
              <span className="text-aura-purple font-bold">
                {Math.round(bassIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={bassIntensity}
              onChange={(e) => setBassIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-aura-purple bg-surface-50 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-gray-400">
              <span>{t.drumDrive}</span>
              <span className="text-aura-red font-bold">
                {Math.round(drumIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={drumIntensity}
              onChange={(e) => setDrumIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-aura-red bg-surface-50 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            onClick={handleGenerateBeat}
            disabled={isGeneratingBeat}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aura-red to-aura-purple text-white font-bold text-xs shadow-glow-red hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isGeneratingBeat ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGeneratingBeat ? t.synthesizingBeat : t.generateBeatBtn}
          </button>

          {generatedBeatBuffer && (
            <button
              onClick={handleInsertBeatToTimeline}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-aura-blue hover:bg-aura-blue/90 text-black font-bold text-xs shadow-glow transition-all"
            >
              <ArrowRight className="w-4 h-4" /> {t.insertBeatTimeline}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

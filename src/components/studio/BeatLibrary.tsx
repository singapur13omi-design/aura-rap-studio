'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Play, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { generateHipHopBeat } from '@/lib/audio/synthesizer';
import { HipHopGenre } from '@/types';

interface BeatItem {
  id: string;
  title: string;
  genre: HipHopGenre;
  bpm: number;
  keyScale: string;
  duration: number;
  source: string;
  license: string;
  tags: string;
}

interface BeatLibraryProps {
  onLoadBeatToTimeline: (buffer: AudioBuffer, title: string, bpm: number) => void;
}

export const BeatLibrary: React.FC<BeatLibraryProps> = ({ onLoadBeatToTimeline }) => {
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [loadingBeatId, setLoadingBeatId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/beats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBeats(data.beats);
      })
      .catch(console.error);
  }, []);

  const handleSelectBeat = async (beat: BeatItem) => {
    setLoadingBeatId(beat.id);
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const { fullBeat } = await generateHipHopBeat(ctx, {
        genre: beat.genre,
        bpm: beat.bpm,
        keyScale: beat.keyScale,
        durationSeconds: 32,
      });

      onLoadBeatToTimeline(fullBeat, beat.title, beat.bpm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBeatId(null);
    }
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-aura-red" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Royalty-Free Hip-Hop Beat Library
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Curated high-impact rap beats, trap 808s, UK drill glides, and vintage boom-bap chops ready for immediate recording.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-aura-blue/10 border border-aura-blue/30 text-xs text-aura-blue font-mono">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>100% Royalty-Free Commercial License Included</span>
        </div>
      </div>

      {/* Grid of Beats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-aura-blue/40 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-red/20 text-aura-red border border-aura-red/40 font-bold">
                  {beat.genre.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-white">{beat.bpm} BPM</span>
              </div>

              <h3 className="font-bold text-base text-white mt-2">{beat.title}</h3>
              <span className="text-xs font-mono text-aura-blue block">{beat.keyScale}</span>

              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{beat.tags}</p>
            </div>

            <button
              onClick={() => handleSelectBeat(beat)}
              disabled={loadingBeatId === beat.id}
              className="w-full py-2.5 rounded-xl bg-surface-100 hover:bg-aura-blue hover:text-black text-white font-bold text-xs border border-surface-50/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingBeatId === beat.id ? (
                <div className="w-3.5 h-3.5 border-2 border-aura-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-aura-blue" />
              )}
              {loadingBeatId === beat.id ? 'SYNTHESIZING BEAT...' : 'LOAD INTO STUDIO TIMELINE'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

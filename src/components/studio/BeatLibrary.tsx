'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Plus, ShieldCheck, Search, Music, Sparkles } from 'lucide-react';
import { generateHipHopBeat } from '@/lib/audio/synthesizer';
import { HipHopGenre } from '@/types';
import { useI18n } from '@/lib/i18n';

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
  const { t, language } = useI18n();
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [loadingBeatId, setLoadingBeatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/beats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBeats(data.beats);
      })
      .catch(console.error);
  }, []);

  const categories = [
    { id: 'ALL', label: language === 'sk' ? 'Všetky (26)' : 'All (26)' },
    { id: '13OMI', label: '13OMI Originals' },
    { id: 'TRAP', label: 'Trap' },
    { id: 'DRILL', label: 'Drill' },
    { id: 'BOOM_BAP', label: 'Boom-Bap' },
    { id: 'MELODIC_RAP', label: 'Melodic & Emo' },
    { id: 'HARDCORE', label: 'Hardcore & Rage' },
  ];

  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      // Category filter
      if (selectedCategory === '13OMI') {
        if (!beat.tags.includes('13OMI') && !beat.title.includes('13OMI')) return false;
      } else if (selectedCategory !== 'ALL') {
        if (beat.genre !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = beat.title.toLowerCase().includes(q);
        const matchesTags = beat.tags.toLowerCase().includes(q);
        const matchesKey = beat.keyScale.toLowerCase().includes(q);
        const matchesBpm = beat.bpm.toString().includes(q);
        return matchesTitle || matchesTags || matchesKey || matchesBpm;
      }
      return true;
    });
  }, [beats, selectedCategory, searchQuery]);

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
      {/* Header Banner */}
      <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-aura-red" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.beatLibraryTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-aura-red/20 text-aura-red text-[11px] font-mono font-bold">
              26 {language === 'sk' ? 'beatov' : 'beats'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t.beatLibraryDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-aura-blue/10 border border-aura-blue/30 text-xs text-aura-blue font-mono">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{t.royaltyFreeBadge}</span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? cat.id === '13OMI'
                    ? 'bg-gradient-to-r from-aura-red to-aura-purple text-white border-aura-red/60 shadow-glow-red'
                    : 'bg-aura-blue text-black border-aura-blue font-bold shadow-glow'
                  : 'bg-surface-200 text-gray-400 border-surface-50/40 hover:text-white hover:bg-surface-100'
              }`}
            >
              {cat.id === '13OMI' && <Sparkles className="w-3 h-3 inline mr-1" />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'sk' ? 'Hľadať beat, BPM, tóninu...' : 'Search beats, BPM, key...'}
            className="w-full bg-surface-200 border border-surface-50/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-aura-blue"
          />
        </div>
      </div>

      {/* Beat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeats.map((beat) => (
          <div
            key={beat.id}
            className={`bg-surface-200 border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all shadow-lg hover:shadow-xl ${
              beat.tags.includes('13OMI')
                ? 'border-aura-red/40 bg-gradient-to-br from-surface-200 to-aura-red/5 hover:border-aura-red'
                : 'border-surface-50/30 hover:border-aura-blue/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  beat.tags.includes('13OMI')
                    ? 'bg-aura-red/30 text-white border-aura-red'
                    : 'bg-aura-red/20 text-aura-red border-aura-red/40'
                }`}>
                  {beat.tags.includes('13OMI') ? '13OMI SPECIAL' : beat.genre.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-white">{beat.bpm} BPM</span>
              </div>

              <h3 className="font-bold text-base text-white mt-2 flex items-center gap-1.5">
                {beat.title}
              </h3>
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
              {loadingBeatId === beat.id ? t.synthesizingBeat : t.loadIntoTimeline}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

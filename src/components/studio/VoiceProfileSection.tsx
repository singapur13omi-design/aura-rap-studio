'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  CheckCircle,
  Mic,
  ShieldCheck,
  Save,
  Music,
} from 'lucide-react';
import { VoiceProfileData, HipHopGenre, TrackFXChain } from '@/types';

interface VoiceProfileSectionProps {
  currentFX?: TrackFXChain;
  onApplyProfileFX: (fx: TrackFXChain) => void;
}

export const VoiceProfileSection: React.FC<VoiceProfileSectionProps> = ({
  currentFX,
  onApplyProfileFX,
}) => {
  const [profiles, setProfiles] = useState<VoiceProfileData[]>([]);
  const [name, setName] = useState<string>('');
  const [character, setCharacter] = useState<string>('Gritty Deep Street Flow');
  const [genre, setGenre] = useState<HipHopGenre>('TRAP');
  const [notes, setNotes] = useState<string>('Optimized for 24-bit dynamic recording with tight 808 low-end pocket.');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch profiles
  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/voice-profiles');
      const data = await res.json();
      if (data.success) {
        setProfiles(
          data.profiles.map((p: any) => ({
            ...p,
            preferredFxChain:
              typeof p.preferredFxChain === 'string'
                ? JSON.parse(p.preferredFxChain)
                : p.preferredFxChain,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/voice-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          character,
          preferredGenre: genre,
          preferredFxChain: currentFX || {},
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        loadProfiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-aura-green" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              MY VOICE – Vocal Identity & Profiles
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Store your unique vocal timbre, personal DSP chains, and reference recordings.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-aura-green/10 border border-aura-green/30 text-xs text-aura-green">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Human Voice Integrity Guaranteed – Never arbitrarily replaced.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Create new Voice Profile */}
        <form
          onSubmit={handleCreateProfile}
          className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl space-y-4"
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <Plus className="w-4 h-4 text-aura-blue" /> Create Voice Profile
          </h3>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">Profile Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark Trap Aggressive Voice"
              className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-xs text-white focus:outline-none focus:border-aura-blue"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">
              Vocal Character / Timbre
            </label>
            <input
              type="text"
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              placeholder="e.g. Crisp High-Mid / Gritty Deep Vocal"
              className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-xs text-white focus:outline-none focus:border-aura-blue"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">
              Preferred Hip-Hop Style
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-xs text-white focus:outline-none focus:border-aura-blue"
            >
              <option value="TRAP">Trap</option>
              <option value="DRILL">Drill</option>
              <option value="DARK_TRAP">Dark Trap</option>
              <option value="BOOM_BAP">Boom Bap</option>
              <option value="MELODIC_RAP">Melodic Rap</option>
              <option value="EMOTIONAL_RAP">Emotional Rap</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">
              Studio Notes & Preferences
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-xs text-white focus:outline-none focus:border-aura-blue resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-aura-green hover:bg-aura-green/90 text-black font-bold text-xs shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'SAVE VOICE PROFILE'}
          </button>
        </form>

        {/* Existing Voice Profiles List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
            Saved Voice Profiles ({profiles.length})
          </h3>

          {profiles.length === 0 ? (
            <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-8 text-center text-gray-500 text-xs">
              No saved voice profiles yet. Create one to store your signature rap FX preset!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-surface-200 border border-surface-50/30 p-4 rounded-2xl flex flex-col justify-between space-y-3 hover:border-surface-50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <span className="text-[10px] font-mono text-aura-blue bg-aura-blue/10 px-2 py-0.5 rounded border border-aura-blue/30">
                        {p.preferredGenre}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono block mt-1">
                      {p.character}
                    </span>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">{p.notes}</p>
                  </div>

                  <div className="pt-3 border-t border-surface-50/20 flex items-center justify-between">
                    <button
                      onClick={() => onApplyProfileFX(p.preferredFxChain)}
                      className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-aura-blue text-xs font-semibold border border-aura-blue/30 transition-colors"
                    >
                      Apply To Current Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

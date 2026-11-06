'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Flame,
  Clock,
  Music,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Crown,
  Zap,
} from 'lucide-react';
import { ProjectData, HipHopGenre } from '@/types';
import { formatTime } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface DashboardViewProps {
  projects: ProjectData[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: (data: {
    title: string;
    genre: HipHopGenre;
    bpm: number;
    keyScale: string;
    projectType: string;
    language: string;
  }) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenPricing?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onOpenPricing,
}) => {
  const { data: session } = useSession();
  const { t, language } = useI18n();
  const userPlan = (session?.user as any)?.plan || 'FREE';
  const [showNewTrackModal, setShowNewTrackModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [genre, setGenre] = useState<HipHopGenre>('TRAP');
  const [bpm, setBpm] = useState<number>(140);
  const [keyScale, setKeyScale] = useState<string>('C Minor');
  const [projectType, setProjectType] = useState<string>('RECORD_VOICE');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject({
      title: title.trim() || (language === 'sk' ? 'Nový rapový track' : 'New Rap Track'),
      genre,
      bpm,
      keyScale,
      projectType,
      language,
    });
    setShowNewTrackModal(false);
    setTitle('');
  };

  const projectTypes = [
    { id: 'RECORD_VOICE', title: t.workflowRecordVoice, desc: t.workflowRecordVoiceDesc },
    { id: 'START_BEAT', title: t.workflowStartBeat, desc: t.workflowStartBeatDesc },
    { id: 'UPLOAD_RAP', title: t.workflowUploadRap, desc: t.workflowUploadRapDesc },
    { id: 'FROM_EXISTING', title: t.workflowExistingAudio, desc: t.workflowExistingAudioDesc },
  ];

  return (
    <div className="flex-1 bg-surface-300 p-6 md:p-8 overflow-y-auto space-y-8 select-none">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-surface-200 via-surface-200 to-aura-blue/15 border border-surface-50/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-blue/20 text-aura-blue text-xs font-mono font-bold border border-aura-blue/30">
            <Sparkles className="w-3.5 h-3.5" /> {t.version}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {t.brandTagline}
          </h1>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
            {t.studioSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowNewTrackModal(true)}
          className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-aura-blue hover:bg-aura-blue/90 text-black font-extrabold text-sm shadow-glow transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> {t.createNewTrack}
        </button>
      </div>

      {/* Subscription Tier Banner (If on Free plan) */}
      {userPlan === 'FREE' && (
        <div className="bg-gradient-to-r from-purple-950/70 via-zinc-900 to-primary/20 border border-primary/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
              <Crown className="w-5 h-5 text-aura-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">
                  {language === 'sk' ? 'Aktivuj neobmedzený PRO prístup' : 'Upgrade to Unlimited PRO'}
                </span>
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-black uppercase">
                  14.99 € / mesiac
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'sk'
                  ? 'Získaj neobmedzené rapové projekty, Auto-Tune, Stem export a AI generovanie beatov.'
                  : 'Unlock unlimited studio multitracks, Auto-Tune, Stem export, and AI beat generation.'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPricing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-aura-gold to-amber-500 hover:brightness-110 text-black font-black text-xs tracking-wider uppercase shrink-0 shadow-lg"
          >
            {language === 'sk' ? 'Odomknúť PRO' : 'Unlock PRO'}
          </button>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-aura-blue" /> {t.yourProjects} ({projects.length})
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-12 text-center space-y-3">
            <Music className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-white font-bold text-sm">{t.noProjectsYet}</h3>
            <p className="text-xs text-gray-400">{t.noProjectsDesc}</p>
            <button
              onClick={() => setShowNewTrackModal(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aura-blue text-black font-bold text-xs"
            >
              <Plus className="w-4 h-4" /> {t.createNewTrack}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 hover:border-aura-blue/50 transition-all cursor-pointer shadow-lg hover:shadow-glow flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-blue/15 text-aura-blue border border-aura-blue/30 font-bold">
                      {proj.genre.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {proj.bpm} BPM
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white mt-2 group-hover:text-aura-blue transition-colors truncate">
                    {proj.title}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono block">
                    Key: {proj.keyScale}
                  </span>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono mt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(proj.duration || 0)}
                    </span>
                    <span>•</span>
                    <span>{proj.tracks?.length || 0} {t.tracksCount}</span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="pt-3 border-t border-surface-50/20 flex items-center justify-between text-xs text-gray-400">
                  <span className="text-[10px] font-mono">
                    {new Date(proj.updatedAt || Date.now()).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      title={t.copy}
                      className="p-1.5 hover:text-white hover:bg-surface-100 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      title={t.delete}
                      className="p-1.5 hover:text-aura-red hover:bg-surface-100 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE NEW TRACK MODAL */}
      {showNewTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg bg-surface-200 border border-surface-50/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col space-y-5 p-6"
          >
            <div className="flex items-center justify-between border-b border-surface-50/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-aura-blue/20 text-aura-blue flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="font-bold text-white text-base">{t.modalNewTrackTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTrackModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-gray-400 font-mono text-[10px] uppercase">
                  {t.trackTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.trackTitlePlaceholder}
                  className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-white focus:outline-none focus:border-aura-blue"
                />
              </div>

              {/* Genre & BPM */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-400 font-mono text-[10px] uppercase">
                    {t.hipHopStyleLabel}
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-white focus:outline-none focus:border-aura-blue"
                  >
                    <option value="TRAP">Trap (140 BPM)</option>
                    <option value="DRILL">Drill (142 BPM)</option>
                    <option value="DARK_TRAP">Dark Trap (135 BPM)</option>
                    <option value="BOOM_BAP">Boom Bap (92 BPM)</option>
                    <option value="MELODIC_RAP">Melodic Rap (130 BPM)</option>
                    <option value="EMOTIONAL_RAP">Emotional Rap (125 BPM)</option>
                    <option value="HARDCORE">Hardcore Rap (140 BPM)</option>
                    <option value="OLD_SCHOOL">Old School (95 BPM)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 font-mono text-[10px] uppercase">
                    {t.tempoLabel}
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-100 border border-surface-50/40 rounded-xl text-white focus:outline-none focus:border-aura-blue"
                  />
                </div>
              </div>

              {/* Project Type */}
              <div className="space-y-1.5">
                <label className="text-gray-400 font-mono text-[10px] uppercase">
                  {t.workflowLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {projectTypes.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setProjectType(pt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        projectType === pt.id
                          ? 'bg-aura-blue/20 text-white border-aura-blue/50 shadow-glow'
                          : 'bg-surface-100 text-gray-400 border-surface-50/30 hover:text-white'
                      }`}
                    >
                      <span className="font-bold block text-[11px]">{pt.title}</span>
                      <span className="text-[10px] text-gray-400 leading-tight">{pt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-50/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewTrackModal(false)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-aura-blue hover:bg-aura-blue/90 text-black font-bold text-xs shadow-glow transition-all"
              >
                {t.openRecordingStudio}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

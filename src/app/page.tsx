'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, Crown } from 'lucide-react';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { StudioSidebar, StudioTab } from '@/components/studio/StudioSidebar';
import { MultitrackTimeline } from '@/components/studio/MultitrackTimeline';
import { RecordingModal } from '@/components/studio/RecordingModal';
import { VocalLayersStudio } from '@/components/studio/VocalLayersStudio';
import { AiProducerSection } from '@/components/studio/AiProducerSection';
import { MixingStudio } from '@/components/studio/MixingStudio';
import { AutoTuneModule } from '@/components/studio/AutoTuneModule';
import { MasteringStudio } from '@/components/studio/MasteringStudio';
import { ExportStudio } from '@/components/studio/ExportStudio';
import { BeatLibrary } from '@/components/studio/BeatLibrary';
import { VoiceProfileSection } from '@/components/studio/VoiceProfileSection';
import { AiMusicAssistant } from '@/components/studio/AiMusicAssistant';
import { DashboardView } from '@/components/studio/DashboardView';
import { AuthModal } from '@/components/auth/AuthModal';
import { PricingModal } from '@/components/pricing/PricingModal';

import { MultitrackAudioEngine } from '@/lib/audio/engine';
import { generateHipHopBeat } from '@/lib/audio/synthesizer';
import { processAutoTuneBuffer } from '@/lib/audio/autotune';
import { I18nProvider, useI18n } from '@/lib/i18n';
import {
  ProjectData,
  AudioTrackItem,
  LayerType,
  AIAnalysisResult,
  HipHopGenre,
} from '@/types';
import { RecordingResult } from '@/lib/audio/recorder';

function AuraRapStudioContent() {
  const { t, language } = useI18n();
  const [currentTab, setCurrentTab] = useState<StudioTab>('DASHBOARD');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Playback & Engine State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [masterPeakDb, setMasterPeakDb] = useState<number>(-60);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auth & Subscription
  const { data: session } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [pricingModalOpen, setPricingModalOpen] = useState<boolean>(false);
  const [upgradeSuccessToast, setUpgradeSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('upgraded') === 'true') {
        setUpgradeSuccessToast(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Modals & Drawers
  const [recordingModalOpen, setRecordingModalOpen] = useState<boolean>(false);
  const [recordingTargetTrackId, setRecordingTargetTrackId] = useState<string | undefined>(undefined);
  const [aiAssistantOpen, setAiAssistantOpen] = useState<boolean>(false);

  // Audio Engine Instance
  const engineRef = useRef<MultitrackAudioEngine | null>(null);

  // Initialize Audio Engine once
  useEffect(() => {
    const engine = new MultitrackAudioEngine();
    engine.onTimeUpdate = (sec) => setCurrentTime(sec);
    engine.onPlayStateChange = (playing) => setIsPlaying(playing);
    engine.onMasterLevel = (peak) => setMasterPeakDb(peak);
    engineRef.current = engine;

    return () => {
      engine.dispose();
    };
  }, []);

  // Keyboard Shortcuts: Space (Play/Pause), R (Record), Escape (Close Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (engineRef.current?.getIsPlaying()) {
          engineRef.current.pause();
        } else {
          engineRef.current?.play();
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const mainVocal = currentProject?.tracks.find((trk) => trk.layerType === 'MAIN_VOCAL');
        setRecordingTargetTrackId(mainVocal?.id || currentProject?.tracks[0]?.id);
        setRecordingModalOpen(true);
      } else if (e.code === 'Escape') {
        setRecordingModalOpen(false);
        setAiAssistantOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  // Fetch Projects from database or create initial demo project
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects.length > 0) {
        const parsed: ProjectData[] = data.projects.map((p: any) => ({
          ...p,
          tracks: (p.tracks || []).map((trk: any) => ({
            ...trk,
            effects: typeof trk.effects === 'string' ? JSON.parse(trk.effects) : trk.effects,
          })),
        }));
        setProjects(parsed);
      } else {
        handleCreateProject({
          title: language === 'sk' ? 'Démonický Trap Freestyle' : 'Demon Trap Freestyle',
          genre: 'TRAP',
          bpm: 140,
          keyScale: 'C Minor',
          projectType: 'START_BEAT',
          language: 'sk',
        });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [language]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Synchronize AudioEngine whenever currentProject's tracks change
  useEffect(() => {
    if (currentProject && engineRef.current) {
      engineRef.current.setBpm(currentProject.bpm);
      engineRef.current.setMasterVolume(currentProject.masterVolume);
      engineRef.current.setMetronome(currentProject.metronomeOn);
      engineRef.current.syncTracks(currentProject.tracks);
    }
  }, [currentProject]);

  // Create Project
  const handleCreateProject = async (data: {
    title: string;
    genre: HipHopGenre;
    bpm: number;
    keyScale: string;
    projectType: string;
    language: string;
  }) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        const newProj: ProjectData = {
          ...resData.project,
          tracks: resData.project.tracks.map((trk: any) => ({
            ...trk,
            effects: typeof trk.effects === 'string' ? JSON.parse(trk.effects) : trk.effects,
          })),
        };

        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        const { fullBeat } = await generateHipHopBeat(ctx, {
          genre: newProj.genre,
          bpm: newProj.bpm,
          keyScale: newProj.keyScale,
          durationSeconds: 32,
        });

        const beatTrack = newProj.tracks.find((trk) => trk.layerType === 'BEAT');
        if (beatTrack) {
          beatTrack.audioBuffer = fullBeat;
          beatTrack.duration = fullBeat.duration;
        }

        setProjects((prev) => [newProj, ...prev]);
        setCurrentProject(newProj);
        setCurrentTab('STUDIO');
      } else if (resData.requiresUpgrade) {
        setPricingModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Project
  const handleOpenProject = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const beatTrack = proj.tracks.find((trk) => trk.layerType === 'BEAT' && !trk.audioBuffer);
      if (beatTrack) {
        const { fullBeat } = await generateHipHopBeat(ctx, {
          genre: proj.genre,
          bpm: proj.bpm,
          keyScale: proj.keyScale,
          durationSeconds: 32,
        });
        beatTrack.audioBuffer = fullBeat;
        beatTrack.duration = fullBeat.duration;
      }

      setCurrentProject(proj);
      setCurrentTab('STUDIO');
    }
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!currentProject) return;
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentProject.title,
          genre: currentProject.genre,
          bpm: currentProject.bpm,
          keyScale: currentProject.keyScale,
          masterVolume: currentProject.masterVolume,
          metronomeOn: currentProject.metronomeOn,
          duration: currentProject.duration,
        }),
      });

      for (const trk of currentProject.tracks) {
        await fetch('/api/tracks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: trk.id,
            name: trk.name,
            volume: trk.volume,
            pan: trk.pan,
            muted: trk.muted,
            soloed: trk.soloed,
            startTime: trk.startTime,
            duration: trk.duration,
            effects: trk.effects,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Project
  const handleDuplicateProject = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    handleCreateProject({
      title: `${proj.title} (Kópia)`,
      genre: proj.genre,
      bpm: proj.bpm,
      keyScale: proj.keyScale,
      projectType: proj.projectType,
      language: proj.language,
    });
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    const confirmMsg = language === 'sk' ? 'Naozaj chceš vymazať tento projekt?' : 'Are you sure you want to delete this project?';
    if (!confirm(confirmMsg)) return;
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setCurrentTab('DASHBOARD');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlay = () => engineRef.current?.play();
  const handlePause = () => engineRef.current?.pause();
  const handleStop = () => engineRef.current?.stop();
  const handleSeek = (sec: number) => engineRef.current?.seek(sec);

  const handleUpdateTrack = (trackId: string, updates: Partial<AudioTrackItem>) => {
    if (!currentProject) return;
    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.map((trk) => (trk.id === trackId ? { ...trk, ...updates } : trk)),
      };
    });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (!currentProject) return;
    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.filter((trk) => trk.id !== trackId),
      };
    });
    fetch(`/api/tracks?id=${trackId}`, { method: 'DELETE' }).catch(console.error);
  };

  const handleAddTrack = (layerType: LayerType = 'MAIN_VOCAL') => {
    if (!currentProject) return;
    const colors: Record<string, string> = {
      MAIN_VOCAL: '#00E5FF',
      DOUBLE_VOCAL: '#9D4EDD',
      AD_LIBS: '#FFD166',
      BACKING: '#05FFA1',
      CHORUS: '#FF2A6D',
      HARMONIES: '#3B82F6',
      INTRO: '#EC4899',
      OUTRO: '#A855F7',
      BEAT: '#FF2A6D',
    };

    const newTrack: AudioTrackItem = {
      id: `t-${Date.now()}`,
      projectId: currentProject.id,
      name: `${layerType.replace('_', ' ')} ${currentProject.tracks.length + 1}`,
      layerType,
      color: colors[layerType] || '#00E5FF',
      volume: 0.85,
      pan: 0,
      muted: false,
      soloed: false,
      startTime: 0,
      duration: 30,
      orderIndex: currentProject.tracks.length,
      effects: {
        highPassFreq: 85,
        eq: { low: 0, mid: 0, midFreq: 2500, high: 0 },
        compressor: { threshold: -20, ratio: 4, attack: 0.02, release: 0.1, knee: 10 },
        deEsser: { enabled: true, threshold: -20, frequency: 6000 },
        saturation: { enabled: false, drive: 0, warmth: 50 },
        reverb: { enabled: true, decay: 1.5, preDelay: 0.02, mix: 0.12 },
        delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.1, cutoff: 3500 },
        autoTune: { enabled: false, key: 'C', scale: 'minor', strength: 0.8, speed: 10, humanize: 20 },
      },
    };

    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: [...prev.tracks, newTrack],
      };
    });

    fetch('/api/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrack),
    }).catch(console.error);
  };

  const handleOpenRecordTrack = (trackId: string) => {
    setRecordingTargetTrackId(trackId);
    setRecordingModalOpen(true);
  };

  const handleSaveRecording = (
    trackId: string,
    result: RecordingResult,
    latencyOffsetSec: number
  ) => {
    if (!currentProject) return;
    const adjustedStart = Math.max(0, currentTime - latencyOffsetSec);

    handleUpdateTrack(trackId, {
      audioBuffer: result.audioBuffer,
      duration: result.duration,
      startTime: adjustedStart,
    });
  };

  const handleImportAudio = async (trackId: string, file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const decoded = await ctx.decodeAudioData(arrayBuffer);

      handleUpdateTrack(trackId, {
        name: file.name.replace(/\.[^/.]+$/, ''),
        audioBuffer: decoded,
        duration: decoded.duration,
      });
    } catch (err) {
      console.error('Audio import failed:', err);
      alert(language === 'sk' ? 'Súbor sa nepodarilo dekódovať. Skontroluj formát (WAV, MP3, FLAC).' : 'Could not decode audio file.');
    }
  };

  const handleAddBeatTrack = (buffer: AudioBuffer, title: string, bpm: number) => {
    if (!currentProject) return;

    let beatTrack = currentProject.tracks.find((trk) => trk.layerType === 'BEAT');
    if (beatTrack) {
      handleUpdateTrack(beatTrack.id, {
        name: title,
        audioBuffer: buffer,
        duration: buffer.duration,
      });
    } else {
      handleAddTrack('BEAT');
    }

    setCurrentProject((prev) => (prev ? { ...prev, bpm } : null));
    setCurrentTab('STUDIO');
  };

  const handleApplyAnalysis = (analysis: AIAnalysisResult) => {
    if (!currentProject) return;
    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        bpm: analysis.estimatedBpm,
        keyScale: analysis.detectedKey,
        genre: analysis.styleRecommendation,
      };
    });

    fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: currentProject.id,
        analysisData: analysis,
      }),
    }).catch(console.error);
  };

  const handleSyncVocalWithBeat = () => {
    if (!currentProject) return;
    const mainVocal = currentProject.tracks.find((trk) => trk.layerType === 'MAIN_VOCAL');
    const beatTrack = currentProject.tracks.find((trk) => trk.layerType === 'BEAT');

    if (mainVocal && beatTrack) {
      const secondsPerBeat = 60 / currentProject.bpm;
      const barDuration = secondsPerBeat * 4;
      const nearestBar = Math.round((mainVocal.startTime || 0) / barDuration) * barDuration;

      handleUpdateTrack(mainVocal.id, { startTime: nearestBar });
      alert(
        language === 'sk'
          ? `Zosynchronizované! Hlavný vokál bol magneticky prichytený na takt pri ${nearestBar.toFixed(2)}s.`
          : `Synchronized! Main vocal snapped to bar marker at ${nearestBar.toFixed(2)}s.`
      );
    }
  };

  const handleApplyOfflineAutoTune = (trackId: string) => {
    const trk = currentProject?.tracks.find((tItem) => tItem.id === trackId);
    if (!trk || !trk.audioBuffer) return;

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtxClass();
    const tunedBuffer = processAutoTuneBuffer(trk.audioBuffer, ctx, trk.effects.autoTune);

    handleUpdateTrack(trackId, { audioBuffer: tunedBuffer });
    alert(language === 'sk' ? `Auto-Tune bol úspešne upečený do stopy ${trk.name}!` : `Auto-Tune successfully baked into ${trk.name}!`);
  };

  const handleApplyAssistantAction = (action: any) => {
    if (!currentProject) return;

    if (action.type === 'UPDATE_FX') {
      const targetTracks = currentProject.tracks.filter(
        (trk) => action.layer === 'Master' || trk.layerType === action.layer
      );
      for (const trk of targetTracks) {
        handleUpdateTrack(trk.id, {
          effects: {
            ...trk.effects,
            ...action.changes,
          },
        });
      }
    } else if (action.type === 'NAVIGATE_TO_LAYER') {
      setCurrentTab('VOCAL_LAYERS');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      <StudioHeader
        projectTitle={currentProject?.title || t.brandName}
        isPlaying={isPlaying}
        currentTime={currentTime}
        bpm={currentProject?.bpm || 140}
        keyScale={currentProject?.keyScale || 'C Minor'}
        masterVolume={currentProject?.masterVolume ?? 1.0}
        metronomeOn={currentProject?.metronomeOn ?? false}
        masterPeakDb={masterPeakDb}
        isSaving={isSaving}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onRecordClick={() => {
          const mainVocal = currentProject?.tracks.find((trk) => trk.layerType === 'MAIN_VOCAL');
          handleOpenRecordTrack(mainVocal?.id || currentProject?.tracks[0]?.id || '');
        }}
        onBpmChange={(bpm) =>
          setCurrentProject((prev) => (prev ? { ...prev, bpm } : null))
        }
        onKeyScaleChange={(keyScale) =>
          setCurrentProject((prev) => (prev ? { ...prev, keyScale } : null))
        }
        onMasterVolumeChange={(vol) =>
          setCurrentProject((prev) => (prev ? { ...prev, masterVolume: vol } : null))
        }
        onToggleMetronome={() =>
          setCurrentProject((prev) =>
            prev ? { ...prev, metronomeOn: !prev.metronomeOn } : null
          )
        }
        onToggleAiAssistant={() => setAiAssistantOpen((v) => !v)}
        onSaveProject={handleSaveProject}
        onOpenPricing={() => setPricingModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {upgradeSuccessToast && (
        <div className="bg-gradient-to-r from-emerald-600 via-primary to-purple-600 text-black px-4 py-2 text-center text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-lg z-40 animate-fade-in">
          <Sparkles className="w-4 h-4 fill-current animate-spin" />
          <span>
            {language === 'sk'
              ? '🎉 PLATBA ÚSPEŠNÁ! Tvoj účet bol povýšený na PRO. Všetky rapové funkcie a neobmedzený export sú odomknuté!'
              : '🎉 PAYMENT SUCCESSFUL! Your account is now PRO. All studio features and unlimited exports unlocked!'}
          </span>
          <button
            onClick={() => setUpgradeSuccessToast(false)}
            className="ml-3 px-2 py-0.5 rounded bg-black/20 hover:bg-black/40 text-black font-extrabold text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <StudioSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {currentTab === 'DASHBOARD' && (
          <DashboardView
            projects={projects}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onOpenPricing={() => setPricingModalOpen(true)}
          />
        )}

        {currentTab === 'STUDIO' && currentProject && (
          <MultitrackTimeline
            tracks={currentProject.tracks}
            currentTime={currentTime}
            duration={currentProject.duration || 32}
            bpm={currentProject.bpm}
            onSeek={handleSeek}
            onUpdateTrack={handleUpdateTrack}
            onDeleteTrack={handleDeleteTrack}
            onAddTrack={handleAddTrack}
            onOpenFX={() => setCurrentTab('MIXING')}
            onRecordTrack={handleOpenRecordTrack}
            onImportAudio={handleImportAudio}
          />
        )}

        {currentTab === 'AI_PRODUCER' && currentProject && (
          <AiProducerSection
            tracks={currentProject.tracks}
            currentBpm={currentProject.bpm}
            currentKey={currentProject.keyScale}
            onApplyAnalysis={handleApplyAnalysis}
            onAddBeatTrack={handleAddBeatTrack}
            onSyncVocalWithBeat={handleSyncVocalWithBeat}
          />
        )}

        {currentTab === 'VOCAL_LAYERS' && currentProject && (
          <VocalLayersStudio
            tracks={currentProject.tracks}
            onRecordLayer={(layerType) => {
              let trk = currentProject.tracks.find((tItem) => tItem.layerType === layerType);
              if (!trk) {
                handleAddTrack(layerType);
              }
              const target = currentProject.tracks.find((tItem) => tItem.layerType === layerType);
              handleOpenRecordTrack(target?.id || '');
            }}
            onOpenFX={() => setCurrentTab('MIXING')}
            onUpdateTrack={handleUpdateTrack}
            onPlay={handlePlay}
          />
        )}

        {currentTab === 'MIXING' && currentProject && (
          <MixingStudio
            tracks={currentProject.tracks}
            onUpdateTrackFX={(trackId, fx) => handleUpdateTrack(trackId, { effects: fx })}
            onUpdateTrackVolumePan={(trackId, vol, pan) =>
              handleUpdateTrack(trackId, { volume: vol, pan })
            }
            onPlay={handlePlay}
          />
        )}

        {currentTab === 'AUTOTUNE' && currentProject && (
          <AutoTuneModule
            tracks={currentProject.tracks}
            onUpdateTrackAutoTune={(trackId, autoTuneSettings) => {
              const trk = currentProject.tracks.find((tItem) => tItem.id === trackId);
              if (trk) {
                handleUpdateTrack(trackId, {
                  effects: { ...trk.effects, autoTune: autoTuneSettings },
                });
              }
            }}
            onApplyOfflineAutoTune={handleApplyOfflineAutoTune}
          />
        )}

        {currentTab === 'MASTERING' && currentProject && (
          <MasteringStudio
            tracks={currentProject.tracks}
            projectDuration={currentProject.duration || 32}
            onPlayMasterPreview={(masterBuffer) => {
              const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
              const ctx = new AudioCtxClass();
              const source = ctx.createBufferSource();
              source.buffer = masterBuffer;
              source.connect(ctx.destination);
              source.start(0);
            }}
            onNavigateToExport={() => setCurrentTab('EXPORT')}
          />
        )}

        {currentTab === 'BEAT_LIBRARY' && (
          <BeatLibrary onLoadBeatToTimeline={handleAddBeatTrack} />
        )}

        {currentTab === 'MY_VOICE' && currentProject && (
          <VoiceProfileSection
            currentFX={currentProject.tracks[0]?.effects}
            onApplyProfileFX={(fx) => {
              if (currentProject.tracks[0]) {
                handleUpdateTrack(currentProject.tracks[0].id, { effects: fx });
                alert(language === 'sk' ? 'Vokálny profil bol úspešne aplikovaný na hlavný rapový vokál!' : 'Vocal profile FX applied to primary rap vocal track!');
              }
            }}
          />
        )}

        {currentTab === 'EXPORT' && currentProject && (
          <ExportStudio project={currentProject} tracks={currentProject.tracks} />
        )}
      </div>

      {currentProject && (
        <RecordingModal
          isOpen={recordingModalOpen}
          onClose={() => setRecordingModalOpen(false)}
          targetTrack={currentProject.tracks.find((trk) => trk.id === recordingTargetTrackId)}
          onSaveRecording={handleSaveRecording}
        />
      )}

      {currentProject && (
        <AiMusicAssistant
          isOpen={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
          project={currentProject}
          tracks={currentProject.tracks}
          onApplyAssistantAction={handleApplyAssistantAction}
        />
      )}

      {/* Authentication Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Subscription & Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
    </div>
  );
}

export default function AuraRapStudioApp() {
  return (
    <I18nProvider>
      <AuraRapStudioContent />
    </I18nProvider>
  );
}

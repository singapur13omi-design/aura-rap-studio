'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

import { MultitrackAudioEngine } from '@/lib/audio/engine';
import { generateHipHopBeat } from '@/lib/audio/synthesizer';
import { processAutoTuneBuffer } from '@/lib/audio/autotune';
import {
  ProjectData,
  AudioTrackItem,
  LayerType,
  TrackFXChain,
  AutoTuneSettings,
  AIAnalysisResult,
  HipHopGenre,
} from '@/types';
import { RecordingResult } from '@/lib/audio/recorder';

export default function AuraRapStudioApp() {
  const [currentTab, setCurrentTab] = useState<StudioTab>('DASHBOARD');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Playback & Engine State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [masterPeakDb, setMasterPeakDb] = useState<number>(-60);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  // Fetch Projects from database or create initial demo project
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects.length > 0) {
        // Parse effects JSON
        const parsed: ProjectData[] = data.projects.map((p: any) => ({
          ...p,
          tracks: (p.tracks || []).map((t: any) => ({
            ...t,
            effects: typeof t.effects === 'string' ? JSON.parse(t.effects) : t.effects,
          })),
        }));
        setProjects(parsed);
      } else {
        // Seed default initial project
        handleCreateProject({
          title: 'Demon Trap Freestyle',
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
  }, []);

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
          tracks: resData.project.tracks.map((t: any) => ({
            ...t,
            effects: typeof t.effects === 'string' ? JSON.parse(t.effects) : t.effects,
          })),
        };

        // Synthesize an initial demo beat buffer for the beat track
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        const { fullBeat } = await generateHipHopBeat(ctx, {
          genre: newProj.genre,
          bpm: newProj.bpm,
          keyScale: newProj.keyScale,
          durationSeconds: 32,
        });

        const beatTrack = newProj.tracks.find((t) => t.layerType === 'BEAT');
        if (beatTrack) {
          beatTrack.audioBuffer = fullBeat;
          beatTrack.duration = fullBeat.duration;
        }

        setProjects((prev) => [newProj, ...prev]);
        setCurrentProject(newProj);
        setCurrentTab('STUDIO');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Project
  const handleOpenProject = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      // Ensure beat audio buffer is synthesized if not loaded
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const beatTrack = proj.tracks.find((t) => t.layerType === 'BEAT' && !t.audioBuffer);
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

      // Update tracks in DB
      for (const t of currentProject.tracks) {
        await fetch('/api/tracks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: t.id,
            name: t.name,
            volume: t.volume,
            pan: t.pan,
            muted: t.muted,
            soloed: t.soloed,
            startTime: t.startTime,
            duration: t.duration,
            effects: t.effects,
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
      title: `${proj.title} (Copy)`,
      genre: proj.genre,
      bpm: proj.bpm,
      keyScale: proj.keyScale,
      projectType: proj.projectType,
      language: proj.language,
    });
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
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

  // Transport Controls
  const handlePlay = () => engineRef.current?.play();
  const handlePause = () => engineRef.current?.pause();
  const handleStop = () => engineRef.current?.stop();
  const handleSeek = (sec: number) => engineRef.current?.seek(sec);

  // Track operations
  const handleUpdateTrack = (trackId: string, updates: Partial<AudioTrackItem>) => {
    if (!currentProject) return;
    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
      };
    });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (!currentProject) return;
    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tracks: prev.tracks.filter((t) => t.id !== trackId),
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

  // Open Recording modal for specific track
  const handleOpenRecordTrack = (trackId: string) => {
    setRecordingTargetTrackId(trackId);
    setRecordingModalOpen(true);
  };

  // Save recorded audio into track
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

  // Import local audio file (WAV, MP3, etc.)
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
      alert('Could not decode audio file. Make sure it is a valid WAV, MP3, or OGG file.');
    }
  };

  // Insert generated beat into timeline
  const handleAddBeatTrack = (buffer: AudioBuffer, title: string, bpm: number) => {
    if (!currentProject) return;

    let beatTrack = currentProject.tracks.find((t) => t.layerType === 'BEAT');
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

  // Apply Rap Flow analysis recommendations
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

  // Sync vocal with beat
  const handleSyncVocalWithBeat = () => {
    if (!currentProject) return;
    const mainVocal = currentProject.tracks.find((t) => t.layerType === 'MAIN_VOCAL');
    const beatTrack = currentProject.tracks.find((t) => t.layerType === 'BEAT');

    if (mainVocal && beatTrack) {
      // Align vocal start to nearest beat downbeat
      const secondsPerBeat = 60 / currentProject.bpm;
      const barDuration = secondsPerBeat * 4;
      const nearestBar = Math.round((mainVocal.startTime || 0) / barDuration) * barDuration;

      handleUpdateTrack(mainVocal.id, { startTime: nearestBar });
      alert(`Synchronized! Main vocal snapped to bar marker at ${nearestBar.toFixed(2)}s.`);
    }
  };

  // Bake offline autotune into buffer
  const handleApplyOfflineAutoTune = (trackId: string) => {
    const track = currentProject?.tracks.find((t) => t.id === trackId);
    if (!track || !track.audioBuffer) return;

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtxClass();
    const tunedBuffer = processAutoTuneBuffer(track.audioBuffer, ctx, track.effects.autoTune);

    handleUpdateTrack(trackId, { audioBuffer: tunedBuffer });
    alert(`Auto-Tune successfully baked into ${track.name}!`);
  };

  // AI Assistant action handler
  const handleApplyAssistantAction = (action: any) => {
    if (!currentProject) return;

    if (action.type === 'UPDATE_FX') {
      const targetTracks = currentProject.tracks.filter(
        (t) => action.layer === 'Master' || t.layerType === action.layer
      );
      for (const t of targetTracks) {
        handleUpdateTrack(t.id, {
          effects: {
            ...t.effects,
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
      {/* Studio Top Transport Header */}
      <StudioHeader
        projectTitle={currentProject?.title || 'AURA RAP STUDIO'}
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
          const mainVocal = currentProject?.tracks.find((t) => t.layerType === 'MAIN_VOCAL');
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
      />

      {/* Main Studio Body: Sidebar + Active Tab Content */}
      <div className="flex-1 flex overflow-hidden">
        <StudioSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Tab 1: Dashboard */}
        {currentTab === 'DASHBOARD' && (
          <DashboardView
            projects={projects}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {/* Tab 2: Multitrack Timeline */}
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

        {/* Tab 3: AI Producer & Beat Generator */}
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

        {/* Tab 4: Vocal Layers Studio */}
        {currentTab === 'VOCAL_LAYERS' && currentProject && (
          <VocalLayersStudio
            tracks={currentProject.tracks}
            onRecordLayer={(layerType) => {
              let track = currentProject.tracks.find((t) => t.layerType === layerType);
              if (!track) {
                handleAddTrack(layerType);
              }
              const target = currentProject.tracks.find((t) => t.layerType === layerType);
              handleOpenRecordTrack(target?.id || '');
            }}
            onOpenFX={() => setCurrentTab('MIXING')}
            onUpdateTrack={handleUpdateTrack}
            onPlay={handlePlay}
          />
        )}

        {/* Tab 5: Mixing & DSP Channel Strip */}
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

        {/* Tab 6: Auto-Tune Pitch Studio */}
        {currentTab === 'AUTOTUNE' && currentProject && (
          <AutoTuneModule
            tracks={currentProject.tracks}
            onUpdateTrackAutoTune={(trackId, autoTuneSettings) => {
              const trk = currentProject.tracks.find((t) => t.id === trackId);
              if (trk) {
                handleUpdateTrack(trackId, {
                  effects: { ...trk.effects, autoTune: autoTuneSettings },
                });
              }
            }}
            onApplyOfflineAutoTune={handleApplyOfflineAutoTune}
          />
        )}

        {/* Tab 7: AI Mastering */}
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

        {/* Tab 8: Beat Library */}
        {currentTab === 'BEAT_LIBRARY' && (
          <BeatLibrary onLoadBeatToTimeline={handleAddBeatTrack} />
        )}

        {/* Tab 9: My Voice Profiles */}
        {currentTab === 'MY_VOICE' && currentProject && (
          <VoiceProfileSection
            currentFX={currentProject.tracks[0]?.effects}
            onApplyProfileFX={(fx) => {
              if (currentProject.tracks[0]) {
                handleUpdateTrack(currentProject.tracks[0].id, { effects: fx });
                alert('Vocal profile FX applied to primary rap vocal track!');
              }
            }}
          />
        )}

        {/* Tab 10: Export Studio */}
        {currentTab === 'EXPORT' && currentProject && (
          <ExportStudio project={currentProject} tracks={currentProject.tracks} />
        )}
      </div>

      {/* Recording Studio Modal */}
      {currentProject && (
        <RecordingModal
          isOpen={recordingModalOpen}
          onClose={() => setRecordingModalOpen(false)}
          targetTrack={currentProject.tracks.find((t) => t.id === recordingTargetTrackId)}
          onSaveRecording={handleSaveRecording}
        />
      )}

      {/* AI Producer Assistant Drawer */}
      {currentProject && (
        <AiMusicAssistant
          isOpen={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
          project={currentProject}
          tracks={currentProject.tracks}
          onApplyAssistantAction={handleApplyAssistantAction}
        />
      )}
    </div>
  );
}

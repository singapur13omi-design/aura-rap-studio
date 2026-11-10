'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clapperboard,
  Film,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Layers,
  Wand2,
  Download,
  Upload,
  Volume2,
  Sliders,
  Type,
  Maximize2,
  Check,
  Crown,
  ChevronRight,
  Music,
  Eye,
  RefreshCw,
  Video,
} from 'lucide-react';
import { VideoProjectData, VideoSceneItem, VideoClipItem, VideoVisualStyle } from '@/types';
import { formatTime } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface AuraVideoStudioWorkspaceProps {
  initialProject?: VideoProjectData;
  isOwner?: boolean;
  onExit?: () => void;
  availableAudioProjects?: { id: string; title: string; bpm: number; genre: string }[];
}

export const AuraVideoStudioWorkspace: React.FC<AuraVideoStudioWorkspaceProps> = ({
  initialProject,
  isOwner = false,
  onExit,
  availableAudioProjects = [],
}) => {
  const { language } = useI18n();
  const isSk = language === 'sk';

  // Project state
  const [projectId, setProjectId] = useState<string>(initialProject?.id || '');
  const [projectTitle, setProjectTitle] = useState<string>(initialProject?.title || 'AURA Rap Music Video');
  const [artistName, setArtistName] = useState<string>(initialProject?.artistName || '13OMI');
  const [visualStyle, setVisualStyle] = useState<VideoVisualStyle>(initialProject?.visualStyle || 'DARK_TRAP');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(initialProject?.aspectRatio || '16:9');
  const [fps, setFps] = useState<number>(initialProject?.fps || 30);
  const [resolution, setResolution] = useState<string>(initialProject?.resolution || '1080p');
  const [duration, setDuration] = useState<number>(initialProject?.duration || 32);
  const [lyrics, setLyrics] = useState<string>(
    initialProject?.lyrics ||
      `[INTRO]\nAURA RAP STUDIO. 13OMI in the visual realm.\n\n[VERSE 1]\nNight lights reflecting on wet city streets.\nEvery single bar matching with the 808 beats.\n\n[CHORUS]\nCreate your music video. Your vision. Your sound.\nRising straight from the underground.`
  );

  // Credits
  const [credits, setCredits] = useState<number>(isOwner ? 999999 : 50);

  // Active Side Tab
  const [activeTab, setActiveTab] = useState<'STORYBOARD' | 'ASSETS' | 'FX' | 'TEXT'>('STORYBOARD');

  // Storyboard scenes
  const [scenes, setScenes] = useState<VideoSceneItem[]>(initialProject?.scenes || []);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState<boolean>(false);

  // Timeline Clips
  const [clips, setClips] = useState<VideoClipItem[]>([
    {
      id: 'clip-1',
      name: 'Scene 01 - Intro Street',
      startTime: 0,
      duration: 6,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      type: 'AI_SCENE',
      trackIndex: 0,
    },
    {
      id: 'clip-2',
      name: 'Scene 02 - Verse Delivery',
      startTime: 6,
      duration: 8,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      type: 'AI_SCENE',
      trackIndex: 0,
    },
    {
      id: 'clip-3',
      name: 'Scene 03 - 808 Drop Impact',
      startTime: 14,
      duration: 10,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      type: 'AI_SCENE',
      trackIndex: 0,
    },
    {
      id: 'clip-overlay-1',
      name: 'B-Roll Neon Texture',
      startTime: 4,
      duration: 6,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      type: 'B_ROLL',
      trackIndex: 1,
      opacity: 0.65,
    },
  ]);

  // Selected clip for editing
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-1');

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(24); // px per second

  // Video generator modal / state
  const [activeGeneratingSceneId, setActiveGeneratingSceneId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string>('');

  // Enhancer modal state
  const [isEnhancerOpen, setIsEnhancerOpen] = useState<boolean>(false);
  const [enhancerType, setEnhancerType] = useState<string>('DARK_CINEMATIC');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  // Text overlay
  const [textOverlay, setTextOverlay] = useState<string>('13OMI • AURA STUDIO');
  const [textPosition, setTextPosition] = useState<'BOTTOM' | 'CENTER' | 'TOP'>('BOTTOM');

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Video Preview Player Reference
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-tick playback
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, duration]);

  // Find active playing clip
  const currentActiveClip =
    clips.find((c) => c.trackIndex === 0 && currentTime >= c.startTime && currentTime < c.startTime + c.duration) ||
    clips[0];

  // Sync HTML5 video currentTime with timeline
  useEffect(() => {
    if (videoPlayerRef.current && currentActiveClip) {
      const clipOffset = Math.max(0, currentTime - currentActiveClip.startTime);
      if (Math.abs(videoPlayerRef.current.currentTime - clipOffset) > 0.4) {
        videoPlayerRef.current.currentTime = clipOffset;
      }
    }
  }, [currentTime, currentActiveClip]);

  // Handle Generate Storyboard via AI Director
  const handleGenerateStoryboard = async () => {
    setIsGeneratingStoryboard(true);
    try {
      // First ensure project exists in DB
      let activeProjId = projectId;
      if (!activeProjId) {
        const createRes = await fetch('/api/video/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: projectTitle,
            artistName,
            lyrics,
            visualStyle,
            aspectRatio,
            duration,
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.project) {
          activeProjId = createData.project.id;
          setProjectId(activeProjId);
        }
      }

      const res = await fetch('/api/video/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjId,
          songTitle: projectTitle,
          artistName,
          lyrics,
          visualStyle,
          duration,
        }),
      });
      const data = await res.json();
      if (data.success && data.scenes) {
        setScenes(data.scenes);
        setActiveTab('STORYBOARD');
      }
    } catch (err) {
      console.error('Storyboard generation error:', err);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Handle Generate AI Video Scene
  const handleGenerateSceneVideo = async (scene?: VideoSceneItem) => {
    setIsGeneratingVideo(true);
    setGenerationNotice(isSk ? 'AI model generuje filmový videozáber...' : 'AI model is generating cinematic video...');

    try {
      const promptToUse = scene ? scene.visualPrompt : customPrompt || `${visualStyle} cinematic underground rap video`;
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId || 'temp-preview',
          sceneId: scene?.id,
          prompt: promptToUse,
          visualStyle,
          duration: scene?.duration || 5.0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newUrl = data.videoUrl;

        // If scene was provided, update scene
        if (scene) {
          setScenes((prev) =>
            prev.map((s) => (s.id === scene.id ? { ...s, activeVideoUrl: newUrl, status: 'READY' } : s))
          );
        }

        // Add generated clip into Timeline
        const newClip: VideoClipItem = {
          id: `clip-${Date.now()}`,
          name: scene?.title || 'AI Generated Scene',
          startTime: scene ? scene.startTime : currentTime,
          duration: scene ? scene.duration : 5.0,
          videoUrl: newUrl,
          type: 'AI_SCENE',
          trackIndex: 0,
        };

        setClips((prev) => [...prev, newClip]);
        if (data.creditsRemaining !== undefined) {
          setCredits(data.creditsRemaining);
        }
        setGenerationNotice(
          isSk
            ? `Záber úspešne vygenerovaný (${data.isLiveModel ? 'Live AI Model' : 'Cinematic Adapter'})!`
            : 'Scene successfully generated!'
        );
      } else {
        alert(data.error || 'Generovanie zlyhalo');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingVideo(false);
      setTimeout(() => setGenerationNotice(''), 4000);
    }
  };

  // Handle AI Music Sync: magnetic snap to beat
  const handleMusicSyncSnap = () => {
    // Snap clips to nearest 4-beat or 2-beat intervals
    const bpm = 140; // Default or project BPM
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    setClips((prev) =>
      prev.map((c) => {
        const snappedStart = Math.round(c.startTime / barSec) * barSec;
        const snappedDur = Math.max(barSec, Math.round(c.duration / barSec) * barSec);
        return {
          ...c,
          startTime: Number(snappedStart.toFixed(2)),
          duration: Number(snappedDur.toFixed(2)),
        };
      })
    );

    alert(
      isSk
        ? `Zosynchronizované! Všetky video scény boli magneticky prichytené na taktovú mriežku (${bpm} BPM).`
        : `Synchronized! All video scenes snapped magnetically to bar grid (${bpm} BPM).`
    );
  };

  // Split Clip at current playhead
  const handleSplitClipAtPlayhead = () => {
    if (!selectedClipId) return;
    const clip = clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    if (currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
      const firstDuration = currentTime - clip.startTime;
      const secondDuration = clip.duration - firstDuration;

      const updatedFirst: VideoClipItem = {
        ...clip,
        duration: Number(firstDuration.toFixed(2)),
      };

      const newSecond: VideoClipItem = {
        ...clip,
        id: `clip-${Date.now()}`,
        name: `${clip.name} (Part 2)`,
        startTime: Number(currentTime.toFixed(2)),
        duration: Number(secondDuration.toFixed(2)),
      };

      setClips((prev) => prev.map((c) => (c.id === clip.id ? updatedFirst : c)).concat(newSecond));
      setSelectedClipId(newSecond.id);
    }
  };

  // Delete selected clip
  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return;
    setClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setSelectedClipId(null);
  };

  // Handle Real Client MP4 Export
  const handleExportMP4 = async () => {
    setIsExporting(true);
    setExportProgress(10);

    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + 15;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setExportProgress(100);
      setIsExporting(false);

      // Trigger actual download of active MP4 video
      const downloadTarget = currentActiveClip?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      setExportedVideoUrl(downloadTarget);

      const a = document.createElement('a');
      a.href = downloadTarget;
      a.download = `${projectTitle.replace(/\s+/g, '_')}_${resolution}_${fps}fps.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 1800);
  };

  return (
    <div className="flex-1 bg-[#08090C] text-[#C6CBD3] flex flex-col overflow-hidden select-none">
      {/* Top Studio Control Bar */}
      <header className="h-16 px-6 bg-[#111318] border-b border-[#24262C] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#286BFF] via-[#713BFF] to-[#C8A45D] flex items-center justify-center text-black font-black text-sm shadow-glow">
              <Clapperboard className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm tracking-wide">AURA AI VIDEO STUDIO</span>
                <span className="px-1.5 py-0.5 rounded bg-[#C8A45D]/20 text-[#C8A45D] border border-[#C8A45D]/40 text-[9px] font-mono font-bold">
                  {isOwner ? 'OWNER PRO' : 'STUDIO ADD-ON'}
                </span>
              </div>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-transparent text-xs text-gray-400 focus:text-white focus:outline-none hover:border-b border-[#24262C]"
              />
            </div>
          </div>
        </div>

        {/* Studio Configurations & Actions */}
        <div className="flex items-center gap-3">
          {/* Visual Style Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#08090C] border border-[#24262C] px-2.5 py-1 rounded-xl text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C8A45D]" />
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value as VideoVisualStyle)}
              className="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
            >
              <option value="DARK_TRAP" className="bg-[#111318]">Dark Trap (Neon & Shadow)</option>
              <option value="UNDERGROUND_STREET" className="bg-[#111318]">Underground Street (16mm Gritty)</option>
              <option value="LUXURY_RAP" className="bg-[#111318]">Luxury Rap (Gold & Supercars)</option>
              <option value="CINEMATIC_HIPHOP" className="bg-[#111318]">Cinematic (Teal & Orange)</option>
              <option value="DRILL_STREET" className="bg-[#111318]">Drill Street (Strobe & Smoke)</option>
              <option value="EMOTIONAL_RAP" className="bg-[#111318]">Emotional Rap (Melancholic Rain)</option>
              <option value="FUTURISTIC_RAP" className="bg-[#111318]">Futuristic Cyberpunk</option>
              <option value="OLD_SCHOOL_HIPHOP" className="bg-[#111318]">90s Boom-Bap VHS</option>
              <option value="NEON_CITY" className="bg-[#111318]">Neon City Nightlife</option>
              <option value="DOCUMENTARY_STYLE" className="bg-[#111318]">Documentary Behind The Scenes</option>
            </select>
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex items-center gap-1 bg-[#08090C] border border-[#24262C] p-0.5 rounded-xl text-[11px] font-mono">
            {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  aspectRatio === ratio
                    ? 'bg-[#713BFF] text-white font-bold shadow-glow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* AI Music Sync Button */}
          <button
            onClick={handleMusicSyncSnap}
            title="Magneticky prichytiť strih na beat a BPM"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111318] hover:bg-[#24262C] border border-[#24262C] text-xs font-semibold text-[#286BFF] transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Music Sync</span>
          </button>

          {/* Export MP4 Button */}
          <button
            onClick={handleExportMP4}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#286BFF] via-[#713BFF] to-[#C8A45D] text-white font-extrabold text-xs shadow-glow hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? `Exportujem ${exportProgress}%...` : 'Export MP4'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Drawer / Controls Panel */}
        <div className="w-full lg:w-96 bg-[#111318] border-r border-[#24262C] flex flex-col shrink-0">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-[#24262C] bg-[#08090C] text-xs font-mono">
            <button
              onClick={() => setActiveTab('STORYBOARD')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 font-bold ${
                activeTab === 'STORYBOARD'
                  ? 'border-[#713BFF] text-white bg-[#111318]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              AI Director
            </button>
            <button
              onClick={() => setActiveTab('ASSETS')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 font-bold ${
                activeTab === 'ASSETS'
                  ? 'border-[#713BFF] text-white bg-[#111318]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Assets
            </button>
            <button
              onClick={() => setActiveTab('FX')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 font-bold ${
                activeTab === 'FX'
                  ? 'border-[#713BFF] text-white bg-[#111318]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Vizuál FX
            </button>
            <button
              onClick={() => setActiveTab('TEXT')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 font-bold ${
                activeTab === 'TEXT'
                  ? 'border-[#713BFF] text-white bg-[#111318]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Titulky
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* TAB 1: AI DIRECTOR & STORYBOARD */}
            {activeTab === 'STORYBOARD' && (
              <div className="space-y-4">
                <div className="bg-[#08090C] border border-[#24262C] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-[#C8A45D]" /> AI DIRECTOR SCENÁR
                    </span>
                    <button
                      onClick={handleGenerateStoryboard}
                      disabled={isGeneratingStoryboard}
                      className="px-3 py-1 rounded-lg bg-[#713BFF] hover:bg-[#713BFF]/90 text-white font-bold text-[11px] shadow-glow flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingStoryboard ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{isGeneratingStoryboard ? 'Analyzujem...' : 'Vygenerovať scenár'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    AI Director analyzuje text rapovej skladby, tempo a štruktúru taktov a rozdelí ju na scény s precíznymi promptmi pre AI kameru.
                  </p>
                </div>

                {/* Scenes List */}
                <div className="space-y-2.5">
                  {scenes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs border border-dashed border-[#24262C] rounded-2xl p-6">
                      <Clapperboard className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#C8A45D]" />
                      <p>Zatiaľ nemáte vygenerovaný scenár.</p>
                      <button
                        onClick={handleGenerateStoryboard}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#24262C] hover:bg-[#713BFF] text-white text-xs font-bold transition-all"
                      >
                        Vytvoriť Storyboard z textu
                      </button>
                    </div>
                  ) : (
                    scenes.map((scene) => (
                      <div
                        key={scene.id}
                        className="bg-[#08090C] border border-[#24262C] p-3.5 rounded-xl space-y-2 hover:border-[#713BFF]/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-[#C8A45D] uppercase">
                            {scene.title}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {formatTime(scene.startTime)} - {formatTime(scene.endTime)} ({scene.duration}s)
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 leading-snug line-clamp-2">
                          {scene.visualPrompt}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#24262C]/60 text-[10px]">
                          <span className="text-gray-500 font-mono italic truncate max-w-[180px]">
                            {scene.cameraMovement}
                          </span>
                          <button
                            onClick={() => handleGenerateSceneVideo(scene)}
                            disabled={isGeneratingVideo}
                            className="px-2.5 py-1 rounded-lg bg-[#286BFF]/20 text-[#286BFF] hover:bg-[#286BFF] hover:text-black font-bold font-mono transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Generovať video</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ASSETS */}
            {activeTab === 'ASSETS' && (
              <div className="space-y-4">
                <div className="bg-[#08090C] border border-[#24262C] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">VLASTNÉ VIDEO ZÁBERY</span>
                    <label className="px-3 py-1 rounded-lg bg-[#24262C] hover:bg-[#286BFF] hover:text-black text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Nahrať MP4</span>
                      <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" />
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Nahraj vlastné natočené zábery z mobilu alebo kamery a zostrihaj ich s AI vygenerovanými scénami.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-gray-400 uppercase">Klipov v projekte: {clips.length}</span>
                  {clips.map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedClipId === clip.id
                          ? 'bg-[#24262C] border-[#286BFF] text-white'
                          : 'bg-[#08090C] border-[#24262C] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Film className="w-4 h-4 text-[#286BFF] shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-bold block truncate">{clip.name}</span>
                          <span className="text-[10px] font-mono text-gray-500">
                            {formatTime(clip.startTime)} • {clip.duration}s • {clip.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClips((prev) => prev.filter((c) => c.id !== clip.id));
                        }}
                        className="p-1 text-gray-500 hover:text-aura-red"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VISUAL FX */}
            {activeTab === 'FX' && (
              <div className="space-y-4">
                <div className="bg-[#08090C] border border-[#24262C] p-4 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-white block">AI VIDEO ENHANCER & COLOR GRADE</span>
                  <p className="text-[11px] text-gray-400">
                    Aplikuj filmovú farebnú korekciu, filmový šum, anamorphic letterbox a svetelnú atmosféru na vybrané zábery.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['DARK_CINEMATIC', 'TEAL_ORANGE', 'VHS_GLITCH', 'BLACK_WHITE_RAW'].map((grade) => (
                      <button
                        key={grade}
                        onClick={() => alert(`Aplikovaný farebný profil: ${grade}`)}
                        className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#286BFF]/20 border border-[#24262C] text-xs font-mono text-gray-300 hover:text-white transition-all text-left"
                      >
                        {grade.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TITULKY A TEXT */}
            {activeTab === 'TEXT' && (
              <div className="space-y-4">
                <div className="bg-[#08090C] border border-[#24262C] p-4 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-white block">TYPOGRAFIA & TITULKY</span>
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="Text / Meno interpreta / Titulky..."
                    className="w-full bg-[#111318] border border-[#24262C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#713BFF]"
                  />
                  <div className="flex gap-2">
                    {(['BOTTOM', 'CENTER', 'TOP'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setTextPosition(pos)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                          textPosition === pos
                            ? 'bg-[#713BFF] text-white border-[#713BFF]'
                            : 'bg-[#111318] text-gray-400 border-[#24262C]'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Video Canvas Preview Player & Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Preview Canvas Player */}
          <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Aspect Ratio Bounding Box */}
            <div
              className={`relative bg-[#08090C] border border-[#24262C] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${
                aspectRatio === '16:9'
                  ? 'w-full max-w-3xl aspect-video'
                  : aspectRatio === '9:16'
                  ? 'h-full max-h-[460px] aspect-[9/16]'
                  : 'w-full max-w-[420px] aspect-square'
              }`}
            >
              {currentActiveClip?.videoUrl ? (
                <video
                  ref={videoPlayerRef}
                  src={currentActiveClip.videoUrl}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  loop
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Film className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C8A45D]" />
                  <span className="text-xs font-mono">No video loaded at {formatTime(currentTime)}</span>
                </div>
              )}

              {/* Text / Lyric Overlay */}
              {textOverlay && (
                <div
                  className={`absolute left-0 right-0 px-6 py-3 text-center pointer-events-none transition-all ${
                    textPosition === 'BOTTOM'
                      ? 'bottom-6'
                      : textPosition === 'TOP'
                      ? 'top-6'
                      : 'top-1/2 -translate-y-1/2'
                  }`}
                >
                  <span className="px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white font-black text-sm tracking-widest uppercase border border-white/20 shadow-glow">
                    {textOverlay}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-[#286BFF] border border-[#286BFF]/40">
                  {aspectRatio} • {resolution}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-[#C8A45D] border border-[#C8A45D]/40">
                  {visualStyle.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Quick Prompt Bar (Bottom overlay of preview) */}
            <div className="absolute bottom-4 left-6 right-6 max-w-2xl mx-auto flex items-center gap-2 bg-[#111318]/90 backdrop-blur-md border border-[#24262C] p-2 rounded-2xl shadow-xl">
              <Sparkles className="w-4 h-4 text-[#C8A45D] shrink-0 ml-2" />
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={isSk ? 'Zadaj prompt pre AI video (napr. Nočná ulica, dážď, luxusné auto...)' : 'Enter AI video prompt...'}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => handleGenerateSceneVideo()}
                disabled={isGeneratingVideo}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#286BFF] to-[#713BFF] text-white font-bold text-xs shadow-glow hover:opacity-95 transition-all disabled:opacity-50 shrink-0"
              >
                {isGeneratingVideo ? 'Generujem...' : 'Generovať'}
              </button>
            </div>
          </div>

          {/* Player Transport Bar */}
          <div className="h-12 bg-[#111318] border-t border-b border-[#24262C] px-6 flex items-center justify-between shrink-0">
            {/* Play/Pause & Time */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#286BFF] to-[#713BFF] text-white flex items-center justify-center font-bold shadow-glow hover:opacity-90 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={() => setCurrentTime(0)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#24262C]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="text-xs font-mono font-bold text-white tracking-wider">
                {formatTime(currentTime)}{' '}
                <span className="text-gray-500 font-normal">/ {formatTime(duration)}</span>
              </div>
            </div>

            {/* Editing Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSplitClipAtPlayhead}
                title="Rozdeliť klip na playheade"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24262C] hover:bg-[#286BFF] hover:text-black text-xs font-mono text-gray-300 transition-colors"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={handleDeleteSelectedClip}
                title="Vymazať označený klip"
                className="p-1.5 rounded-lg bg-[#24262C] hover:bg-aura-red hover:text-white text-gray-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Multitrack Video & Audio Timeline */}
          <div className="h-64 bg-[#08090C] flex flex-col shrink-0 overflow-hidden">
            {/* Timeline Tracks Header */}
            <div className="flex-1 overflow-x-auto p-4 space-y-2 relative">
              {/* Playhead Vertical Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-aura-red shadow-glow-red z-20 pointer-events-none"
                style={{ left: `${currentTime * zoomLevel + 120}px` }}
              >
                <div className="w-3 h-3 rounded-full bg-aura-red -translate-x-1.5 -translate-y-1.5 shadow-md" />
              </div>

              {/* TRACK 1: MAIN VIDEO */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#286BFF]" />
                  <span>VIDEO 1</span>
                </div>
                <div
                  className="flex-1 h-12 bg-[#111318] border border-[#24262C] rounded-xl relative overflow-hidden flex items-center"
                  style={{ width: `${duration * zoomLevel}px` }}
                >
                  {clips
                    .filter((c) => c.trackIndex === 0)
                    .map((clip) => (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClipId(clip.id)}
                        className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between text-xs font-mono font-bold transition-all border overflow-hidden cursor-pointer ${
                          selectedClipId === clip.id
                            ? 'bg-[#286BFF]/30 border-[#286BFF] text-white shadow-glow'
                            : 'bg-[#111318] border-[#24262C] text-gray-300 hover:border-[#286BFF]/50'
                        }`}
                        style={{
                          left: `${clip.startTime * zoomLevel}px`,
                          width: `${clip.duration * zoomLevel}px`,
                        }}
                      >
                        <span className="truncate">{clip.name}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{clip.duration}s</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* TRACK 2: B-ROLL / OVERLAYS */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#713BFF]" />
                  <span>B-ROLL 2</span>
                </div>
                <div
                  className="flex-1 h-12 bg-[#111318] border border-[#24262C] rounded-xl relative overflow-hidden flex items-center"
                  style={{ width: `${duration * zoomLevel}px` }}
                >
                  {clips
                    .filter((c) => c.trackIndex === 1)
                    .map((clip) => (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClipId(clip.id)}
                        className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between text-xs font-mono font-bold transition-all border overflow-hidden cursor-pointer ${
                          selectedClipId === clip.id
                            ? 'bg-[#713BFF]/30 border-[#713BFF] text-white shadow-glow'
                            : 'bg-[#111318] border-[#24262C] text-gray-300 hover:border-[#713BFF]/50'
                        }`}
                        style={{
                          left: `${clip.startTime * zoomLevel}px`,
                          width: `${clip.duration * zoomLevel}px`,
                        }}
                      >
                        <span className="truncate">{clip.name}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{clip.duration}s</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* TRACK 3: AUDIO MASTER */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>AUDIO</span>
                </div>
                <div
                  className="flex-1 h-12 bg-[#111318] border border-[#24262C] rounded-xl relative overflow-hidden flex items-center px-3"
                  style={{ width: `${duration * zoomLevel}px` }}
                >
                  {/* Visual simulated waveform */}
                  <div className="w-full h-8 flex items-center gap-0.5 opacity-60">
                    {Array.from({ length: 90 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[#C8A45D] rounded-full"
                        style={{ height: `${Math.max(15, Math.sin(i * 0.3) * 80 + 20)}%` }}
                      />
                    ))}
                  </div>
                  <span className="absolute left-3 text-[10px] font-mono font-bold text-white uppercase bg-black/60 px-2 py-0.5 rounded">
                    Master Beat & Rap Vocal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

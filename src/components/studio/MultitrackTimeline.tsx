'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Volume2,
  Sliders,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
  Scissors,
  Mic,
} from 'lucide-react';
import { AudioTrackItem, LayerType } from '@/types';
import { formatTime } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface MultitrackTimelineProps {
  tracks: AudioTrackItem[];
  currentTime: number;
  duration: number;
  bpm: number;
  onSeek: (seconds: number) => void;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrackItem>) => void;
  onDeleteTrack: (trackId: string) => void;
  onAddTrack: (layerType?: LayerType) => void;
  onOpenFX: (trackId: string) => void;
  onRecordTrack: (trackId: string) => void;
  onImportAudio: (trackId: string, file: File) => void;
}

export const MultitrackTimeline: React.FC<MultitrackTimelineProps> = ({
  tracks,
  currentTime,
  duration,
  bpm,
  onSeek,
  onUpdateTrack,
  onDeleteTrack,
  onAddTrack,
  onOpenFX,
  onRecordTrack,
  onImportAudio,
}) => {
  const { t } = useI18n();
  const [zoomLevel, setZoomLevel] = useState<number>(40); // pixels per second
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [originalStartTime, setOriginalStartTime] = useState<number>(0);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetImportTrackId, setTargetImportTrackId] = useState<string | null>(null);

  const totalTimelineDuration = Math.max(60, duration + 20);
  const timelinePixelWidth = totalTimelineDuration * zoomLevel;

  // Handle timeline ruler click to seek
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekSec = Math.max(0, clickX / zoomLevel);
    onSeek(seekSec);
  };

  // Dragging audio clip along timeline
  const handleClipMouseDown = (track: AudioTrackItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingTrackId(track.id);
    setDragStartX(e.clientX);
    setOriginalStartTime(track.startTime || 0);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingTrackId) return;
      const dx = e.clientX - dragStartX;
      const dt = dx / zoomLevel;
      const newStartTime = Math.max(0, originalStartTime + dt);
      onUpdateTrack(draggingTrackId, { startTime: newStartTime });
    };

    const handleMouseUp = () => {
      setDraggingTrackId(null);
    };

    if (draggingTrackId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTrackId, dragStartX, originalStartTime, zoomLevel, onUpdateTrack]);

  // Handle file import
  const triggerImport = (trackId: string) => {
    setTargetImportTrackId(trackId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && targetImportTrackId) {
      onImportAudio(targetImportTrackId, files[0]);
    }
  };

  // Split clip at current playhead
  const splitClipAtPlayhead = (track: AudioTrackItem) => {
    const splitPoint = currentTime - track.startTime;
    if (splitPoint > 0.5 && track.duration && splitPoint < track.duration - 0.5) {
      onUpdateTrack(track.id, { duration: splitPoint });
      onAddTrack(track.layerType);
    }
  };

  const playheadPx = currentTime * zoomLevel;

  return (
    <div className="flex-1 flex flex-col bg-surface-300 overflow-hidden select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.wav,.mp3,.flac,.ogg,.m4a"
        className="hidden"
      />

      {/* Timeline Toolbar */}
      <div className="h-10 bg-surface-200 border-b border-surface-50/20 px-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddTrack('MAIN_VOCAL')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-aura-blue/20 hover:bg-aura-blue/30 text-aura-blue border border-aura-blue/30 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t.addTrack}
          </button>

          <span className="text-surface-50">|</span>

          <span className="font-mono text-[11px] text-gray-400">
            {tracks.length} {t.tracksCount}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-surface-100 px-2 py-0.5 rounded border border-surface-50/30">
          <button
            onClick={() => setZoomLevel((z) => Math.max(15, z - 10))}
            className="p-1 hover:text-white"
            title={t.zoomOut}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] w-8 text-center">{zoomLevel}px</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(120, z + 15))}
            className="p-1 hover:text-white"
            title={t.zoomIn}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Multitrack Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Track Controls */}
        <div className="w-56 md:w-72 bg-surface-200 border-r border-surface-50/30 flex flex-col shrink-0 overflow-y-auto">
          <div className="h-8 bg-surface-100 border-b border-surface-50/30 px-3 flex items-center text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            {t.yourProjects}
          </div>

          <div className="divide-y divide-surface-50/20">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-24 p-2.5 flex flex-col justify-between bg-surface-200/50 hover:bg-surface-200 transition-colors"
              >
                {/* Track Title */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: track.color }}
                    />
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })}
                      className="bg-transparent font-medium text-xs text-white truncate focus:outline-none focus:bg-surface-100 px-1 rounded"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenFX(track.id)}
                      title={t.dspFxRack}
                      className="p-1 text-gray-400 hover:text-aura-blue hover:bg-surface-100 rounded"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTrack(track.id)}
                      title={t.deleteTrack}
                      className="p-1 text-gray-400 hover:text-aura-red hover:bg-surface-100 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Track Controls */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <button
                      onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        track.muted
                          ? 'bg-aura-red text-black'
                          : 'bg-surface-100 text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.mute}
                    </button>

                    <button
                      onClick={() => onUpdateTrack(track.id, { soloed: !track.soloed })}
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        track.soloed
                          ? 'bg-aura-gold text-black'
                          : 'bg-surface-100 text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.solo}
                    </button>

                    <button
                      onClick={() => onRecordTrack(track.id)}
                      title={t.recArm}
                      className="p-1 rounded bg-surface-100 text-gray-400 hover:text-aura-red hover:bg-aura-red/20 transition-colors"
                    >
                      <Mic className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => triggerImport(track.id)}
                      title={t.importAudio}
                      className="p-1 rounded bg-surface-100 text-gray-400 hover:text-aura-blue hover:bg-aura-blue/20 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 flex-1 max-w-[80px]">
                    <Volume2 className="w-3 h-3 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) =>
                        onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 accent-aura-blue bg-surface-50 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pan */}
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>{t.pan}</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={track.pan}
                    onChange={(e) =>
                      onUpdateTrack(track.id, { pan: parseFloat(e.target.value) })
                    }
                    className="w-20 h-1 accent-aura-purple bg-surface-50 rounded cursor-pointer"
                  />
                  <span>
                    {track.pan === 0
                      ? 'C'
                      : track.pan < 0
                      ? `L${Math.abs(Math.round(track.pan * 100))}`
                      : `R${Math.round(track.pan * 100)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Timeline Lanes */}
        <div
          ref={timelineContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#090a0e]"
        >
          <div
            onClick={handleRulerClick}
            className="h-8 bg-surface-200 border-b border-surface-50/40 relative cursor-pointer sticky top-0 z-20"
            style={{ width: `${timelinePixelWidth}px` }}
          >
            {Array.from({ length: Math.ceil(totalTimelineDuration) }).map((_, sec) => {
              const x = sec * zoomLevel;
              const isBar = sec % 2 === 0;
              return (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-surface-50/30 flex items-end pb-1 pl-1 text-[9px] font-mono text-gray-500 pointer-events-none"
                  style={{ left: `${x}px` }}
                >
                  {isBar && <span>{sec}s</span>}
                </div>
              );
            })}

            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 z-30 pointer-events-none flex flex-col items-center"
              style={{ left: `${playheadPx}px` }}
            >
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-aura-blue" />
            </div>
          </div>

          <div
            className="relative divide-y divide-surface-50/20"
            style={{ width: `${timelinePixelWidth}px` }}
          >
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-aura-blue z-20 pointer-events-none shadow-glow"
              style={{ left: `${playheadPx}px` }}
            />

            {tracks.map((track) => {
              const clipStartPx = (track.startTime || 0) * zoomLevel;
              const clipWidthPx = Math.max(
                40,
                (track.duration || (track.audioBuffer?.duration ?? 10)) * zoomLevel
              );

              return (
                <div
                  key={track.id}
                  className="h-24 relative bg-surface-300/40 border-b border-surface-50/10"
                >
                  <div
                    onMouseDown={(e) => handleClipMouseDown(track, e)}
                    className="absolute top-2 bottom-2 rounded-lg border flex flex-col justify-between overflow-hidden cursor-move transition-shadow"
                    style={{
                      left: `${clipStartPx}px`,
                      width: `${clipWidthPx}px`,
                      backgroundColor: `${track.color}18`,
                      borderColor: `${track.color}60`,
                    }}
                  >
                    <div
                      className="px-2 py-0.5 text-[10px] font-mono flex items-center justify-between text-white font-medium"
                      style={{ backgroundColor: `${track.color}40` }}
                    >
                      <span className="truncate">{track.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          splitClipAtPlayhead(track);
                        }}
                        title={t.splitClip}
                        className="hover:text-aura-blue"
                      >
                        <Scissors className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-1 overflow-hidden">
                      {track.audioBuffer ? (
                        <div className="w-full h-12 flex items-center justify-around gap-0.5 opacity-80">
                          {Array.from({ length: Math.min(80, Math.floor(clipWidthPx / 4)) }).map(
                            (_, barIdx) => {
                              const height = Math.min(
                                100,
                                Math.max(15, ((barIdx * 37) % 85) + 15)
                              );
                              return (
                                <div
                                  key={barIdx}
                                  className="w-1 rounded-full"
                                  style={{
                                    height: `${height}%`,
                                    backgroundColor: track.color,
                                  }}
                                />
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                          <span>{t.emptyTrackHelp}</span>
                        </div>
                      )}
                    </div>

                    <div className="px-2 py-0.5 text-[9px] font-mono text-gray-400 flex justify-between bg-black/30">
                      <span>{formatTime(track.startTime || 0)}</span>
                      <span>
                        {formatTime(
                          (track.startTime || 0) +
                            (track.duration || (track.audioBuffer?.duration ?? 0))
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

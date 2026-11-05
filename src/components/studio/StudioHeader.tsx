'use client';

import React from 'react';
import {
  Play,
  Pause,
  Square,
  Circle,
  Volume2,
  Clock,
  Sparkles,
  CheckCircle2,
  Save,
  Sliders,
  Music,
} from 'lucide-react';
import { formatTime, formatBarsBeats } from '@/lib/utils';
import { NOTE_NAMES } from '@/lib/audio/autotune';

interface StudioHeaderProps {
  projectTitle: string;
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  keyScale: string;
  masterVolume: number;
  metronomeOn: boolean;
  masterPeakDb: number;
  isSaving: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecordClick: () => void;
  onBpmChange: (bpm: number) => void;
  onKeyScaleChange: (keyScale: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMetronome: () => void;
  onToggleAiAssistant: () => void;
  onSaveProject: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  projectTitle,
  isPlaying,
  currentTime,
  bpm,
  keyScale,
  masterVolume,
  metronomeOn,
  masterPeakDb,
  isSaving,
  onPlay,
  onPause,
  onStop,
  onRecordClick,
  onBpmChange,
  onKeyScaleChange,
  onMasterVolumeChange,
  onToggleMetronome,
  onToggleAiAssistant,
  onSaveProject,
}) => {
  // Metronome visual pulse calculation
  const secondsPerBeat = 60 / bpm;
  const isBeatPulse = isPlaying && metronomeOn && (currentTime % secondsPerBeat) < 0.1;

  // VU meter percentage (-60dB to 0dB)
  const vuPercent = Math.max(0, Math.min(100, ((masterPeakDb + 60) / 60) * 100));
  const isClipping = masterPeakDb >= -0.3;

  return (
    <header className="h-16 bg-surface-200 border-b border-surface-50/20 px-4 flex items-center justify-between select-none z-30">
      {/* Left: Project title & save indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-aura-blue animate-pulse-glow" />
          <h1 className="font-bold text-white text-sm md:text-base tracking-wide truncate max-w-[180px] md:max-w-xs">
            {projectTitle}
          </h1>
        </div>

        <button
          onClick={onSaveProject}
          title="Save Project"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100 hover:bg-surface-50 text-xs text-gray-300 border border-surface-50/40 transition-colors"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-aura-blue border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 text-aura-blue" />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Saved'}</span>
        </button>
      </div>

      {/* Center: Main Transport Controls */}
      <div className="flex items-center gap-2 md:gap-4 bg-surface-300/80 px-3 py-1.5 rounded-xl border border-surface-50/30">
        {/* Playhead Stop / Return */}
        <button
          onClick={onStop}
          title="Stop & Rewind"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Play / Pause Toggle */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play'}
          className="p-2.5 rounded-lg bg-aura-blue/20 text-aura-blue hover:bg-aura-blue/30 border border-aura-blue/40 transition-all shadow-glow"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Record Arm Button */}
        <button
          onClick={onRecordClick}
          title="Open Vocal Recording Studio"
          className="p-2 rounded-lg text-aura-red hover:bg-aura-red/20 border border-aura-red/30 transition-colors flex items-center gap-1.5 px-3"
        >
          <Circle className="w-4 h-4 fill-current animate-pulse" />
          <span className="text-xs font-semibold hidden md:inline">REC VOCAL</span>
        </button>

        {/* Time & Bar Display */}
        <div className="flex flex-col items-center px-2 py-0.5 bg-black/50 rounded border border-surface-50/40 font-mono text-center">
          <span className="text-xs md:text-sm text-white font-bold tracking-wider">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-gray-400">
            BAR {formatBarsBeats(currentTime, bpm)}
          </span>
        </div>

        {/* BPM & Metronome */}
        <div className="flex items-center gap-2 pl-1 border-l border-surface-50/40">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-gray-400 hidden lg:inline">BPM</span>
            <input
              type="number"
              value={bpm}
              onChange={(e) => onBpmChange(Math.max(60, Math.min(200, Number(e.target.value))))}
              className="w-14 px-1.5 py-0.5 bg-surface-100 border border-surface-50/40 rounded text-center text-xs font-mono text-white focus:outline-none focus:border-aura-blue"
            />
          </div>

          <button
            onClick={onToggleMetronome}
            title="Toggle Metronome"
            className={`p-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
              metronomeOn
                ? isBeatPulse
                  ? 'bg-aura-blue text-black font-bold'
                  : 'bg-surface-50 text-aura-blue border border-aura-blue/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLICK</span>
          </button>
        </div>
      </div>

      {/* Right: Master Output, VU Meter & AI Assistant Button */}
      <div className="flex items-center gap-3">
        {/* Master Volume Knob / Fader & VU meter */}
        <div className="hidden lg:flex items-center gap-2 bg-surface-300 px-2.5 py-1 rounded-lg border border-surface-50/30">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1.5 accent-aura-blue bg-surface-50 rounded-lg cursor-pointer"
          />

          {/* Master VU Meter Bar */}
          <div className="w-16 h-2.5 bg-black/60 rounded overflow-hidden flex items-center p-0.5 border border-surface-50/30">
            <div
              className={`h-full rounded-sm transition-all duration-75 ${
                isClipping ? 'bg-aura-red' : vuPercent > 80 ? 'bg-aura-gold' : 'bg-aura-green'
              }`}
              style={{ width: `${vuPercent}%` }}
            />
          </div>
        </div>

        {/* AI Assistant Pill */}
        <button
          onClick={onToggleAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-aura-purple/30 to-aura-blue/20 hover:from-aura-purple/40 hover:to-aura-blue/30 border border-aura-purple/50 text-white text-xs font-medium transition-all shadow-glow-purple"
        >
          <Sparkles className="w-3.5 h-3.5 text-aura-blue animate-pulse" />
          <span className="hidden sm:inline">AI Producer</span>
        </button>
      </div>
    </header>
  );
};

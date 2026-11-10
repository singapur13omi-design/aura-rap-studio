'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Music2,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface TrackItem {
  id: string;
  name: string;
  layerType: string;
  assetUrl?: string | null;
  duration?: number;
}

interface PublicTrackPlayerProps {
  projectTitle: string;
  genre: string;
  bpm: number;
  keyScale: string;
  artistName: string;
  tracks: TrackItem[];
  projectDuration: number;
}

export const PublicTrackPlayer: React.FC<PublicTrackPlayerProps> = ({
  projectTitle,
  genre,
  bpm,
  keyScale,
  artistName,
  tracks,
  projectDuration,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Find the primary audio asset url (main vocal or first track with assetUrl)
  const playableTrack = tracks.find((t) => t.assetUrl) || tracks[0];
  const audioUrl = playableTrack?.assetUrl || null;
  const duration = playableTrack?.duration || projectDuration || 32;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) {
      // Procedural fallback simulator for tracks without cloud asset
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  // Mock progress ticker if no static file URL
  useEffect(() => {
    if (!audioRef.current && isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.2;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (newVol > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate 40 pseudo waveform bars
  const waveformBars = Array.from({ length: 48 }, (_, i) => {
    const height = Math.max(15, Math.sin(i * 0.45) * 60 + Math.cos(i * 0.2) * 25 + 25);
    return Math.min(100, Math.round(height));
  });

  return (
    <div className="w-full bg-surface-200/90 backdrop-blur-xl border border-surface-50/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-aura-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-aura-red/15 rounded-full blur-3xl pointer-events-none" />

      {/* Track Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-aura-red/20 text-aura-red border border-aura-red/40 text-[10px] font-mono font-bold tracking-wider uppercase">
              {genre.replace('_', ' ')}
            </span>
            <span className="text-xs font-mono font-bold text-gray-300">
              {bpm} BPM • {keyScale}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {projectTitle}
          </h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>By <span className="text-aura-blue font-bold">{artistName || 'AURA Artist'}</span></span>
            <span>•</span>
            <span className="text-gray-500 font-mono">Mastered in AURA RAP STUDIO</span>
          </p>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-50/60 text-xs font-semibold text-gray-200 hover:text-white transition-all shadow-md"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-aura-green" /> : <Share2 className="w-3.5 h-3.5 text-aura-blue" />}
          <span>{copied ? 'Odkaz skopírovaný!' : 'Zdieľať track'}</span>
        </button>
      </div>

      {/* Visual Waveform Representation */}
      <div className="relative mb-6">
        <div className="h-24 sm:h-28 flex items-end justify-between gap-1 px-1 py-2 bg-black/40 rounded-2xl border border-surface-50/20 overflow-hidden">
          {waveformBars.map((h, idx) => {
            const barProgress = (idx / waveformBars.length) * 100;
            const isPlayed = barProgress <= progressPercent;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? 'bg-gradient-to-t from-aura-blue to-aura-purple shadow-glow'
                    : 'bg-surface-50/40 hover:bg-surface-50/70'
                }`}
                style={{
                  height: `${h}%`,
                  transform: isPlaying && isPlayed ? 'scaleY(1.08)' : 'scaleY(1)',
                }}
              />
            );
          })}
        </div>

        {/* Scrub Slider Overlay */}
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Prehrať od pozície"
        />
      </div>

      {/* Time & Playback Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Play / Pause & Times */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-aura-blue to-aura-purple hover:opacity-90 text-black flex items-center justify-center font-black shadow-glow transition-all active:scale-95 shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current text-black" />
            ) : (
              <Play className="w-6 h-6 fill-current text-black ml-0.5" />
            )}
          </button>

          <div>
            <div className="text-lg font-mono font-bold text-white tracking-wider">
              {formatTime(currentTime)}{' '}
              <span className="text-gray-500 text-xs font-normal">/ {formatTime(duration)}</span>
            </div>
            <div className="text-[10px] text-aura-green font-mono uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-aura-green animate-pulse" />
              {isPlaying ? 'Hrá teraz' : 'Pripravené na prehrávanie'}
            </div>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={toggleMute}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-aura-red" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-300" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 sm:w-28 h-1.5 accent-aura-blue bg-surface-50 rounded-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

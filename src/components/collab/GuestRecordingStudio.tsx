'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Circle,
  Volume2,
  Mic,
  Upload,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
  Layers,
  Clock,
  Sparkles,
  Shield,
  FileAudio,
  Hash,
  ChevronRight,
} from 'lucide-react';
import { audioBufferToWavBlob, calculateAudioChecksum } from '@/lib/audio/lossless';
import { formatTime } from '@/lib/utils';
import { CollaborationItem } from '@/types';

interface GuestRecordingStudioProps {
  collab: CollaborationItem;
  currentUserId?: string;
  onVocalSubmitted?: () => void;
  onClose?: () => void;
}

interface RecordedTake {
  id: string;
  name: string;
  blob: Blob;
  audioBuffer: AudioBuffer;
  duration: number;
  timelineOffset: number;
  checksum: string;
  sampleRate: number;
  createdAt: number;
}

export const GuestRecordingStudio: React.FC<GuestRecordingStudioProps> = ({
  collab,
  currentUserId,
  onVocalSubmitted,
  onClose,
}) => {
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(collab.project?.duration || 32);

  // Reference track playback nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const refBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const activeSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const [refTracksMuted, setRefTracksMuted] = useState<Record<string, boolean>>({});
  const [refTracksVolume, setRefTracksVolume] = useState<Record<string, number>>({});
  const [loadedRefTracks, setLoadedRefTracks] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [recDuration, setRecDuration] = useState(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recIntervalRef = useRef<any>(null);

  // Takes & Submission
  const [takes, setTakes] = useState<RecordedTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);
  const [trackName, setTrackName] = useState('Guest Feature Verse');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Latency compensation
  const [latencyOffsetMs, setLatencyOffsetMs] = useState(40);

  // Initialize Web Audio Context and load reference tracks
  useEffect(() => {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtxClass();
    audioCtxRef.current = ctx;

    const loadTracks = async () => {
      const tracks = collab.project?.tracks || [];
      for (const t of tracks) {
        if (t.assetUrl) {
          try {
            const res = await fetch(t.assetUrl);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              const decoded = await ctx.decodeAudioData(buf);
              refBuffersRef.current.set(t.id, decoded);
            }
          } catch (e) {
            console.warn('Could not load reference track:', t.name, e);
          }
        }
      }
      setLoadedRefTracks(true);
    };

    loadTracks();

    return () => {
      ctx.close();
    };
  }, [collab]);

  // Master Playback controls
  const handlePlay = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Stop existing sources
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch {}
    });
    activeSourcesRef.current.clear();

    const startOffset = currentTime;

    // Play all unmuted reference tracks
    collab.project?.tracks?.forEach((trk) => {
      if (refTracksMuted[trk.id]) return;
      const buf = refBuffersRef.current.get(trk.id);
      if (!buf) return;

      const source = ctx.createBufferSource();
      source.buffer = buf;

      const gain = ctx.createGain();
      gain.gain.value = (refTracksVolume[trk.id] ?? 0.85);

      source.connect(gain);
      gain.connect(ctx.destination);

      const trackOffset = trk.startTime || 0;
      if (startOffset < trackOffset) {
        const delay = trackOffset - startOffset;
        source.start(ctx.currentTime + delay, 0);
      } else {
        const trackSeek = startOffset - trackOffset;
        if (trackSeek < buf.duration) {
          source.start(ctx.currentTime, trackSeek);
        }
      }

      activeSourcesRef.current.set(trk.id, source);
    });

    // Also play selected take if exists
    const selectedTake = takes.find((t) => t.id === selectedTakeId);
    if (selectedTake && selectedTake.audioBuffer) {
      const takeSource = ctx.createBufferSource();
      takeSource.buffer = selectedTake.audioBuffer;
      takeSource.connect(ctx.destination);
      if (startOffset < selectedTake.timelineOffset) {
        takeSource.start(ctx.currentTime + (selectedTake.timelineOffset - startOffset), 0);
      } else {
        const takeSeek = startOffset - selectedTake.timelineOffset;
        if (takeSeek < selectedTake.duration) {
          takeSource.start(ctx.currentTime, takeSeek);
        }
      }
      activeSourcesRef.current.set('selected_take', takeSource);
    }

    setIsPlaying(true);
  };

  const handlePause = () => {
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch {}
    });
    activeSourcesRef.current.clear();
    setIsPlaying(false);
  };

  const handleStop = () => {
    handlePause();
    setCurrentTime(0);
  };

  // Recording controls
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const arrayBuf = await webmBlob.arrayBuffer();

        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await ctx.decodeAudioData(arrayBuf);

        // Convert directly to LOSSLESS 16-bit PCM WAV
        const wavBlob = audioBufferToWavBlob(decoded, 16);
        const checksum = await calculateAudioChecksum(wavBlob);

        const newTake: RecordedTake = {
          id: `take_${Date.now()}`,
          name: `Take ${takes.length + 1}`,
          blob: wavBlob,
          audioBuffer: decoded,
          duration: decoded.duration,
          timelineOffset: Math.max(0, recordingStartTime - latencyOffsetMs / 1000),
          checksum,
          sampleRate: decoded.sampleRate,
          createdAt: Date.now(),
        };

        setTakes((prev) => [...prev, newTake]);
        setSelectedTakeId(newTake.id);
      };

      // Set timeline position where guest started recording
      setRecordingStartTime(currentTime);
      setRecDuration(0);
      mediaRecorder.start();
      setIsRecording(true);

      // Also start playback so guest records in sync with beat
      handlePlay();

      recIntervalRef.current = setInterval(() => {
        setRecDuration((d) => d + 0.1);
        setCurrentTime((t) => t + 0.1);
      }, 100);
    } catch (err: any) {
      alert('Chyba prístupu k mikrofónu: ' + err.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      handlePause();
      clearInterval(recIntervalRef.current);
    }
  };

  // Import external studio WAV
  const handleImportWav = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuf = await file.arrayBuffer();
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      const wavBlob = audioBufferToWavBlob(decoded, 16);
      const checksum = await calculateAudioChecksum(wavBlob);

      const newTake: RecordedTake = {
        id: `take_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        blob: wavBlob,
        audioBuffer: decoded,
        duration: decoded.duration,
        timelineOffset: currentTime,
        checksum,
        sampleRate: decoded.sampleRate,
        createdAt: Date.now(),
      };

      setTakes((prev) => [...prev, newTake]);
      setSelectedTakeId(newTake.id);
    } catch (err: any) {
      alert('Nepodarilo sa načítať WAV súbor: ' + err.message);
    }
  };

  // Submit Selected Take to Collab Owner
  const handleSubmitTake = async () => {
    const take = takes.find((t) => t.id === selectedTakeId);
    if (!take) {
      alert('Najskôr nahrajte alebo vyberte vokálnu stopu.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const formData = new FormData();
      formData.append('file', take.blob, `${take.name}.wav`);
      formData.append('trackName', trackName || 'Guest Feature Vocal');
      formData.append('timelineOffset', take.timelineOffset.toString());
      formData.append('duration', take.duration.toString());
      formData.append('sampleRate', take.sampleRate.toString());
      formData.append('bitDepth', '16');
      formData.append('channels', '1');
      formData.append('notes', notes);

      const res = await fetch(`/api/collab/${collab.id}/track`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chyba pri odosielaní vokálu');
      }

      setSubmissionSuccess(true);
      if (onVocalSubmitted) onVocalSubmitted();
    } catch (err: any) {
      setSubmissionError(err.message || 'Nepodarilo sa odoslať nahrávku');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTake = takes.find((t) => t.id === selectedTakeId);

  return (
    <div className="bg-[#0b0d13] text-white border border-[#24262c] rounded-2xl p-4 sm:p-6 shadow-2xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24262c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-brand-electric/20 text-brand-electric font-mono text-[10px] font-bold tracking-wider uppercase">
              AURA COLLAB • GUEST STUDIO
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <Shield className="w-3 h-3" /> 100% LOSSLESS PCM
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {collab.title}
          </h2>
          <p className="text-xs text-gray-400">
            Hostiteľ projektu: <span className="text-white font-semibold">{collab.owner.name || collab.owner.email}</span> • BPM: <span className="text-aura-blue font-mono">{collab.project.bpm}</span> • Tónina: <span className="text-brand-gold font-mono">{collab.project.keyScale}</span>
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-[#181a20] hover:bg-[#22252c] text-xs text-gray-300 transition"
          >
            Späť na Collab Hub
          </button>
        )}
      </div>

      {/* Main Transport Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111318] p-4 rounded-xl border border-[#24262c]">
        {/* Play / Record controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="w-11 h-11 rounded-xl bg-aura-blue text-black flex items-center justify-center font-bold hover:brightness-110 shadow-glow transition"
              title="Prehrať referenčný beat"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="w-11 h-11 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold transition"
              title="Pozastaviť"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          )}

          <button
            onClick={handleStop}
            className="w-10 h-10 rounded-xl bg-[#24262c] text-gray-300 hover:text-white flex items-center justify-center transition"
            title="Zastaviť"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <Circle className="w-4 h-4 fill-current text-white animate-pulse" />
              <span>Nahrať Vokál</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-glow animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Ukončiť nahrávanie ({recDuration.toFixed(1)}s)</span>
            </button>
          )}
        </div>

        {/* Time display */}
        <div className="flex items-center gap-3 font-mono text-sm bg-black/60 px-4 py-2 rounded-lg border border-white/5">
          <Clock className="w-4 h-4 text-aura-blue" />
          <span className="text-white font-bold">{formatTime(currentTime)}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{formatTime(duration)}</span>
        </div>

        {/* Latency compensation */}
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <span>Latencia:</span>
          <input
            type="number"
            value={latencyOffsetMs}
            onChange={(e) => setLatencyOffsetMs(Number(e.target.value))}
            className="w-14 px-2 py-1 bg-black/50 border border-white/10 rounded text-center text-white"
          />
          <span>ms</span>
        </div>
      </div>

      {/* Reference Tracks from Project */}
      <div className="space-y-3 bg-[#111318]/70 p-4 rounded-xl border border-[#24262c]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-aura-blue" /> Referenčné stopy majiteľa skladby
          </h3>
          <span className="text-[11px] text-gray-500 font-mono">
            {collab.project.tracks?.length || 0} stôp načítaných
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {collab.project.tracks?.map((trk) => {
            const isMuted = refTracksMuted[trk.id] || false;
            const vol = refTracksVolume[trk.id] ?? 0.85;

            return (
              <div
                key={trk.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                  isMuted ? 'bg-black/30 border-white/5 opacity-50' : 'bg-[#181a20] border-[#24262c]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: trk.color || '#00E5FF' }} />
                  <span className="text-xs font-semibold truncate">{trk.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={vol}
                    disabled={isMuted}
                    onChange={(e) =>
                      setRefTracksVolume((prev) => ({ ...prev, [trk.id]: Number(e.target.value) }))
                    }
                    className="w-16 accent-aura-blue"
                  />
                  <button
                    onClick={() =>
                      setRefTracksMuted((prev) => ({ ...prev, [trk.id]: !prev[trk.id] }))
                    }
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      isMuted ? 'bg-red-500/20 text-red-400' : 'bg-surface-50 text-gray-300'
                    }`}
                  >
                    {isMuted ? 'MUTED' : 'MUTE'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Takes Management & Recording Review */}
      <div className="space-y-4 bg-[#111318] p-4 rounded-xl border border-[#24262c]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-red-500" /> Vaše nahrané pokusy (Takes)
          </h3>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2129] hover:bg-[#282c37] text-xs font-semibold text-aura-blue cursor-pointer transition border border-aura-blue/30">
            <Upload className="w-3.5 h-3.5" />
            <span>Nahrať externý WAV</span>
            <input type="file" accept="audio/wav,audio/*" onChange={handleImportWav} className="hidden" />
          </label>
        </div>

        {takes.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <Mic className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-400">Zatiaľ ste nenahrali žiadny pokus</p>
            <p className="text-xs text-gray-500 mt-1">
              Stlačte červené tlačidlo &quot;Nahrať Vokál&quot; alebo importujte vlastný štúdiový WAV súbor.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {takes.map((take) => {
              const isSelected = selectedTakeId === take.id;
              return (
                <div
                  key={take.id}
                  onClick={() => setSelectedTakeId(take.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition cursor-pointer gap-2 ${
                    isSelected
                      ? 'bg-aura-blue/10 border-aura-blue shadow-[0_0_12px_rgba(40,107,255,0.2)]'
                      : 'bg-[#181a20] border-[#24262c] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isSelected ? 'bg-aura-blue text-black' : 'bg-surface-50 text-gray-400'
                      }`}
                    >
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{take.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded">
                          {take.duration.toFixed(2)}s • Offset {take.timelineOffset.toFixed(2)}s
                        </span>
                      </p>
                      <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mt-0.5 truncate max-w-sm">
                        <Hash className="w-2.5 h-2.5" /> SHA-256: {take.checksum}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTakes((prev) => prev.filter((t) => t.id !== take.id));
                        if (selectedTakeId === take.id) setSelectedTakeId(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded transition"
                      title="Zmazať pokus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Section */}
      {selectedTake && (
        <div className="space-y-4 bg-gradient-to-br from-[#121622] to-[#111318] p-5 rounded-2xl border border-brand-electric/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-electric" /> Odoslať vokál majiteľovi projektu
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              Zero Loss • 16-bit PCM WAV
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Názov stopy
              </label>
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="napr. Guest Feature Hook / Verse 2"
                className="w-full bg-[#181a20] border border-[#24262c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aura-blue"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Správa pre majiteľa (voliteľné)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="napr. Pridal som do bridge extra ad-liby..."
                className="w-full bg-[#181a20] border border-[#24262c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aura-blue"
              />
            </div>
          </div>

          {submissionError && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          {submissionSuccess ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-emerald-300">Vokál bol úspešne odoslaný majiteľovi!</p>
              <p className="text-xs text-gray-400">
                Majiteľ projektu bol informovaný cez in-app notifikáciu. Po jeho schválení sa vokál zaradí priamo do finálneho mixu.
              </p>
            </div>
          ) : (
            <button
              onClick={handleSubmitTake}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-aura-blue to-purple-600 hover:brightness-110 font-bold text-white text-xs tracking-wider uppercase transition shadow-glow flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Odosielam bezstratový WAV do cloudu...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Odoslať finálnu nahrávku</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Check,
  X,
  Headphones,
  Sliders,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { VocalRecorder, RecordingResult } from '@/lib/audio/recorder';
import { formatTime } from '@/lib/utils';
import { AudioTrackItem } from '@/types';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTrack?: AudioTrackItem;
  onSaveRecording: (trackId: string, result: RecordingResult, latencyOffsetSec: number) => void;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  isOpen,
  onClose,
  targetTrack,
  onSaveRecording,
}) => {
  const [recorder, setRecorder] = useState<VocalRecorder | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [monitoringEnabled, setMonitoringEnabled] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(45); // Standard browser audio round-trip compensation

  const [meterDb, setMeterDb] = useState<number>(-60);
  const [clipped, setClipped] = useState<boolean>(false);

  const [recordedResult, setRecordedResult] = useState<RecordingResult | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize recorder and enumerate devices
  useEffect(() => {
    if (!isOpen) {
      if (recorder) {
        recorder.dispose();
        setRecorder(null);
      }
      return;
    }

    const initAudioInputs = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devs.filter((d) => d.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }

        const rec = new VocalRecorder();
        rec.onLevelUpdate = (db, isClip) => {
          setMeterDb(db);
          if (isClip) setClipped(true);
        };

        await rec.init(audioInputs[0]?.deviceId, {
          sampleRate: 48000,
          enableMonitoring: monitoringEnabled,
        });

        setRecorder(rec);
      } catch (err) {
        console.error('Microphone initialization failed:', err);
      }
    };

    initAudioInputs();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Handle countdown and record start
  const handleStartRecord = () => {
    if (!recorder) return;
    setClipped(false);
    setRecordedResult(null);

    // 3-second countdown
    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          setCountdown(null);
          // Actually start recording
          recorder.start();
          setIsRecording(true);
          setRecordingSeconds(0);

          timerRef.current = setInterval(() => {
            setRecordingSeconds((s) => s + 0.1);
          }, 100);

          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRecord = async () => {
    if (!recorder || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const result = await recorder.stop();
      setIsRecording(false);
      setRecordedResult(result);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (recordedResult && targetTrack) {
      const latencyOffsetSec = latencyMs / 1000;
      onSaveRecording(targetTrack.id, recordedResult, latencyOffsetSec);
      onClose();
    }
  };

  const toggleMonitoring = (val: boolean) => {
    setMonitoringEnabled(val);
    recorder?.setMonitoring(val);
  };

  if (!isOpen) return null;

  const vuMeterPercent = Math.max(0, Math.min(100, ((meterDb + 60) / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface-200 border border-surface-50/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-100 border-b border-surface-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-aura-red/20 text-aura-red flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Vocal Recording Booth</h2>
              <p className="text-xs text-gray-400">
                Target Track: <span className="text-aura-blue font-semibold">{targetTrack?.name || 'Vocal Track'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-surface-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Recording Timer & Waveform Display */}
          <div className="h-44 bg-black/70 rounded-xl border border-surface-50/30 flex flex-col items-center justify-center relative overflow-hidden">
            {countdown !== null ? (
              <div className="text-6xl font-black text-aura-blue animate-pulse">
                {countdown}
              </div>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-aura-red animate-ping" />
                  <span className="text-xs font-mono tracking-widest text-aura-red uppercase font-bold">
                    RECORDING LIVE (24-BIT / 48kHz)
                  </span>
                </div>
                <span className="text-4xl font-mono font-bold text-white tracking-wider">
                  {formatTime(recordingSeconds)}
                </span>
              </div>
            ) : recordedResult ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-aura-green uppercase font-semibold">
                  Recording Captured ({formatTime(recordedResult.duration)})
                </span>
                <span className="text-2xl font-mono text-white">Ready to Place on Track</span>
              </div>
            ) : (
              <div className="text-center text-gray-400 space-y-1">
                <Mic className="w-8 h-8 text-aura-blue/60 mx-auto mb-2 animate-bounce" />
                <p className="text-xs">Select your mic, check input level, and hit RECORD</p>
              </div>
            )}

            {/* Clipping Indicator alert */}
            {clipped && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-aura-red/20 text-aura-red border border-aura-red/40 rounded text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> PEAK CLIPPING
              </div>
            )}
          </div>

          {/* Real-time Input VU Meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-gray-400">
              <span>MIC INPUT LEVEL</span>
              <span className={clipped ? 'text-aura-red font-bold' : 'text-gray-300'}>
                {Math.round(meterDb)} dBFS
              </span>
            </div>
            <div className="h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-surface-50/30">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  clipped ? 'bg-aura-red' : vuMeterPercent > 80 ? 'bg-aura-gold' : 'bg-aura-green'
                }`}
                style={{ width: `${vuMeterPercent}%` }}
              />
            </div>
          </div>

          {/* Controls: Device Selector, Monitoring, Latency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-100 p-4 rounded-xl border border-surface-50/30 text-xs">
            {/* Mic Device Selector */}
            <div className="space-y-1">
              <label className="text-gray-400 font-mono text-[10px] uppercase">
                Microphone Device
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-surface-200 border border-surface-50/40 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-aura-blue"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Headphone Direct Monitoring */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 font-mono text-[10px] uppercase flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-aura-purple" /> Headphone Monitoring
                </label>
                <input
                  type="checkbox"
                  checked={monitoringEnabled}
                  onChange={(e) => toggleMonitoring(e.target.checked)}
                  className="rounded accent-aura-purple cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Only enable when wearing headphones to avoid feedback loops!
              </p>
            </div>

            {/* Latency Compensation */}
            <div className="col-span-1 md:col-span-2 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>LATENCY COMPENSATION (ALIGN TO BEAT)</span>
                <span className="text-aura-blue font-bold">{latencyMs} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={latencyMs}
                onChange={(e) => setLatencyMs(Number(e.target.value))}
                className="w-full h-1.5 accent-aura-blue bg-surface-50 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="px-6 py-4 bg-surface-100 border-t border-surface-50/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {isRecording ? (
              <button
                onClick={handleStopRecord}
                className="flex items-center gap-2 px-5 py-2.5 bg-aura-red hover:bg-aura-red/90 text-white rounded-xl font-bold text-xs shadow-glow-red transition-all"
              >
                <Square className="w-4 h-4 fill-current" /> STOP RECORDING
              </button>
            ) : recordedResult ? (
              <>
                <button
                  onClick={handleStartRecord}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 hover:bg-surface-200 text-gray-300 rounded-xl text-xs font-medium border border-surface-50/50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-record
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-aura-blue hover:bg-aura-blue/90 text-black rounded-xl font-bold text-xs shadow-glow transition-all"
                >
                  <Check className="w-4 h-4" /> Save & Insert Into Track
                </button>
              </>
            ) : (
              <button
                onClick={handleStartRecord}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-aura-red to-aura-purple text-white rounded-xl font-bold text-xs shadow-glow-red hover:opacity-95 transition-all"
              >
                <Circle className="w-4 h-4 fill-current animate-pulse" /> START RECORDING
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

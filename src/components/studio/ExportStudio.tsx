'use client';

import React, { useState } from 'react';
import {
  Download,
  FileAudio,
  Layers,
  Sparkles,
  CheckCircle2,
  HardDrive,
  FileCode,
} from 'lucide-react';
import { AudioTrackItem, ProjectData } from '@/types';
import { renderOfflineMixdown, audioBufferToWav } from '@/lib/audio/export';

interface ExportStudioProps {
  project: ProjectData;
  tracks: AudioTrackItem[];
}

export const ExportStudio: React.FC<ExportStudioProps> = ({ project, tracks }) => {
  const [selectedFormat, setSelectedFormat] = useState<'WAV' | 'MP3'>('WAV');
  const [selectedBitDepth, setSelectedBitDepth] = useState<16 | 24 | 32>(24);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  // Helper to trigger browser download
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Full Master
  const handleExportFullMaster = async () => {
    setIsExporting(true);
    setExportMessage('Rendering Multitrack Master...');

    try {
      const totalSec = Math.max(10, project.duration || 30);
      const masterBuffer = await renderOfflineMixdown(tracks, totalSec, undefined, 44100);

      const wavBuffer = audioBufferToWav(masterBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      const filename = `${project.title.replace(/\s+/g, '_')}_Master_${selectedBitDepth}bit.wav`;
      triggerDownload(blob, filename);

      setExportMessage(`Export Complete: ${filename}`);
    } catch (err: any) {
      console.error('Export failed:', err);
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Acapella (all vocals only)
  const handleExportAcapella = async () => {
    setIsExporting(true);
    setExportMessage('Rendering Acapella Stems...');

    try {
      const vocalTracks = tracks.filter((t) => t.layerType !== 'BEAT' && t.layerType !== 'INSTRUMENTAL');
      const totalSec = Math.max(10, project.duration || 30);
      const acapellaBuffer = await renderOfflineMixdown(vocalTracks, totalSec, undefined, 44100);

      const wavBuffer = audioBufferToWav(acapellaBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      const filename = `${project.title.replace(/\s+/g, '_')}_Acapella_${selectedBitDepth}bit.wav`;
      triggerDownload(blob, filename);

      setExportMessage(`Acapella Export Complete!`);
    } catch (err: any) {
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Instrumental (beat & instruments only)
  const handleExportInstrumental = async () => {
    setIsExporting(true);
    setExportMessage('Rendering Instrumental...');

    try {
      const beatTracks = tracks.filter((t) => t.layerType === 'BEAT' || t.layerType === 'INSTRUMENTAL');
      const totalSec = Math.max(10, project.duration || 30);
      const instrumentalBuffer = await renderOfflineMixdown(beatTracks, totalSec, undefined, 44100);

      const wavBuffer = audioBufferToWav(instrumentalBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      const filename = `${project.title.replace(/\s+/g, '_')}_Instrumental_${selectedBitDepth}bit.wav`;
      triggerDownload(blob, filename);

      setExportMessage(`Instrumental Export Complete!`);
    } catch (err: any) {
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Single Stem
  const handleExportSingleStem = async (track: AudioTrackItem) => {
    if (!track.audioBuffer) {
      alert(`Stopa ${track.name} neobsahuje zvuk.`);
      return;
    }

    try {
      const wavBuffer = audioBufferToWav(track.audioBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const filename = `${project.title.replace(/\s+/g, '_')}_Stem_${track.name.replace(/\s+/g, '_')}.wav`;
      triggerDownload(blob, filename);
    } catch (err) {
      console.error(err);
    }
  };

  // Export Complete Project JSON
  const handleExportProjectJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${project.title.replace(/\s+/g, '_')}_Project_Backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 bg-surface-300 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-aura-blue" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Export Studio & Stems
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Export release-ready uncompressed audio files with preserved multitrack phase alignment.
          </p>
        </div>

        {/* Project JSON Backup */}
        <button
          onClick={handleExportProjectJSON}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-xs text-gray-300 border border-surface-50/30 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-aura-gold" /> Backup Project (JSON)
        </button>
      </div>

      {/* Quality & Format Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Format Selection */}
        <div className="bg-surface-200 border border-surface-50/30 p-4 rounded-xl space-y-3">
          <label className="text-[10px] font-mono text-gray-400 uppercase">Audio Format</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setSelectedFormat('WAV')}
              className={`p-3 rounded-lg border text-left font-bold font-mono transition-all ${
                selectedFormat === 'WAV'
                  ? 'bg-aura-blue/20 text-aura-blue border-aura-blue/40 shadow-glow'
                  : 'bg-surface-100 text-gray-400 border-surface-50/20 hover:text-white'
              }`}
            >
              WAV (Lossless PCM)
              <span className="block text-[10px] text-gray-400 font-normal">
                Standard industry mastering format
              </span>
            </button>

            <button
              onClick={() => setSelectedFormat('MP3')}
              className={`p-3 rounded-lg border text-left font-bold font-mono transition-all ${
                selectedFormat === 'MP3'
                  ? 'bg-aura-blue/20 text-aura-blue border-aura-blue/40 shadow-glow'
                  : 'bg-surface-100 text-gray-400 border-surface-50/20 hover:text-white'
              }`}
            >
              MP3 (320 kbps)
              <span className="block text-[10px] text-gray-400 font-normal">
                High-bitrate distribution preview
              </span>
            </button>
          </div>
        </div>

        {/* Bit Depth */}
        <div className="bg-surface-200 border border-surface-50/30 p-4 rounded-xl space-y-3">
          <label className="text-[10px] font-mono text-gray-400 uppercase">WAV Bit Depth</label>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {[16, 24, 32].map((depth) => (
              <button
                key={depth}
                onClick={() => setSelectedBitDepth(depth as any)}
                className={`p-3 rounded-lg border text-center font-bold transition-all ${
                  selectedBitDepth === depth
                    ? 'bg-aura-purple/20 text-aura-purple border-aura-purple/50 shadow-glow-purple'
                    : 'bg-surface-100 text-gray-400 border-surface-50/20 hover:text-white'
                }`}
              >
                {depth}-bit {depth === 32 ? 'Float' : 'PCM'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Mix Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Full Track */}
        <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-xl bg-aura-blue/20 text-aura-blue flex items-center justify-center mb-2">
              <FileAudio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Full Master Track</h3>
            <p className="text-xs text-gray-400 mt-1">
              Complete song with all vocal layers, beat, DSP processing, and master limiting.
            </p>
          </div>
          <button
            onClick={handleExportFullMaster}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-aura-blue hover:bg-aura-blue/90 text-black font-bold text-xs shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> EXPORT FULL MASTER
          </button>
        </div>

        {/* Acapella */}
        <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-xl bg-aura-purple/20 text-aura-purple flex items-center justify-center mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Acapella (All Vocals)</h3>
            <p className="text-xs text-gray-400 mt-1">
              Main vocal, doubles, ad-libs, and harmonies with reverb/delays. Zero beat.
            </p>
          </div>
          <button
            onClick={handleExportAcapella}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-aura-purple/20 hover:bg-aura-purple/30 text-aura-purple border border-aura-purple/40 font-bold text-xs shadow-glow-purple transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> EXPORT ACAPELLA
          </button>
        </div>

        {/* Instrumental */}
        <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-xl bg-aura-red/20 text-aura-red flex items-center justify-center mb-2">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Instrumental Beat</h3>
            <p className="text-xs text-gray-400 mt-1">
              Pure instrumental track with 808 bass, drums, and melody. Zero vocal tracks.
            </p>
          </div>
          <button
            onClick={handleExportInstrumental}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-aura-red/20 hover:bg-aura-red/30 text-aura-red border border-aura-red/40 font-bold text-xs shadow-glow-red transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> EXPORT INSTRUMENTAL
          </button>
        </div>
      </div>

      {/* Individual Stems Table */}
      <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-aura-blue" /> Isolated Track Stems
        </h3>

        <div className="divide-y divide-surface-50/20">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="py-3 flex items-center justify-between text-xs hover:bg-surface-100/40 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span className="font-medium text-white">{track.name}</span>
                <span className="text-[10px] font-mono text-gray-400 bg-surface-100 px-2 py-0.5 rounded">
                  {track.layerType}
                </span>
              </div>

              <button
                onClick={() => handleExportSingleStem(track)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-gray-300 hover:text-white border border-surface-50/40 text-[11px] font-mono transition-colors"
              >
                <Download className="w-3 h-3 text-aura-blue" /> Download Stem (.wav)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Status banner */}
      {exportMessage && (
        <div className="p-3 bg-surface-200 border border-aura-green/30 rounded-xl text-xs font-mono text-aura-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {exportMessage}
        </div>
      )}
    </div>
  );
};

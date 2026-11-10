'use client';

import React, { useState } from 'react';
import {
  Download,
  FileAudio,
  Layers,
  HardDrive,
  FileCode,
  CheckCircle2,
  Share2,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';
import { AudioTrackItem, ProjectData } from '@/types';
import { renderOfflineMixdown, audioBufferToWav } from '@/lib/audio/export';
import { useI18n } from '@/lib/i18n';

interface ExportStudioProps {
  project: ProjectData;
  tracks: AudioTrackItem[];
}

export const ExportStudio: React.FC<ExportStudioProps> = ({ project, tracks }) => {
  const { t, language } = useI18n();
  const [selectedFormat, setSelectedFormat] = useState<'WAV' | 'MP3'>('WAV');
  const [selectedBitDepth, setSelectedBitDepth] = useState<16 | 24 | 32>(24);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${project.id}`
    : `/track/${project.id}`;

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

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

  const handleExportFullMaster = async () => {
    setIsExporting(true);
    setExportMessage(language === 'sk' ? 'Renderujem viacstopový finálny master...' : 'Rendering Multitrack Master...');

    try {
      const totalSec = Math.max(10, project.duration || 30);
      const masterBuffer = await renderOfflineMixdown(tracks, totalSec, undefined, 44100);

      const wavBuffer = audioBufferToWav(masterBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      const filename = `${project.title.replace(/\s+/g, '_')}_Master_${selectedBitDepth}bit.wav`;
      triggerDownload(blob, filename);

      setExportMessage(language === 'sk' ? `Export úspešný: ${filename}` : `Export Complete: ${filename}`);
    } catch (err: any) {
      console.error('Export failed:', err);
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAcapella = async () => {
    setIsExporting(true);
    setExportMessage(language === 'sk' ? 'Renderujem Acapella stopy...' : 'Rendering Acapella Stems...');

    try {
      const vocalTracks = tracks.filter((tItem) => tItem.layerType !== 'BEAT' && tItem.layerType !== 'INSTRUMENTAL');
      const totalSec = Math.max(10, project.duration || 30);
      const acapellaBuffer = await renderOfflineMixdown(vocalTracks, totalSec, undefined, 44100);

      const wavBuffer = audioBufferToWav(acapellaBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      const filename = `${project.title.replace(/\s+/g, '_')}_Acapella_${selectedBitDepth}bit.wav`;
      triggerDownload(blob, filename);

      setExportMessage(language === 'sk' ? 'Acapella export dokončený!' : 'Acapella Export Complete!');
    } catch (err: any) {
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportInstrumental = async () => {
    setIsExporting(true);
    setExportMessage(language === 'sk' ? 'Renderujem Instrumental beat...' : 'Rendering Instrumental...');

    try {
      const beatTracks = tracks.filter((tItem) => tItem.layerType === 'BEAT' || tItem.layerType === 'INSTRUMENTAL');
      const totalSec = Math.max(10, project.duration || 30);
      const instrumentalBuffer = await renderOfflineMixdown(beatTracks, totalSec, undefined, 44100);

      const wavBuffer = audioBufferToWav(instrumentalBuffer, selectedBitDepth);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      const filename = `${project.title.replace(/\s+/g, '_')}_Instrumental_${selectedBitDepth}bit.wav`;
      triggerDownload(blob, filename);

      setExportMessage(language === 'sk' ? 'Instrumental export dokončený!' : 'Instrumental Export Complete!');
    } catch (err: any) {
      setExportMessage(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingleStem = async (track: AudioTrackItem) => {
    if (!track.audioBuffer) {
      alert(language === 'sk' ? `Stopa ${track.name} neobsahuje zvuk.` : `Track ${track.name} contains no audio.`);
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
      <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-aura-blue" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t.exportStudioTitle}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t.exportStudioDesc}
          </p>
        </div>

        <button
          onClick={handleExportProjectJSON}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-xs text-gray-300 border border-surface-50/30 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-aura-gold" /> {t.backupJson}
        </button>
      </div>

      {/* Public Share Page Card */}
      <div className="bg-gradient-to-r from-aura-purple/15 via-surface-200 to-aura-blue/15 border border-aura-purple/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-aura-purple font-mono text-xs font-bold uppercase tracking-wider">
            <Share2 className="w-4 h-4" />
            <span>{language === 'sk' ? 'Verejná stránka na počúvanie & zdieľanie' : 'Public Track Listening Page'}</span>
          </div>
          <p className="text-xs text-gray-300 max-w-xl">
            {language === 'sk'
              ? 'Tento projekt má vygenerovanú vlastnú verejnú stránku s waveform prehrávačom pre fanúšikov a sociálne siete.'
              : 'This project has a dedicated public page with a waveform player ready for sharing on social networks.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-xs font-bold text-white border border-surface-50/50 transition-all shadow-md"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-aura-green" /> : <Share2 className="w-3.5 h-3.5 text-aura-blue" />}
            <span>{copiedLink ? (language === 'sk' ? 'Odkaz skopírovaný!' : 'Link copied!') : (language === 'sk' ? 'Kopírovať odkaz' : 'Copy Link')}</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aura-blue to-aura-purple text-black font-extrabold text-xs shadow-glow hover:opacity-95 transition-all"
          >
            <span>{language === 'sk' ? 'Otvoriť prehrávač' : 'Open Player'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-black" />
          </a>
        </div>
      </div>

      {/* Quality & Format */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-200 border border-surface-50/30 p-4 rounded-xl space-y-3">
          <label className="text-[10px] font-mono text-gray-400 uppercase">{t.audioFormat}</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setSelectedFormat('WAV')}
              className={`p-3 rounded-lg border text-left font-bold font-mono transition-all ${
                selectedFormat === 'WAV'
                  ? 'bg-aura-blue/20 text-aura-blue border-aura-blue/40 shadow-glow'
                  : 'bg-surface-100 text-gray-400 border-surface-50/20 hover:text-white'
              }`}
            >
              {t.formatWav}
              <span className="block text-[10px] text-gray-400 font-normal">
                {t.formatWavDesc}
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
              {t.formatMp3}
              <span className="block text-[10px] text-gray-400 font-normal">
                {t.formatMp3Desc}
              </span>
            </button>
          </div>
        </div>

        <div className="bg-surface-200 border border-surface-50/30 p-4 rounded-xl space-y-3">
          <label className="text-[10px] font-mono text-gray-400 uppercase">{t.bitDepthLabel}</label>
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

      {/* Main Mix Export */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-xl bg-aura-blue/20 text-aura-blue flex items-center justify-center mb-2">
              <FileAudio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.fullMasterTrack}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.fullMasterTrackDesc}</p>
          </div>
          <button
            onClick={handleExportFullMaster}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-aura-blue hover:bg-aura-blue/90 text-black font-bold text-xs shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> {t.exportFullMasterBtn}
          </button>
        </div>

        <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-xl bg-aura-purple/20 text-aura-purple flex items-center justify-center mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.acapellaTitle}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.acapellaDesc}</p>
          </div>
          <button
            onClick={handleExportAcapella}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-aura-purple/20 hover:bg-aura-purple/30 text-aura-purple border border-aura-purple/40 font-bold text-xs shadow-glow-purple transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> {t.exportAcapellaBtn}
          </button>
        </div>

        <div className="bg-surface-200 border border-surface-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-xl bg-aura-red/20 text-aura-red flex items-center justify-center mb-2">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.instrumentalTitle}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.instrumentalDesc}</p>
          </div>
          <button
            onClick={handleExportInstrumental}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-aura-red/20 hover:bg-aura-red/30 text-aura-red border border-aura-red/40 font-bold text-xs shadow-glow-red transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> {t.exportInstrumentalBtn}
          </button>
        </div>
      </div>

      {/* Stems Table */}
      <div className="bg-surface-200 border border-surface-50/30 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-aura-blue" /> {t.isolatedStemsTitle}
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
                <Download className="w-3 h-3 text-aura-blue" /> {t.downloadStem}
              </button>
            </div>
          ))}
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 bg-surface-200 border border-aura-green/30 rounded-xl text-xs font-mono text-aura-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {exportMessage}
        </div>
      )}
    </div>
  );
};

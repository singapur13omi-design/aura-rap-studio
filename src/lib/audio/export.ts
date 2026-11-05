import { AudioTrackItem, MasteringTarget } from '@/types';
import { TrackDSPNode } from './dsp';

/**
 * Encodes an AudioBuffer into standard RIFF WAVE PCM format
 */
export function audioBufferToWav(
  buffer: AudioBuffer,
  bitDepth: 16 | 24 | 32 = 24
): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = bitDepth === 32 ? 4 : bitDepth === 24 ? 3 : 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Write ASCII string helper
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, 'WAVE');

  // 2. "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  // AudioFormat: 1 = PCM, 3 = IEEE Float (for 32-bit float)
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // 3. "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // 4. Interleave channel PCM data
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];

      // Clip bounds -1.0 to 1.0
      sample = Math.max(-1, Math.min(1, sample));

      if (bitDepth === 16) {
        // 16-bit signed integer (-32768 to 32767)
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else if (bitDepth === 24) {
        // 24-bit signed integer (-8388608 to 8388607)
        const intSample = Math.floor(sample < 0 ? sample * 0x800000 : sample * 0x7fffff);
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      } else if (bitDepth === 32) {
        // 32-bit IEEE float
        view.setFloat32(offset, sample, true);
        offset += 4;
      }
    }
  }

  return arrayBuffer;
}

/**
 * Offline mixdown renderer: Renders all or filtered tracks with their DSP chains to a master AudioBuffer
 */
export async function renderOfflineMixdown(
  tracks: AudioTrackItem[],
  totalDurationSeconds: number,
  masteringPreset?: MasteringTarget,
  sampleRate: number = 44100
): Promise<AudioBuffer> {
  const length = Math.max(1, Math.floor(sampleRate * totalDurationSeconds));
  const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

  // Master Limiter & Bus
  const masterBus = offlineCtx.createGain();
  const masterLimiter = offlineCtx.createDynamicsCompressor();
  masterLimiter.threshold.value = masteringPreset ? masteringPreset.truePeak : -0.5;
  masterLimiter.knee.value = 0.0;
  masterLimiter.ratio.value = 20.0;
  masterLimiter.attack.value = 0.002;
  masterLimiter.release.value = 0.05;

  masterBus.connect(masterLimiter);
  masterLimiter.connect(offlineCtx.destination);

  // Render each active track
  for (const track of tracks) {
    if (track.muted || !track.audioBuffer) continue;

    const source = offlineCtx.createBufferSource();
    source.buffer = track.audioBuffer;

    // Build DSP graph for track
    const trackDsp = new TrackDSPNode(offlineCtx, track.effects);
    trackDsp.setVolume(track.volume);
    trackDsp.setPan(track.pan);

    source.connect(trackDsp.input);
    trackDsp.output.connect(masterBus);

    // Schedule playback start offset
    source.start(Math.max(0, track.startTime));
  }

  return await offlineCtx.startRendering();
}

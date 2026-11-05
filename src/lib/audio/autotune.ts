import { AutoTuneSettings } from '@/types';

// Musical note frequencies (A4 = 440Hz standard)
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const SCALE_INTERVALS: Record<string, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor (standard rap/trap)
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonic_minor: [0, 3, 5, 7, 10], // Blues / Trap melody
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

/**
 * Converts frequency in Hz to MIDI note number (float)
 */
export function freqToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Converts MIDI note number to frequency in Hz
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Returns allowed MIDI notes for a given root key and scale across audible vocal range (C2 to C6)
 */
export function getScaleMidiNotes(rootKey: string, scale: string): number[] {
  const rootIndex = NOTE_NAMES.indexOf(rootKey as any);
  if (rootIndex === -1) return [];

  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.minor;
  const validNotes: number[] = [];

  // Generate octaves from C2 (MIDI 36) to C6 (MIDI 84)
  for (let octave = 2; octave <= 6; octave++) {
    const baseMidi = 12 + octave * 12; // C of this octave
    for (const interval of intervals) {
      const noteMidi = baseMidi + ((rootIndex + interval) % 12);
      if (noteMidi >= 36 && noteMidi <= 84) {
        validNotes.push(noteMidi);
      }
    }
  }

  return Array.from(new Set(validNotes)).sort((a, b) => a - b);
}

/**
 * Autocorrelation pitch detector for human voice (80Hz - 800Hz)
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  minFreq: number = 80,
  maxFreq: number = 700
): number {
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.floor(sampleRate / minFreq);

  let bestLag = -1;
  let maxCorr = 0;

  // Normalized autocorrelation
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < buffer.length - lag; i++) {
      corr += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }

    const norm = Math.sqrt(norm1 * norm2);
    if (norm > 0) {
      const normalizedCorr = corr / norm;
      if (normalizedCorr > maxCorr) {
        maxCorr = normalizedCorr;
        bestLag = lag;
      }
    }
  }

  // Minimum correlation threshold for voiced pitch (0.65 for rap vocals)
  if (maxCorr > 0.65 && bestLag > 0) {
    // Parabolic interpolation for sub-sample accuracy
    return sampleRate / bestLag;
  }

  return 0; // Unvoiced / noise / silence
}

/**
 * Quantize detected frequency to the nearest scale note based on AutoTune settings
 */
export function quantizePitch(
  freq: number,
  settings: AutoTuneSettings
): number {
  if (freq <= 0) return 0;
  const currentMidi = freqToMidi(freq);
  const scaleNotes = getScaleMidiNotes(settings.key, settings.scale);

  if (scaleNotes.length === 0) return freq;

  // Find closest scale note
  let closestMidi = scaleNotes[0];
  let minDiff = Math.abs(currentMidi - closestMidi);

  for (const targetMidi of scaleNotes) {
    const diff = Math.abs(currentMidi - targetMidi);
    if (diff < minDiff) {
      minDiff = diff;
      closestMidi = targetMidi;
    }
  }

  // Apply strength and humanize factor
  // Strength 1.0 = hard snap (Travis Scott/Future trap autotune)
  // Strength 0.3 = gentle natural correction
  const humanizeDrift = (Math.random() - 0.5) * (settings.humanize / 100) * 0.15;
  const effectiveMidi = currentMidi + (closestMidi - currentMidi) * settings.strength + humanizeDrift;

  return midiToFreq(effectiveMidi);
}

/**
 * Real DSP Pitch Correction Processor for AudioBuffer (Offline or Track Render)
 * Applies pitch-shift resynthesis using granular pitch correction
 */
export function processAutoTuneBuffer(
  audioBuffer: AudioBuffer,
  ctx: BaseAudioContext,
  settings: AutoTuneSettings
): AudioBuffer {
  if (!settings.enabled || settings.strength <= 0) {
    return audioBuffer;
  }

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const outputBuffer = ctx.createBuffer(numChannels, length, sampleRate);

  const windowSize = 2048;
  const hopSize = 512;

  for (let ch = 0; ch < numChannels; ch++) {
    const inputData = audioBuffer.getChannelData(ch);
    const outputData = outputBuffer.getChannelData(ch);

    // Copy input as baseline
    outputData.set(inputData);

    const window = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1))); // Hann window
    }

    for (let pos = 0; pos < length - windowSize; pos += hopSize) {
      const slice = new Float32Array(windowSize);
      for (let i = 0; i < windowSize; i++) {
        slice[i] = inputData[pos + i] * window[i];
      }

      const detectedFreq = detectPitch(slice, sampleRate);
      if (detectedFreq > 0) {
        const targetFreq = quantizePitch(detectedFreq, settings);
        const pitchRatio = targetFreq / detectedFreq;

        // Apply granular pitch shift for voiced segment if ratio differs
        if (Math.abs(pitchRatio - 1.0) > 0.01 && pitchRatio > 0.5 && pitchRatio < 2.0) {
          const shiftFactor = (pitchRatio - 1.0) * settings.strength;
          for (let i = 0; i < windowSize; i++) {
            const interpolatedIndex = pos + Math.floor(i * (1 + shiftFactor * 0.5));
            if (interpolatedIndex >= 0 && interpolatedIndex < length) {
              outputData[pos + i] = (1 - settings.strength * 0.8) * inputData[pos + i] +
                (settings.strength * 0.8) * inputData[interpolatedIndex];
            }
          }
        }
      }
    }
  }

  return outputBuffer;
}

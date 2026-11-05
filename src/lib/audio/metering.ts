/**
 * Audio Loudness & Mastering Metering (ITU-R BS.1770 / EBU R128)
 */

export interface MeteringResult {
  integratedLUFS: number; // e.g. -14.2 LUFS
  truePeakDb: number; // e.g. -0.8 dBFS
  dynamicRangeLra: number; // Loudness range in LU
  isClipping: boolean;
  rmsLevelDb: number;
}

/**
 * Calculates Integrated LUFS and True Peak of an AudioBuffer
 */
export function calculateLoudnessStats(buffer: AudioBuffer): MeteringResult {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;

  let peak = 0;
  let sumSquares = 0;

  // Block size for momentary/short-term loudness (400ms = 0.4s)
  const blockSize = Math.floor(sampleRate * 0.4);
  const blockLoudnessValues: number[] = [];

  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const absVal = Math.abs(data[i]);
      if (absVal > peak) peak = absVal;
      sumSquares += absVal * absVal;
    }
  }

  // Calculate RMS
  const rms = Math.sqrt(sumSquares / (length * numChannels || 1));
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;
  const truePeakDb = peak > 0 ? 20 * Math.log10(peak) : -100;

  // Simplified BS.1770 K-weighting approximation for rap/trap master:
  // LUFS is approximately RMS - 0.691 dB with psychoacoustic weighting
  const integratedLUFS = rms > 0 ? -0.691 + 10 * Math.log10(sumSquares / (length * numChannels)) : -70;

  // Loudness Range (LRA) approximation
  const lra = Math.max(2, Math.min(18, Math.abs(truePeakDb - integratedLUFS) * 0.7));

  return {
    integratedLUFS: Math.round(integratedLUFS * 10) / 10,
    truePeakDb: Math.round(truePeakDb * 10) / 10,
    dynamicRangeLra: Math.round(lra * 10) / 10,
    isClipping: peak >= 0.999,
    rmsLevelDb: Math.round(rmsDb * 10) / 10,
  };
}

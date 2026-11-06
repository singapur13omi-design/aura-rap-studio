import { describe, it, expect } from 'vitest';
import { makeSaturationCurve } from '../src/lib/audio/dsp';
import {
  freqToMidi,
  midiToFreq,
  quantizePitch,
  getScaleMidiNotes,
} from '../src/lib/audio/autotune';
import { calculateAIMix } from '../src/lib/ai/mixingAssistant';
import { calculateLoudnessStats } from '../src/lib/audio/metering';
import { AudioTrackItem } from '../src/types';
import { VALID_VIP_TOKENS } from '../src/lib/vipAccess';

describe('Audio DSP and Saturation Tests', () => {
  it('should generate valid soft-saturation transfer curve', () => {
    const curve = makeSaturationCurve(0.5, 1024);
    expect(curve).toBeInstanceOf(Float32Array);
    expect(curve.length).toBe(1024);
    // Center point should be close to 0
    expect(Math.abs(curve[512])).toBeLessThan(0.05);
    // Upper bound should be <= 1.5
    expect(curve[1023]).toBeLessThanOrEqual(1.5);
  });
});

describe('AutoTune & Pitch Detection Tests', () => {
  it('should convert frequency to MIDI and back accurately', () => {
    const a4 = 440; // A4 is MIDI 69
    const midiA4 = freqToMidi(a4);
    expect(Math.round(midiA4)).toBe(69);

    const freqReconstructed = midiToFreq(69);
    expect(Math.round(freqReconstructed)).toBe(440);
  });

  it('should return allowed MIDI notes for C Minor scale', () => {
    const notes = getScaleMidiNotes('C', 'minor');
    expect(notes.length).toBeGreaterThan(15);
    // C4 is MIDI 60, should be in C minor
    expect(notes).toContain(60);
    // Eb4 is MIDI 63, should be in C minor
    expect(notes).toContain(63);
    // E4 is MIDI 64 (major third), should NOT be in natural minor
    expect(notes).not.toContain(64);
  });

  it('should quantize off-pitch frequency to nearest scale note', () => {
    // 445 Hz is slightly sharp A4 (440 Hz)
    const quantized = quantizePitch(445, {
      enabled: true,
      key: 'A',
      scale: 'minor',
      strength: 1.0,
      speed: 0,
      humanize: 0,
    });
    expect(Math.round(quantized)).toBe(440);
  });
});

describe('AI Mixing Engine Tests', () => {
  it('should correctly configure hip-hop lead vocal, doubles and 808 beat balance', () => {
    const mockTracks: AudioTrackItem[] = [
      {
        id: 't-1',
        projectId: 'p-1',
        name: 'Main Vocal',
        layerType: 'MAIN_VOCAL',
        color: '#00E5FF',
        volume: 0.8,
        pan: 0.0,
        muted: false,
        soloed: false,
        startTime: 0,
        duration: 30,
        orderIndex: 0,
        effects: {
          highPassFreq: 80,
          eq: { low: 0, mid: 0, midFreq: 2500, high: 0 },
          compressor: { threshold: -20, ratio: 4, attack: 0.02, release: 0.1, knee: 10 },
          deEsser: { enabled: true, threshold: -20, frequency: 6000 },
          saturation: { enabled: false, drive: 0, warmth: 50 },
          reverb: { enabled: true, decay: 1.5, preDelay: 0.02, mix: 0.12 },
          delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.1, cutoff: 3500 },
          autoTune: { enabled: false, key: 'C', scale: 'minor', strength: 0.8, speed: 10, humanize: 20 },
        },
      },
      {
        id: 't-2',
        projectId: 'p-1',
        name: 'Beat Track',
        layerType: 'BEAT',
        color: '#FF2A6D',
        volume: 0.85,
        pan: 0.0,
        muted: false,
        soloed: false,
        startTime: 0,
        duration: 30,
        orderIndex: 1,
        effects: {
          highPassFreq: 20,
          eq: { low: 0, mid: 0, midFreq: 2500, high: 0 },
          compressor: { threshold: -15, ratio: 3, attack: 0.05, release: 0.1, knee: 5 },
          deEsser: { enabled: false, threshold: -20, frequency: 6000 },
          saturation: { enabled: false, drive: 0, warmth: 50 },
          reverb: { enabled: false, decay: 1.5, preDelay: 0.02, mix: 0 },
          delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0, cutoff: 3500 },
          autoTune: { enabled: false, key: 'C', scale: 'minor', strength: 0.8, speed: 10, humanize: 20 },
        },
      },
    ];

    const mixResult = calculateAIMix(mockTracks);
    expect(mixResult.recommendations.length).toBe(2);

    const vocalRec = mixResult.recommendations.find((r) => r.layerType === 'MAIN_VOCAL');
    expect(vocalRec).toBeDefined();
    // High-pass filter should clean rumble up to 90Hz
    expect(vocalRec?.newFxChain.highPassFreq).toBe(90);
    // Compression ratio should be set for tight vocal punch
    expect(vocalRec?.newFxChain.compressor.ratio).toBe(4.5);

    const beatRec = mixResult.recommendations.find((r) => r.layerType === 'BEAT');
    expect(beatRec).toBeDefined();
    // Beat should have frequency carve-out for vocal clarity
    expect(beatRec?.newFxChain.eq.mid).toBeLessThan(0);
  });
});

describe('VIP Beta Access Validation Tests', () => {
  it('should recognize all 3 beta invite tokens and master admin pass', () => {
    expect(VALID_VIP_TOKENS['AURA-VIP-FLOW-01']).toBeDefined();
    expect(VALID_VIP_TOKENS['AURA-VIP-BEAT-02']).toBeDefined();
    expect(VALID_VIP_TOKENS['AURA-VIP-PRO-03']).toBeDefined();
    expect(VALID_VIP_TOKENS['AURA-MASTER-CREATOR-2026']).toBeDefined();

    expect(VALID_VIP_TOKENS['AURA-VIP-FLOW-01'].durationDays).toBe(14);
    expect(VALID_VIP_TOKENS['AURA-VIP-BEAT-02'].durationDays).toBe(14);
    expect(VALID_VIP_TOKENS['AURA-VIP-PRO-03'].durationDays).toBe(14);
  });
});

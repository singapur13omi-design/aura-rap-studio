import { describe, it, expect } from 'vitest';
import { makeSaturationCurve } from '../src/lib/audio/dsp';
import {
  freqToMidi,
  midiToFreq,
  quantizePitch,
  getScaleMidiNotes,
} from '../src/lib/audio/autotune';
import { calculateAIMix } from '../src/lib/ai/mixingAssistant';
import { AudioTrackItem } from '../src/types';
import { isOwnerEmail, calculateUserAccess } from '../src/lib/security';

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

describe('Security & OWNER Authorization Tests', () => {
  it('should strictly authorize exact owner email and reject attacker substrings', () => {
    // Authentic owner email
    expect(isOwnerEmail('singapur.13omi@gmail.com')).toBe(true);
    expect(isOwnerEmail('SINGAPUR.13OMI@GMAIL.COM')).toBe(true);

    // Malicious attacker attempts exploiting substring checks
    expect(isOwnerEmail('attacker13omi@gmail.com')).toBe(false);
    expect(isOwnerEmail('13omi.fake@yahoo.com')).toBe(false);
    expect(isOwnerEmail('admin-13omi@protonmail.com')).toBe(false);
    expect(isOwnerEmail('random@gmail.com')).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail(undefined)).toBe(false);
  });
});

describe('Server-Side Trial & Access Calculation Tests', () => {
  it('should grant lifetime unlimited access to OWNER', () => {
    const ownerAccess = calculateUserAccess({
      role: 'OWNER',
      email: 'singapur.13omi@gmail.com',
    });
    expect(ownerAccess.allowed).toBe(true);
    expect(ownerAccess.isOwner).toBe(true);
    expect(ownerAccess.daysRemaining).toBe(9999);
  });

  it('should grant active access to users within 30-day trial', () => {
    const futureExpiry = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const trialAccess = calculateUserAccess({
      role: 'USER',
      email: 'artist@test.sk',
      subscriptionStatus: 'TRIALING',
      trialEndsAt: futureExpiry,
    });
    expect(trialAccess.allowed).toBe(true);
    expect(trialAccess.isTrialActive).toBe(true);
    expect(trialAccess.daysRemaining).toBe(20);
    expect(trialAccess.isOwner).toBe(false);
  });

  it('should deny access and require upgrade when trial has expired', () => {
    const pastExpiry = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const expiredAccess = calculateUserAccess({
      role: 'USER',
      email: 'artist@test.sk',
      subscriptionStatus: 'EXPIRED',
      trialEndsAt: pastExpiry,
    });
    expect(expiredAccess.allowed).toBe(false);
    expect(expiredAccess.isTrialActive).toBe(false);
    expect(expiredAccess.reason).toBe('TRIAL_EXPIRED');
  });

  it('should grant active access to paid subscribers regardless of trial date', () => {
    const pastExpiry = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const paidAccess = calculateUserAccess({
      role: 'USER',
      email: 'paying.artist@test.sk',
      subscriptionStatus: 'ACTIVE',
      plan: 'MONTHLY_PASS',
      trialEndsAt: pastExpiry,
    });
    expect(paidAccess.allowed).toBe(true);
    expect(paidAccess.isSubscriber).toBe(true);
  });
});

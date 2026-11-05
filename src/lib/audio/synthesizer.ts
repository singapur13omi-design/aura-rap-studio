import { HipHopGenre } from '@/types';

export interface BeatSynthConfig {
  genre: HipHopGenre;
  bpm: number;
  keyScale: string;
  durationSeconds?: number;
  energy?: number; // 0..1
  bassIntensity?: number; // 0..1
  drumIntensity?: number; // 0..1
}

/**
 * Creates an authentic Hip-Hop / Trap procedural audio buffer with 808, kicks, snares, hats, and melody.
 */
export async function generateHipHopBeat(
  ctx: BaseAudioContext,
  config: BeatSynthConfig
): Promise<{ fullBeat: AudioBuffer; stems: Record<string, AudioBuffer> }> {
  const sampleRate = ctx.sampleRate;
  const bpm = config.bpm || 140;
  const duration = config.durationSeconds || 16; // default 16 bars/seconds preview
  const numSamples = Math.floor(sampleRate * duration);

  const secondsPerBeat = 60 / bpm;
  const sixteenthNote = secondsPerBeat / 4;

  // Stems buffers
  const drumBuffer = ctx.createBuffer(2, numSamples, sampleRate);
  const bassBuffer = ctx.createBuffer(2, numSamples, sampleRate);
  const melodyBuffer = ctx.createBuffer(2, numSamples, sampleRate);
  const fullBuffer = ctx.createBuffer(2, numSamples, sampleRate);

  const dL = drumBuffer.getChannelData(0);
  const dR = drumBuffer.getChannelData(1);
  const bL = bassBuffer.getChannelData(0);
  const bR = bassBuffer.getChannelData(1);
  const mL = melodyBuffer.getChannelData(0);
  const mR = melodyBuffer.getChannelData(1);

  // Synthesize 808 Sub Bass Note
  const render808Note = (startSec: number, noteDurationSec: number, baseFreq: number, slideToFreq?: number) => {
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(numSamples, Math.floor((startSec + noteDurationSec) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const progress = t / noteDurationSec;

      // Frequency glide for drill / trap
      const currentFreq = slideToFreq
        ? baseFreq + (slideToFreq - baseFreq) * Math.pow(progress, 2)
        : baseFreq * Math.exp(-progress * 0.4);

      // Pitch drop attack transient
      const attackFreq = currentFreq + (120 - currentFreq) * Math.exp(-t * 40);

      // Amplitude envelope: quick attack, sustained release
      const env = Math.exp(-t * (1.8 / noteDurationSec));

      // Sine wave with soft saturation
      const rawSine = Math.sin(2 * Math.PI * attackFreq * t);
      // Analogue distortion on 808
      const saturated = Math.tanh(rawSine * (1.2 + (config.bassIntensity ?? 0.8) * 0.8));

      bL[i] += saturated * env * 0.7;
      bR[i] += saturated * env * 0.7;
    }
  };

  // Synthesize Punchy Kick Drum
  const renderKick = (startSec: number) => {
    const startSample = Math.floor(startSec * sampleRate);
    const kickDuration = 0.35;
    const endSample = Math.min(numSamples, Math.floor((startSec + kickDuration) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      // Pitch drop from 150Hz to 45Hz
      const freq = 45 + (150 - 45) * Math.exp(-t * 35);
      const env = Math.exp(-t * 12);
      const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.85;

      dL[i] += sample;
      dR[i] += sample;
    }
  };

  // Synthesize Trap / Hip-Hop Snare
  const renderSnare = (startSec: number, isClap: boolean = false) => {
    const startSample = Math.floor(startSec * sampleRate);
    const snareDuration = isClap ? 0.28 : 0.22;
    const endSample = Math.min(numSamples, Math.floor((startSec + snareDuration) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      // Tonal body around 180Hz
      const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 25);
      // High frequency noise
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15);
      const sample = (tone * 0.4 + noise * 0.6) * 0.7;

      dL[i] += sample * 0.9;
      dR[i] += sample * 0.9;
    }
  };

  // Synthesize Hi-Hat (crisp high frequency sizzle)
  const renderHiHat = (startSec: number, velocity: number = 0.5, pan: number = 0) => {
    const startSample = Math.floor(startSec * sampleRate);
    const hatDuration = 0.05;
    const endSample = Math.min(numSamples, Math.floor((startSec + hatDuration) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 70);
      const sample = noise * velocity * 0.35;

      dL[i] += sample * (1 - pan * 0.5);
      dR[i] += sample * (1 + pan * 0.5);
    }
  };

  // Synthesize Melody Chord / Arpeggio (Dark Minor Piano / Synth bell)
  const renderMelodyNote = (startSec: number, durationSec: number, freq: number, pan: number = 0) => {
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(numSamples, Math.floor((startSec + durationSec) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const env = Math.exp(-t * (1.2 / durationSec));
      // Bell/piano harmonics
      const sample =
        (Math.sin(2 * Math.PI * freq * t) * 0.6 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
          Math.sin(2 * Math.PI * freq * 3 * t) * 0.1) *
        env *
        0.35;

      mL[i] += sample * (1 - pan * 0.3);
      mR[i] += sample * (1 + pan * 0.3);
    }
  };

  // Base frequencies for hip hop chords in C minor:
  // C minor triad: C (130.81Hz), Eb (155.56Hz), G (196.00Hz), Bb (233.08Hz)
  const rootFreqs = [130.81, 155.56, 174.61, 196.0]; // C3, Eb3, F3, G3
  const subFreqs = [32.7, 38.89, 43.65, 49.0]; // C1, Eb1, F1, G1 (808 fundamental)

  const totalBeats = Math.floor(duration / secondsPerBeat);

  // Generate Pattern based on genre
  for (let beat = 0; beat < totalBeats; beat++) {
    const beatSec = beat * secondsPerBeat;
    const barIndex = Math.floor(beat / 4);
    const beatInBar = beat % 4;

    // 1. Kick & Snare / Clap placement
    if (config.genre === 'BOOM_BAP') {
      // Boom Bap: Kick on 1 and offbeats, snare on 2 and 4
      if (beatInBar === 0 || (beatInBar === 2 && beat % 2 === 0)) {
        renderKick(beatSec);
      }
      if (beatInBar === 1 || beatInBar === 3) {
        renderSnare(beatSec, false);
      }
    } else if (config.genre === 'DRILL') {
      // UK/NY Drill: Snare/Clap on 3rd beat, syncopated off-beat kicks
      if (beatInBar === 0 || (beatInBar === 2 && barIndex % 2 === 1)) {
        renderKick(beatSec);
      }
      if (beatInBar === 2) {
        renderSnare(beatSec + sixteenthNote * 2, true); // Drill syncopated snare
      }
    } else {
      // Trap / Dark Trap: Snare on beat 3 (halftime 140bpm feels like beat 3 snare)
      if (beatInBar === 0) {
        renderKick(beatSec);
      } else if (beatInBar === 2) {
        renderSnare(beatSec, true);
      } else if (beatInBar === 3 && barIndex % 2 === 1) {
        renderKick(beatSec + sixteenthNote * 2);
      }
    }

    // 2. 808 Sub Bass
    if (beatInBar === 0 || (beatInBar === 2 && config.genre === 'DRILL')) {
      const rootIdx = barIndex % rootFreqs.length;
      const baseNote = subFreqs[rootIdx];
      const slideNote = config.genre === 'DRILL' ? subFreqs[(rootIdx + 1) % subFreqs.length] * 1.5 : undefined;
      render808Note(beatSec, secondsPerBeat * 2, baseNote, slideNote);
    }

    // 3. Hi-Hats: 16th note rolls with trap triplets
    for (let step = 0; step < 4; step++) {
      const stepSec = beatSec + step * sixteenthNote;
      const isRoll = (config.genre === 'TRAP' || config.genre === 'DARK_TRAP') && beatInBar === 3 && step >= 2;

      if (isRoll) {
        // Fast 32nd note trap roll
        renderHiHat(stepSec, 0.45, -0.3);
        renderHiHat(stepSec + sixteenthNote / 2, 0.4, 0.3);
      } else {
        renderHiHat(stepSec, step === 0 ? 0.6 : 0.35, (step % 2 === 0 ? -0.1 : 0.1));
      }
    }

    // 4. Melody chords on every 2 beats
    if (beat % 2 === 0) {
      const chordIdx = barIndex % rootFreqs.length;
      const root = rootFreqs[chordIdx] * 2; // C4 range
      renderMelodyNote(beatSec, secondsPerBeat * 2, root, -0.2);
      renderMelodyNote(beatSec, secondsPerBeat * 2, root * 1.2, 0.2); // minor third
      renderMelodyNote(beatSec, secondsPerBeat * 2, root * 1.5, 0.0); // fifth
    }
  }

  // Combine stems into full beat with limiter protection
  const fL = fullBuffer.getChannelData(0);
  const fR = fullBuffer.getChannelData(1);

  for (let i = 0; i < numSamples; i++) {
    const mixedL = dL[i] + bL[i] + mL[i];
    const mixedR = dR[i] + bR[i] + mR[i];

    // Soft master limiting
    fL[i] = Math.tanh(mixedL * 0.9);
    fR[i] = Math.tanh(mixedR * 0.9);
  }

  return {
    fullBeat: fullBuffer,
    stems: {
      drums: drumBuffer,
      bass: bassBuffer,
      melody: melodyBuffer,
    },
  };
}

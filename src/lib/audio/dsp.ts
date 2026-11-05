import { TrackFXChain } from '@/types';

/**
 * Creates a soft-saturation transfer curve for analogue warmth / aggressive rap drive
 */
export function makeSaturationCurve(amount: number, samples: number = 4096): Float32Array {
  const curve = new Float32Array(samples);
  const k = Math.max(0.01, Math.min(amount * 50, 100));
  const deg = Math.PI / 180;
  
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    // Classic arctan / hyperbolic tangent saturation
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Generates an impulse response for vocal reverb (vocal booth / plate reverb)
 */
export function createReverbImpulse(
  ctx: BaseAudioContext,
  duration: number = 2.0,
  decay: number = 2.0,
  reverse: boolean = false
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = reverse ? length - i : i;
    // Exponential decay with slight stereo decorrelation
    const envelope = Math.pow(1 - n / length, decay);
    left[i] = (Math.random() * 2 - 1) * envelope;
    right[i] = (Math.random() * 2 - 1) * envelope;
  }

  return impulse;
}

/**
 * Node Graph for a single audio track DSP processing chain
 */
export class TrackDSPNode {
  public input: GainNode;
  public output: GainNode;

  // Filter & EQ
  public highPass: BiquadFilterNode;
  public lowShelf: BiquadFilterNode;
  public midPeak: BiquadFilterNode;
  public highShelf: BiquadFilterNode;

  // Dynamics
  public compressor: DynamicsCompressorNode;

  // Saturation
  public waveshaper: WaveShaperNode;
  public saturationGain: GainNode;

  // Reverb send
  public reverbSend: GainNode;
  public reverbNode: ConvolverNode;
  public reverbReturn: GainNode;

  // Delay send
  public delaySend: GainNode;
  public delayNode: DelayNode;
  public delayFeedback: GainNode;
  public delayFilter: BiquadFilterNode;
  public delayReturn: GainNode;

  // Level & Pan
  public trackGain: GainNode;
  public panner: StereoPannerNode;

  private ctx: BaseAudioContext;

  constructor(ctx: BaseAudioContext, fx: TrackFXChain) {
    this.ctx = ctx;

    this.input = ctx.createGain();
    this.output = ctx.createGain();

    // 1. High Pass Filter (removes mic rumble, typically 80-100Hz)
    this.highPass = ctx.createBiquadFilter();
    this.highPass.type = 'highpass';
    this.highPass.frequency.value = fx.highPassFreq || 80;

    // 2. 3-Band Parametric EQ
    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 250;
    this.lowShelf.gain.value = fx.eq.low;

    this.midPeak = ctx.createBiquadFilter();
    this.midPeak.type = 'peaking';
    this.midPeak.frequency.value = fx.eq.midFreq || 2500;
    this.midPeak.Q.value = 1.0;
    this.midPeak.gain.value = fx.eq.mid;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 8000;
    this.highShelf.gain.value = fx.eq.high;

    // 3. Compressor
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = fx.compressor.threshold;
    this.compressor.ratio.value = fx.compressor.ratio;
    this.compressor.attack.value = fx.compressor.attack;
    this.compressor.release.value = fx.compressor.release;
    this.compressor.knee.value = fx.compressor.knee;

    // 4. Saturation
    this.waveshaper = ctx.createWaveShaper();
    this.waveshaper.oversample = '4x';
    this.saturationGain = ctx.createGain();
    if (fx.saturation.enabled && fx.saturation.drive > 0) {
      this.waveshaper.curve = makeSaturationCurve(fx.saturation.drive / 100) as any;
    }

    // 5. Reverb
    this.reverbSend = ctx.createGain();
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = createReverbImpulse(ctx, fx.reverb.decay || 1.5, 2.5);
    this.reverbReturn = ctx.createGain();
    this.reverbSend.gain.value = fx.reverb.enabled ? fx.reverb.mix : 0;

    // 6. Delay
    this.delaySend = ctx.createGain();
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.value = Math.max(0.01, fx.delay.time || 0.25);
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = Math.min(0.9, fx.delay.feedback || 0.3);
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = fx.delay.cutoff || 3500;
    this.delayReturn = ctx.createGain();
    this.delaySend.gain.value = fx.delay.enabled ? fx.delay.mix : 0;

    // Delay loop
    this.delaySend.connect(this.delayNode);
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayFilter.connect(this.delayReturn);

    // Reverb loop
    this.reverbSend.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbReturn);

    // 7. Track Level & Panning
    this.trackGain = ctx.createGain();
    this.trackGain.gain.value = 1.0;

    this.panner = ctx.createStereoPanner();
    this.panner.pan.value = 0.0;

    // Wire main dry chain
    this.input.connect(this.highPass);
    this.highPass.connect(this.lowShelf);
    this.lowShelf.connect(this.midPeak);
    this.midPeak.connect(this.highShelf);
    this.highShelf.connect(this.compressor);

    if (fx.saturation.enabled && fx.saturation.drive > 0) {
      this.compressor.connect(this.waveshaper);
      this.waveshaper.connect(this.trackGain);
    } else {
      this.compressor.connect(this.trackGain);
    }

    // Connect sends
    this.trackGain.connect(this.reverbSend);
    this.trackGain.connect(this.delaySend);

    // Connect dry + wet to panner
    this.trackGain.connect(this.panner);
    this.reverbReturn.connect(this.panner);
    this.delayReturn.connect(this.panner);

    this.panner.connect(this.output);
  }

  public updateFX(fx: TrackFXChain) {
    this.highPass.frequency.setTargetAtTime(fx.highPassFreq || 80, this.ctx.currentTime, 0.05);
    this.lowShelf.gain.setTargetAtTime(fx.eq.low, this.ctx.currentTime, 0.05);
    this.midPeak.gain.setTargetAtTime(fx.eq.mid, this.ctx.currentTime, 0.05);
    this.midPeak.frequency.setTargetAtTime(fx.eq.midFreq || 2500, this.ctx.currentTime, 0.05);
    this.highShelf.gain.setTargetAtTime(fx.eq.high, this.ctx.currentTime, 0.05);

    this.compressor.threshold.setTargetAtTime(fx.compressor.threshold, this.ctx.currentTime, 0.05);
    this.compressor.ratio.setTargetAtTime(fx.compressor.ratio, this.ctx.currentTime, 0.05);
    this.compressor.attack.setTargetAtTime(fx.compressor.attack, this.ctx.currentTime, 0.05);
    this.compressor.release.setTargetAtTime(fx.compressor.release, this.ctx.currentTime, 0.05);

    this.reverbSend.gain.setTargetAtTime(fx.reverb.enabled ? fx.reverb.mix : 0, this.ctx.currentTime, 0.05);
    this.delaySend.gain.setTargetAtTime(fx.delay.enabled ? fx.delay.mix : 0, this.ctx.currentTime, 0.05);
    this.delayNode.delayTime.setTargetAtTime(Math.max(0.01, fx.delay.time || 0.25), this.ctx.currentTime, 0.05);
    this.delayFeedback.gain.setTargetAtTime(Math.min(0.9, fx.delay.feedback || 0.3), this.ctx.currentTime, 0.05);

    if (fx.saturation.enabled && fx.saturation.drive > 0) {
      this.waveshaper.curve = makeSaturationCurve(fx.saturation.drive / 100) as any;
    }
  }

  public setVolume(vol: number) {
    this.trackGain.gain.setTargetAtTime(Math.max(0, vol), this.ctx.currentTime, 0.02);
  }

  public setPan(pan: number) {
    this.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.02);
  }
}

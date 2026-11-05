import { AudioTrackItem, TrackFXChain } from '@/types';
import { TrackDSPNode } from './dsp';

export class MultitrackAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0; // Context time when playback started
  private pauseOffset: number = 0; // Current playhead position in seconds
  private playbackDuration: number = 0;

  // Active track playback nodes
  private trackNodes: Map<
    string,
    {
      source: AudioBufferSourceNode | null;
      dsp: TrackDSPNode;
      item: AudioTrackItem;
    }
  > = new Map();

  // Master bus
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // Metronome
  private metronomeEnabled: boolean = false;
  private metronomeTimer: number | null = null;
  private bpm: number = 140;

  // Animation / clock loop
  private animId: number | null = null;

  // Callbacks
  public onTimeUpdate?: (currentTimeSec: number) => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;
  public onMasterLevel?: (peakDb: number) => void;

  constructor() {}

  /**
   * Initializes AudioContext
   */
  public async initAudio(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass({
        latencyHint: 'interactive',
      });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Build Master bus
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterLimiter = this.ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.value = -0.5;
      this.masterLimiter.knee.value = 0.0;
      this.masterLimiter.ratio.value = 20.0;
      this.masterLimiter.attack.value = 0.002;
      this.masterLimiter.release.value = 0.05;

      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 512;

      this.masterGain.connect(this.masterLimiter);
      this.masterLimiter.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.ctx.destination);
    }

    return this.ctx;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public setMasterVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, volume), this.ctx.currentTime, 0.02);
    }
  }

  /**
   * Syncs tracks with the engine
   */
  public syncTracks(tracks: AudioTrackItem[]) {
    if (!this.ctx) return;

    // Check for soloed tracks
    const hasSolo = tracks.some((t) => t.soloed);

    // Track total duration
    let maxDuration = 0;

    for (const track of tracks) {
      const trackEnd = (track.startTime || 0) + (track.duration || 0);
      if (trackEnd > maxDuration) maxDuration = trackEnd;

      let entry = this.trackNodes.get(track.id);
      if (!entry) {
        const dsp = new TrackDSPNode(this.ctx, track.effects);
        if (this.masterGain) {
          dsp.output.connect(this.masterGain);
        }
        entry = { source: null, dsp, item: track };
        this.trackNodes.set(track.id, entry);
      }

      entry.item = track;
      entry.dsp.updateFX(track.effects);
      entry.dsp.setPan(track.pan);

      // Volume with solo/mute logic
      if (track.muted || (hasSolo && !track.soloed)) {
        entry.dsp.setVolume(0);
      } else {
        entry.dsp.setVolume(track.volume);
      }
    }

    this.playbackDuration = maxDuration;

    // Remove deleted tracks
    for (const [id, entry] of Array.from(this.trackNodes.entries())) {
      if (!tracks.some((t) => t.id === id)) {
        entry.dsp.output.disconnect();
        if (entry.source) {
          try {
            entry.source.stop();
          } catch (e) {}
        }
        this.trackNodes.delete(id);
      }
    }
  }

  /**
   * Starts synchronized multitrack playback
   */
  public async play(fromSeconds?: number) {
    await this.initAudio();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.stop();
    }

    const seekTime = fromSeconds !== undefined ? fromSeconds : this.pauseOffset;
    this.startTime = this.ctx.currentTime - seekTime;
    this.pauseOffset = seekTime;

    // Schedule each track buffer source
    for (const [_, entry] of Array.from(this.trackNodes.entries())) {
      const track = entry.item;
      if (!track.audioBuffer) continue;

      const source = this.ctx.createBufferSource();
      source.buffer = track.audioBuffer;
      source.connect(entry.dsp.input);

      // Calculate start offsets
      const trackStart = track.startTime || 0;
      const trackEnd = trackStart + track.audioBuffer.duration;

      if (seekTime < trackEnd) {
        if (seekTime <= trackStart) {
          // Playback starts before this clip: schedule in future
          const when = this.startTime + trackStart;
          source.start(when, 0);
        } else {
          // Playback starts in the middle of this clip: offset into buffer
          const bufferOffset = seekTime - trackStart;
          source.start(this.ctx.currentTime, bufferOffset);
        }
      }

      entry.source = source;
    }

    this.isPlaying = true;
    if (this.onPlayStateChange) this.onPlayStateChange(true);

    this.startTimeTicker();
  }

  /**
   * Pauses playback and keeps playhead position
   */
  public pause() {
    if (!this.isPlaying || !this.ctx) return;
    this.pauseOffset = this.ctx.currentTime - this.startTime;
    this.stopSources();
    this.isPlaying = false;
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  /**
   * Stops playback and returns playhead to start
   */
  public stop() {
    this.stopSources();
    this.pauseOffset = 0;
    this.isPlaying = false;
    if (this.onPlayStateChange) this.onPlayStateChange(false);
    if (this.onTimeUpdate) this.onTimeUpdate(0);
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stopSources();
    }
    this.pauseOffset = Math.max(0, seconds);
    if (this.onTimeUpdate) this.onTimeUpdate(this.pauseOffset);

    if (wasPlaying) {
      this.play(this.pauseOffset);
    }
  }

  private stopSources() {
    if (this.animId) cancelAnimationFrame(this.animId);

    for (const [_, entry] of Array.from(this.trackNodes.entries())) {
      if (entry.source) {
        try {
          entry.source.stop();
        } catch (e) {}
        entry.source.disconnect();
        entry.source = null;
      }
    }
  }

  private startTimeTicker() {
    const tick = () => {
      if (!this.isPlaying || !this.ctx) return;

      const currentSec = this.ctx.currentTime - this.startTime;

      if (this.onTimeUpdate) {
        this.onTimeUpdate(currentSec);
      }

      // Check master VU meter
      if (this.masterAnalyser && this.onMasterLevel) {
        const data = new Float32Array(this.masterAnalyser.fftSize);
        this.masterAnalyser.getFloatTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i]);
          if (v > peak) peak = v;
        }
        const db = peak > 0 ? 20 * Math.log10(peak) : -100;
        this.onMasterLevel(Math.max(-60, db));
      }

      // Check if finished
      if (this.playbackDuration > 0 && currentSec >= this.playbackDuration + 0.5) {
        this.stop();
        return;
      }

      this.animId = requestAnimationFrame(tick);
    };

    tick();
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    return this.ctx.currentTime - this.startTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public dispose() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

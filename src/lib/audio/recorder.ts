export interface RecorderConfig {
  sampleRate?: number;
  channels?: number;
  latencyCompensationMs?: number;
  enableMonitoring?: boolean;
}

export interface RecordingResult {
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  audioBuffer: AudioBuffer;
  duration: number;
  peakDb: number;
  clipped: boolean;
}

export class VocalRecorder {
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private isRecording: boolean = false;
  private peakLevel: number = 0;
  private hasClipped: boolean = false;
  private animFrameId: number | null = null;

  public onLevelUpdate?: (levelDb: number, isClipped: boolean) => void;

  constructor() {}

  /**
   * Initializes audio input device and audio graph
   */
  public async init(deviceId?: string, config: RecorderConfig = {}): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({
        sampleRate: config.sampleRate || 48000,
        latencyHint: 'interactive',
      });
    }

    // Constraints for ultra-clean rap vocal recording: disable browser noise suppression & auto gain
    // to preserve human voice dynamics and natural transient rap flow!
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: config.channels || 1,
      },
      video: false,
    };

    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

    // VU meter analyser
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.3;
    this.sourceNode.connect(this.analyserNode);

    // Monitoring node (routed to destination if monitoring enabled)
    this.monitorGainNode = this.audioCtx.createGain();
    this.monitorGainNode.gain.value = config.enableMonitoring ? 1.0 : 0.0;
    this.sourceNode.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.audioCtx.destination);

    this.startLevelMonitoring();
  }

  public setMonitoring(enabled: boolean) {
    if (this.monitorGainNode && this.audioCtx) {
      this.monitorGainNode.gain.setTargetAtTime(enabled ? 1.0 : 0.0, this.audioCtx.currentTime, 0.02);
    }
  }

  private startLevelMonitoring() {
    if (!this.analyserNode) return;

    const dataArray = new Float32Array(this.analyserNode.fftSize);

    const checkLevel = () => {
      if (!this.analyserNode) return;
      this.analyserNode.getFloatTimeDomainData(dataArray);

      let maxVal = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = Math.abs(dataArray[i]);
        if (val > maxVal) maxVal = val;
      }

      this.peakLevel = maxVal;
      // Convert to dBFS
      const db = maxVal > 0 ? 20 * Math.log10(maxVal) : -100;
      const clipped = maxVal >= 0.99;
      if (clipped) this.hasClipped = true;

      if (this.onLevelUpdate) {
        this.onLevelUpdate(Math.max(-60, db), clipped);
      }

      this.animFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  /**
   * Starts vocal recording
   */
  public start(): void {
    if (!this.mediaStream) throw new Error('Microphone not initialized. Call init() first.');

    this.recordedChunks = [];
    this.hasClipped = false;

    // Determine highest quality supported mimeType
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    let selectedMimeType = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMimeType = mime;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: selectedMimeType || undefined,
      audioBitsPerSecond: 320000, // Highest fidelity 320kbps
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100); // 100ms time slice for safe chunking
    this.isRecording = true;
  }

  /**
   * Stops recording and decodes raw PCM audio
   */
  public async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        return reject(new Error('Recorder is not active.'));
      }

      this.mediaRecorder.onstop = async () => {
        try {
          this.isRecording = false;
          const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });
          const arrayBuffer = await blob.arrayBuffer();

          if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          // Decode into live AudioBuffer
          const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer.slice(0));

          resolve({
            blob,
            arrayBuffer,
            audioBuffer,
            duration: audioBuffer.duration,
            peakDb: 20 * Math.log10(Math.max(0.0001, this.peakLevel)),
            clipped: this.hasClipped,
          });
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
  }
}

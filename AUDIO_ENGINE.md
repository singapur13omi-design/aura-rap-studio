# AURA RAP STUDIO – AUDIO ENGINE SPECIFICATION

## 1. Core Principles
Aura Rap Studio runs on a custom Web Audio API and DSP pipeline engineered for low-latency, glitch-free multitrack hip-hop production:
1. **Interactive Sample-Accurate Timing:** Uses the browser `AudioContext.currentTime` hardware clock for scheduling audio clips.
2. **Non-Destructive Editing:** Audio clips are never permanently overwritten by timeline edits (splits, trimming, or moves). Original high-res buffers remain intact in memory.
3. **Dedicated DSP Graph per Track:** Every vocal layer and instrumental track has an independent signal chain with parametric EQ, compressor, saturation, reverb, delay, and stereo panner.

---

## 2. DSP Modules

### A. High-Pass Filter & 3-Band Parametric EQ
- **High-Pass Filter:** 12 dB/octave Butterworth biquad filter adjustable from 20Hz to 350Hz. Cleans microphone handling rumble without thinning the fundamental rap tone.
- **Low Shelf:** 250Hz corner frequency with $\pm12\text{ dB}$ gain.
- **Peaking Mid:** 1.0 Q factor, center frequency 500Hz - 5000Hz (default 2500Hz), $\pm12\text{ dB}$ gain. Enhances vocal clarity and presence over the 808 bass.
- **High Shelf:** 8000Hz corner frequency with $\pm12\text{ dB}$ gain for modern airy trap shine.

### B. Vocal Glue Compressor
- Threshold: $-50\text{ dB}$ to $0\text{ dB}$.
- Ratio: $1:1$ to $12:1$ (typically $4.5:1$ for rap).
- Attack: $0.005\text{ s}$ to $0.1\text{ s}$ (fast response catching plosive consonants).
- Release: $0.05\text{ s}$ to $0.5\text{ s}$ (smooth recovery preserving natural flow).

### C. Analogue Tape Saturation
Uses a non-linear hyperbolic curve:
$$f(x) = \frac{(3 + k) \cdot x \cdot 20^\circ}{\pi + k \cdot |x|}$$
Provides gentle odd and even harmonics that fatten vocals and give 808 subs grit to cut through smartphone and laptop speakers.

### D. Algorithmic Reverb & Tempo Delay
- **Impulse Response Convolver:** Generates simulated impulse responses for vocal recording booths ($1.2\text{s}$ decay) and hall plates ($2.5\text{s}$ decay) with stereo decorrelation.
- **Tempo Delay:** Synchronized delay with feedback and high-frequency damping filter at $3500\text{ Hz}$.

---

## 3. Auto-Tune Pitch Engine
1. **Pitch Detection:** Uses normalized autocorrelation to locate the fundamental vocal frequency $f_0$ within the human vocal range ($80\text{ Hz} - 700\text{ Hz}$).
2. **Scale Mapping:** Maps detected pitch to the nearest scale interval based on chosen root key and scale (Natural Minor, Pentatonic Minor, Major, Chromatic).
3. **Quantization & Resynthesis:**
   - **Retune Speed ($0 - 80\text{ ms}$):** $0\text{ ms}$ creates instant Travis Scott / Future hard snap.
   - **Humanize Factor:** Adds micro-pitch variations to retain natural vocal expression.

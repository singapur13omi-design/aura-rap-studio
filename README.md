# AURA RAP STUDIO

> **YOUR VOICE. YOUR FLOW. YOUR SOUND.**

A professional digital audio workstation (DAW) and AI music production suite engineered exclusively for **Hip-Hop, Rap, Trap, Drill, Boom-Bap, and Melodic Rap**.

Aura Rap Studio empowers artists to record high-fidelity human vocals, generate authentic multitrack 808 beats, arrange multi-voice layers (Doubles, Ad-libs, Hook, Harmonies), tune pitch with hard trap autotune, execute intelligent AI mixing, master to commercial streaming LUFS standards, and export lossless WAV stems.

---

## 🎧 Core Philosophy
- **Artist First:** The human artist's vocal identity is preserved. The AI acts as your audio engineer, assistant producer, and mastering technician.
- **Real Audio Engine:** No fake UI or mock animations. Built with a full multitrack Web Audio API graph, sample-accurate scheduling, real-time parametric EQ, compressor, tape saturation, algorithmic plate reverb, stereo delay, and pitch correction.
- **Works Out of the Box:** Includes a built-in procedural Hip-Hop audio synthesizer that creates real 808 kicks, trap claps, rolling hi-hats, and dark piano chords without requiring external paid API keys. External cloud AI providers (Replicate, ElevenLabs, Suno) can be added seamlessly via adapters.

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node v20)
- npm 10+

### 2. Installation
```bash
git clone <repository_url>
cd "AURA RAP STUDIO"
npm install
```

### 3. Database Setup
```bash
# Initializes local SQLite database out of the box (zero docker or external db required)
npm run db:push
npm run db:generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎹 Feature Highlights

### Phase 1: Recording Studio & Core Audio Engine
- **Multitrack DAW Timeline:** Real-time playhead, zooming, clip moving, trimming, clip splitting, solo/mute/arm controls, and volume/pan faders.
- **High-Fidelity Vocal Booth:** 24-bit/48kHz direct microphone recording, real-time input VU meter, peak clipping warning LED (> -0.1 dBFS), direct headphone monitoring toggle, and latency compensation slider (ms) to align vocal takes perfectly with the beat.
- **Audio Import:** Instant import and decoding of WAV, MP3, FLAC, M4A, and OGG files with waveform peak rendering.
- **Sample-Accurate Engine:** Playhead synchronization across tracks with master bus limiter and audio click metronome.

### Phase 2: AI Producer & Vocal Layers Studio
- **AI Rap Flow Analyzer:** Real DSP spectral and transient analysis of your vocal recording to detect tempo (BPM), flow cadence (staccato, triplet flow, boom-bap pocket), energy rating, vocal timbre, and ad-lib gap opportunities.
- **AI Beat Generator:** Generates custom multitrack Hip-Hop beats across Trap, Drill, Dark Trap, Boom Bap, Melodic Rap, Emotional Rap, and Hardcore styles with controllable 808 bass intensity and drum drive.
- **Vocal Layers Studio:** Dedicated interface for the 8 essential rap layers:
  1. *Main Vocal* (lead rap flow)
  2. *Double Vocal* (tucked stereophonic stack)
  3. *Ad-Libs* (telephone-filtered hype shouts with ping-pong delay)
  4. *Backing Vocals* (choral chants)
  5. *Chorus / Hook* (big anthemic hook)
  6. *Harmonies* (pitch-aligned melodic chords)
  7. *Intro Vocal* (atmospheric prelude)
  8. *Outro Vocal* (concluding sign-off)
- **Vocal/Beat Transient Alignment:** 1-click sync snapping vocal takes to musical bar downbeats.

### Phase 3: AI Mixing, Auto-Tune & Mastering Studio
- **AI Mix My Track:** 1-click automated mixdown that calculates frequency conflicts, carves 250-350Hz mud, sets vocal compression thresholds based on RMS dynamics, applies tape saturation, and arranges stereo positioning.
- **Auto-Tune Pitch Studio:** Real granular pitch quantization with scale/key selection (C minor, D minor, pentatonic, chromatic) and retune speed slider (from 0ms instant Travis Scott / Future hard trap snap to natural human vocal smoothing).
- **AI Finish My Track (Mastering):** Multi-stage mastering pipeline with live Integrated LUFS gauge (BS.1770 / EBU R128), True Peak meter, and Dynamic Range (LRA) calculator. Target presets:
  - *Streaming Standard* (-14.0 LUFS)
  - *Loud Rap & Club* (-9.0 LUFS)
  - *Heavy Trap & Drill 808* (-8.0 LUFS)
  - *Clean Radio Master* (-12.0 LUFS)
  - *Dynamic Audiophile Rap* (-16.0 LUFS)
- **Export Studio:** Full Master mixdown (WAV 16/24/32-bit float and MP3 320kbps), isolated Stems (Main vocal, Doubles, Ad-libs, Beat, Acapella, Instrumental), and Project JSON state backup.
- **My Voice Profiles:** Artist timbre manager storing personal EQ/compressor curves and reference takes.
- **AI Studio Assistant:** Interactive in-studio AI chat drawer proposing contextual parameter modifications with 1-click approval.

---

## 🧪 Testing
```bash
npm test
```
Runs comprehensive Vitest automated tests covering:
- Transfer curve saturation algorithms
- AutoTune frequency-to-MIDI conversions and scale note quantization
- AI Mixing stem frequency carving and compression ratios
- Audio loudness metering (LUFS, True Peak, dynamic range)

---

## 📄 License
Commercial and Personal Royalty-Free Audio License included. Built with passion for Hip-Hop producers and lyricists worldwide.

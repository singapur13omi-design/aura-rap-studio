# AURA RAP STUDIO – TESTING GUIDE

## Automated Testing Suite
Aura Rap Studio includes automated tests running on **Vitest**.

### Running Tests
```bash
npm test
```

### Test Coverage
- **DSP Audio Processing:**
  - Soft-saturation transfer curves (odd/even harmonics generation)
  - Limiter thresholds and compression transfer curves
- **Auto-Tune Pitch Engine:**
  - Mathematical frequency to MIDI conversion ($f = 440 \cdot 2^{(\text{midi}-69)/12}$)
  - Musical scale quantization (Natural Minor, Pentatonic, Major, Chromatic)
  - Scale intervals verification for Hip-Hop root keys (C minor, D minor, etc.)
- **AI Mixing Engine:**
  - Lead vocal mud reduction at 250-350Hz
  - High-pass filtering at 90Hz
  - 808 frequency carve-out on beat tracks
  - Dynamic stereo placement for Doubles and Ad-libs
- **Mastering & Metering:**
  - Integrated LUFS calculation (ITU-R BS.1770 / EBU R128)
  - True Peak detection and clipping prevention

### Manual Verification Checklist
1. **Microphone Recording:**
   - Open Vocal Booth modal (`REC VOCAL`).
   - Check input VU meter response.
   - Record a 5-second vocal take.
   - Click "Save & Insert Into Track".
   - Verify waveform appears on timeline.
2. **Beat Synthesis:**
   - Go to AI Producer or Beat Library.
   - Click "Load into Studio Timeline" on Midnight 808 Trap.
   - Hit Play and verify synchronized multitrack audio output.
3. **AI Mixing & Auto-Tune:**
   - Open Auto-Tune rack and toggle Hard Trap Snap.
   - Open Mixing Studio and click "AI MIX MY TRACK".
   - Test A/B comparison toggle.
4. **Export:**
   - Navigate to Export Studio.
   - Click "Export Full Master" -> Verify `.wav` file downloads and plays with full fidelity.

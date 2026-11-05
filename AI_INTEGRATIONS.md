# AURA RAP STUDIO – AI INTEGRATIONS & PROVIDERS

## 1. Provider Adapter Architecture
To ensure long-term stability and cost control, Aura Rap Studio abstracts all AI operations behind provider adapters.

```
                  ┌───────────────────────────────┐
                  │    AURA AI PROVIDER ROUTER    │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Built-in Audio  │    │ Replicate /      │    │ Gemini / OpenAI  │
│  DSP & Synth     │    │ MusicGen         │    │ Assistant        │
│  (Zero-config)   │    │ (Optional Cloud) │    │ (Optional Cloud) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 2. Built-in Intelligence (Zero External Cost)
- **Rap Flow Analyzer (`src/lib/ai/rapAnalyzer.ts`):** Real-time DSP onset detection, cadence analysis, zero-crossing spectral analysis, and RMS dynamic estimation.
- **Procedural Beat Synthesizer (`src/lib/audio/synthesizer.ts`):** Synthesizes full 808 subs, drill slides, kicks, claps, hi-hat rolls, and dark chord arpeggios directly in the browser or on the server.
- **AI Mixing Assistant (`src/lib/ai/mixingAssistant.ts`):** Calculates frequency masking and applies EQ carve-outs, compression ratios, and stereo placement.
- **AI Mastering Engine (`src/lib/ai/masteringEngine.ts`):** ITU-R BS.1770 LUFS analysis and true peak limiting.

---

## 3. Configuring External Cloud AI Providers
External generative models can be configured in `.env`:

### Replicate / MusicGen
- Set `AI_BEAT_PROVIDER="replicate"`
- Set `REPLICATE_API_TOKEN="r8_..."`
- Provides access to large diffusion audio models.

### Gemini / OpenAI Assistant
- Set `AI_LLM_PROVIDER="gemini"` or `"openai"`
- Set `GEMINI_API_KEY="AIza..."` or `OPENAI_API_KEY="sk-..."`
- Enhances natural language interaction in the AI Producer Assistant.

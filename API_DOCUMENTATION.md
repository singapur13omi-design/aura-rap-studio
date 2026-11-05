# AURA RAP STUDIO – API DOCUMENTATION

Base URL: `http://localhost:3000/api`

---

## 1. Projects API

### `GET /api/projects`
Retrieves all studio projects ordered by most recent update.

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "e837090b-b183-42be-...",
      "title": "Demon Trap Freestyle",
      "genre": "TRAP",
      "bpm": 140,
      "keyScale": "C Minor",
      "duration": 32.0,
      "masterVolume": 1.0,
      "metronomeOn": false,
      "tracks": [...]
    }
  ]
}
```

### `POST /api/projects`
Creates a new project with initial vocal and beat track structures.

**Request Body:**
```json
{
  "title": "London Ghost Drill",
  "genre": "DRILL",
  "bpm": 142,
  "keyScale": "D Minor",
  "language": "sk",
  "projectType": "RECORD_VOICE"
}
```

### `GET /api/projects/[id]`
Retrieves full project details, including all track FX chains and latest AI analyses.

### `PUT /api/projects/[id]`
Updates project properties (title, bpm, key, master volume, status, etc.).

### `DELETE /api/projects/[id]`
Cascades and securely deletes project and associated tracks.

---

## 2. Tracks API

### `POST /api/tracks`
Adds a new audio track to the project timeline.

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "name": "Ad-Libs 2",
  "layerType": "AD_LIBS",
  "color": "#FFD166",
  "volume": 0.75,
  "pan": 0.5,
  "effects": { ... }
}
```

### `PUT /api/tracks`
Updates track properties (volume, pan, muted, soloed, startTime, duration, or DSP FX settings).

### `DELETE /api/tracks?id=[trackId]`
Removes a specific track.

---

## 3. AI Producer & Assistant API

### `POST /api/ai/analyze`
Saves rap rhythm, flow cadence, and energy analysis results to the project.

### `POST /api/ai/assistant`
Context-aware chat endpoint for the AI Music Producer. Proposes structured studio parameter updates.

**Request Body:**
```json
{
  "message": "Sprav môj hlas agresívnejší",
  "projectContext": {
    "title": "Demon Trap Freestyle",
    "genre": "TRAP",
    "bpm": 140
  }
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Navrhujem pridať analógovú páskovú saturáciu (+35% drive)...",
  "action": {
    "type": "UPDATE_FX",
    "layer": "MAIN_VOCAL",
    "changes": {
      "saturation": { "enabled": true, "drive": 35 },
      "compressor": { "ratio": 6.0, "attack": 0.01 },
      "eq": { "mid": 4.0, "midFreq": 3200 }
    }
  }
}
```

---

## 4. Beats & Voice Profiles

### `GET /api/beats`
Returns curated royalty-free hip-hop beats with metadata and license specifications.

### `GET /api/voice-profiles`
Retrieves saved artist vocal profiles and DSP signature presets.

### `POST /api/voice-profiles`
Creates a new vocal identity profile with reference parameters.

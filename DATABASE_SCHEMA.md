# AURA RAP STUDIO – DATABASE SCHEMA

Managed via Prisma ORM.

## Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ VoiceProfile : creates
    Project ||--o{ AudioTrack : contains
    Project ||--o{ AIAnalysis : has
    Project ||--o{ ProjectVersion : snapshots
    Project ||--o{ ProcessingJob : runs
    Project ||--o{ ExportJob : exports

    Project {
        string id PK
        string title
        string language
        string genre
        int bpm
        string keyScale
        string projectType
        string status
        float duration
        float masterVolume
        boolean metronomeOn
        datetime createdAt
        datetime updatedAt
    }

    AudioTrack {
        string id PK
        string projectId FK
        string name
        string layerType
        string color
        float volume
        float pan
        boolean muted
        boolean soloed
        float startTime
        float duration
        int orderIndex
        string assetUrl
        string waveformData
        string effects
    }

    AIAnalysis {
        string id PK
        string projectId FK
        int estimatedBpm
        string flowStyle
        string energy
        string vocalCharacter
        string keyScale
        string chorusLocations
        string adlibLocations
        string styleRecommendation
        string beatRecommendation
    }

    VoiceProfile {
        string id PK
        string userId FK
        string name
        string character
        string preferredGenre
        string preferredFxChain
        string referenceAudioUrl
        string notes
    }
```

## Schema Entities Summary
- **User:** Account & authorization management.
- **Project:** Multitrack workspace metadata, tempo, key, and transport state.
- **AudioTrack:** Track lane definitions, timeline positions, volume/pan, and serialized DSP FX chains.
- **Beat:** Royalty-free beats and AI-generated stems.
- **AIAnalysis:** Real audio flow analysis logs (BPM, cadence, energy).
- **VoiceProfile:** Human voice timbre profile and favorite rap mixing presets.
- **ProjectVersion:** Version snapshots for backup and project rollback.
- **ExportJob & ProcessingJob:** Background audio processing and export tracking.

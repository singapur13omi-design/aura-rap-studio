export type HipHopGenre =
  | 'TRAP'
  | 'DRILL'
  | 'DARK_TRAP'
  | 'HARDCORE'
  | 'BOOM_BAP'
  | 'MELODIC_RAP'
  | 'EMOTIONAL_RAP'
  | 'OLD_SCHOOL'
  | 'GANGSTA_RAP'
  | 'EXPERIMENTAL';

export type LayerType =
  | 'MAIN_VOCAL'
  | 'DOUBLE_VOCAL'
  | 'AD_LIBS'
  | 'BACKING'
  | 'CHORUS'
  | 'HARMONIES'
  | 'INTRO'
  | 'OUTRO'
  | 'BEAT'
  | 'INSTRUMENTAL';

export interface EQBand {
  frequency: number;
  gain: number; // dB
  q: number;
  type: 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch';
}

export interface CompressorSettings {
  threshold: number; // -60 to 0 dB
  ratio: number; // 1 to 20
  attack: number; // 0.001 to 0.5s
  release: number; // 0.01 to 1s
  knee: number; // 0 to 40
}

export interface ReverbSettings {
  enabled: boolean;
  decay: number; // 0.1 to 10s
  preDelay: number; // 0 to 0.1s
  mix: number; // 0 (dry) to 1 (wet)
}

export interface DelaySettings {
  enabled: boolean;
  time: number; // seconds or sync bpm fraction (0.125, 0.25, 0.5)
  feedback: number; // 0 to 0.95
  mix: number; // 0 to 1
  cutoff: number; // Hz damping
}

export interface AutoTuneSettings {
  enabled: boolean;
  key: string; // e.g. "C", "C#", "D", ...
  scale: 'minor' | 'major' | 'pentatonic_minor' | 'chromatic';
  strength: number; // 0 (natural) to 1.0 (hard robot trap)
  speed: number; // 0 (instant autotune) to 100ms
  humanize: number; // 0 to 100%
}

export interface DeEsserSettings {
  enabled: boolean;
  threshold: number; // dB
  frequency: number; // 4000 to 9000 Hz
}

export interface SaturationSettings {
  enabled: boolean;
  drive: number; // 0 to 100%
  warmth: number; // tone warmth
}

export interface TrackFXChain {
  highPassFreq: number; // Hz (typically 80-120Hz for vocals)
  eq: {
    low: number; // dB
    mid: number; // dB
    midFreq: number; // Hz
    high: number; // dB
  };
  compressor: CompressorSettings;
  deEsser: DeEsserSettings;
  saturation: SaturationSettings;
  reverb: ReverbSettings;
  delay: DelaySettings;
  autoTune: AutoTuneSettings;
}

export interface AudioTrackItem {
  id: string;
  projectId: string;
  name: string;
  layerType: LayerType;
  color: string;
  volume: number; // 0 to 1.5
  pan: number; // -1 (L) to +1 (R)
  muted: boolean;
  soloed: boolean;
  startTime: number; // in seconds
  duration: number; // in seconds
  orderIndex: number;
  assetUrl?: string;
  storageType?: string;
  mimeType?: string;
  audioChecksum?: string;
  waveformData?: number[]; // normalized peaks 0..1
  audioBuffer?: AudioBuffer; // live Web Audio buffer
  effects: TrackFXChain;
  isRecording?: boolean;
}

export interface MasteringTarget {
  id: 'STREAMING' | 'LOUD_RAP' | 'DYNAMIC_MASTER' | 'HEAVY_TRAP' | 'CLEAN_MASTER';
  name: string;
  targetLUFS: number; // e.g. -14, -9, -8, -16
  truePeak: number; // dBFS, e.g. -1.0, -0.3
  bassBoost: number; // dB
  stereoSpread: number; // 1.0 = normal, 1.3 = wide
  description: string;
}

export interface AIAnalysisResult {
  estimatedBpm: number;
  detectedKey: string;
  flowStyle: string;
  energy: 'Low' | 'Medium' | 'High' | 'Very High';
  vocalCharacter: string;
  rhymeDensity: string;
  verseSections: { start: number; end: number; type: string }[];
  chorusLocations: { start: number; end: number }[];
  adlibLocations: { start: number; end: number; suggestion: string }[];
  styleRecommendation: HipHopGenre;
  beatRecommendation: string;
}

export interface ProjectData {
  id: string;
  title: string;
  language: string;
  genre: HipHopGenre;
  bpm: number;
  keyScale: string;
  projectType: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  duration: number;
  masterVolume: number;
  metronomeOn: boolean;
  tracks: AudioTrackItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceProfileData {
  id: string;
  name: string;
  character: string;
  preferredGenre: HipHopGenre;
  preferredFxChain: TrackFXChain;
  referenceAudioUrl?: string;
  notes?: string;
}

export type VideoVisualStyle =
  | 'DARK_TRAP'
  | 'UNDERGROUND_STREET'
  | 'LUXURY_RAP'
  | 'CINEMATIC_HIPHOP'
  | 'DRILL_STREET'
  | 'EMOTIONAL_RAP'
  | 'FUTURISTIC_RAP'
  | 'OLD_SCHOOL_HIPHOP'
  | 'NEON_CITY'
  | 'DOCUMENTARY_STYLE';

export interface VideoClipItem {
  id: string;
  name: string;
  startTime: number; // timeline placement in seconds
  duration: number; // clip duration in seconds
  sourceStartTime?: number; // offset within source media
  videoUrl: string;
  thumbnailUrl?: string;
  type: 'AI_SCENE' | 'USER_CLIP' | 'B_ROLL';
  trackIndex: number; // 0 = main video track, 1 = overlay/b-roll
  filterPreset?: string;
  opacity?: number;
  speed?: number;
  textOverlay?: string;
}

export interface VideoSceneItem {
  id: string;
  sceneIndex: number;
  title: string;
  sectionType: string;
  startTime: number;
  endTime: number;
  duration: number;
  visualPrompt: string;
  negativePrompt?: string;
  cameraMovement?: string;
  lightingStyle?: string;
  status: 'PLANNED' | 'GENERATING' | 'READY' | 'FAILED';
  activeVideoUrl?: string;
}

export interface VideoProjectData {
  id: string;
  userId?: string;
  title: string;
  artistName?: string;
  songTitle?: string;
  lyrics?: string;
  visualStyle: VideoVisualStyle;
  aspectRatio: '16:9' | '9:16' | '1:1';
  fps: number;
  resolution: string;
  duration: number;
  audioTrackUrl?: string;
  audioProjectId?: string;
  timelineData?: string;
  status: 'DRAFT' | 'GENERATING' | 'READY' | 'EXPORTING' | 'COMPLETED';
  scenes: VideoSceneItem[];
  clips?: VideoClipItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// AURA COLLAB TYPES
// ==========================================

export type CollabRole = 'OWNER' | 'FEATURE_ARTIST' | 'PRODUCER' | 'SOUND_ENGINEER' | 'SONGWRITER';
export type CollabPermission = 'CAN_RECORD' | 'CAN_LISTEN_ONLY' | 'CO_PRODUCER';
export type CollabStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';
export type CollabTrackStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

export interface CollabMemberItem {
  id: string;
  collabId: string;
  userId: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  role: CollabRole;
  permissions: CollabPermission;
  joinedAt: string;
}

export interface CollabInviteItem {
  id: string;
  collabId: string;
  inviterId: string;
  inviter?: {
    id: string;
    name?: string | null;
    email: string;
  };
  collab?: {
    id: string;
    title: string;
    project?: {
      bpm: number;
      keyScale: string;
      genre: string;
    };
  };
  inviteeEmail?: string | null;
  inviteeUsername?: string | null;
  token: string;
  role: CollabRole;
  permissions: CollabPermission;
  message?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface CollabVersionItem {
  id: string;
  collabTrackId: string;
  versionNumber: number;
  assetUrl: string;
  storageType: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  duration: number;
  timelineOffset: number;
  fileSize: number;
  audioChecksum: string;
  waveform?: string | null;
  notes?: string | null;
  isFinal: boolean;
  createdAt: string;
  comments?: CollabCommentItem[];
}

export interface CollabTrackItem {
  id: string;
  collabId: string;
  uploaderId: string;
  uploader: {
    id: string;
    name?: string | null;
    email: string;
  };
  trackName: string;
  layerType: string;
  timelineOffset: number;
  status: CollabTrackStatus;
  reviewNote?: string | null;
  parentTrackId?: string | null;
  createdAt: string;
  versions: CollabVersionItem[];
}

export interface CollabCommentItem {
  id: string;
  collabId: string;
  userId: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
  versionId?: string | null;
  timestamp?: number | null;
  message: string;
  createdAt: string;
}

export interface CollabCreditSplitItem {
  id: string;
  collabId: string;
  userId?: string | null;
  artistName: string;
  role: string;
  splitPercentage: number;
  confirmed: boolean;
  confirmedAt?: string | null;
  notes?: string | null;
}

export interface CollabNotificationItem {
  id: string;
  collabId: string;
  recipientId: string;
  senderId?: string | null;
  sender?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export interface CollaborationItem {
  id: string;
  projectId: string;
  title: string;
  ownerId: string;
  owner: {
    id: string;
    name?: string | null;
    email: string;
  };
  project: {
    id: string;
    title: string;
    bpm: number;
    keyScale: string;
    genre: string;
    duration: number;
    tracks: any[];
  };
  status: CollabStatus;
  terms?: string | null;
  createdAt: string;
  updatedAt: string;
  members: CollabMemberItem[];
  invites: CollabInviteItem[];
  tracks: CollabTrackItem[];
  splits: CollabCreditSplitItem[];
  comments: CollabCommentItem[];
}

import { MasteringTarget } from '@/types';

export const MASTERING_TARGETS: MasteringTarget[] = [
  {
    id: 'STREAMING',
    name: 'Streaming Standard',
    targetLUFS: -14.0,
    truePeak: -1.0,
    bassBoost: 1.2,
    stereoSpread: 1.1,
    description: 'Optimized for Spotify, Apple Music & YouTube. Zero penalty from loudness normalization.',
  },
  {
    id: 'LOUD_RAP',
    name: 'Loud Rap & Club Master',
    targetLUFS: -9.0,
    truePeak: -0.3,
    bassBoost: 2.5,
    stereoSpread: 1.25,
    description: 'Heavy, loud, modern Hip-Hop master with hard-hitting punch and maximum impact.',
  },
  {
    id: 'HEAVY_TRAP',
    name: 'Heavy Trap & Drill 808',
    targetLUFS: -8.0,
    truePeak: -0.2,
    bassBoost: 3.5,
    stereoSpread: 1.3,
    description: 'Wall of sound with aggressive sub-bass saturation, razor-sharp hats, and loud transients.',
  },
  {
    id: 'DYNAMIC_MASTER',
    name: 'Dynamic Audiophile Rap',
    targetLUFS: -16.0,
    truePeak: -1.5,
    bassBoost: 0.5,
    stereoSpread: 1.05,
    description: 'Preserves full dynamic range, expressive vocal nuances, and acoustic boom-bap depth.',
  },
  {
    id: 'CLEAN_MASTER',
    name: 'Clean Radio Master',
    targetLUFS: -12.0,
    truePeak: -0.5,
    bassBoost: 1.5,
    stereoSpread: 1.15,
    description: 'Balanced, radio-ready polish with crisp vocal presence and controlled low end.',
  },
];

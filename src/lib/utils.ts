import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function formatBarsBeats(seconds: number, bpm: number): string {
  const secondsPerBeat = 60 / bpm;
  const totalBeats = Math.floor(seconds / secondsPerBeat);
  const bars = Math.floor(totalBeats / 4) + 1;
  const beats = (totalBeats % 4) + 1;
  return `${bars}.${beats}`;
}

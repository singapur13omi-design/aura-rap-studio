import { NextResponse } from 'next/server';

export async function GET() {
  const library = [
    {
      id: 'beat-trap-01',
      title: 'Midnight 808 Trap',
      genre: 'TRAP',
      bpm: 140,
      keyScale: 'C Minor',
      duration: 32,
      source: 'BUILT_IN',
      license: 'Royalty Free Commercial License',
      tags: 'Dark, Hard 808, Rolling Hats, Bell Melody',
    },
    {
      id: 'beat-drill-01',
      title: 'London Ghost Drill',
      genre: 'DRILL',
      bpm: 142,
      keyScale: 'D Minor',
      duration: 32,
      source: 'BUILT_IN',
      license: 'Royalty Free Commercial License',
      tags: 'Sliding 808, Syncopated Snare, Dark Strings',
    },
    {
      id: 'beat-boombap-01',
      title: 'Queensbridge 94 Vinyl',
      genre: 'BOOM_BAP',
      bpm: 92,
      keyScale: 'A Minor',
      duration: 32,
      source: 'BUILT_IN',
      license: 'Royalty Free Commercial License',
      tags: 'Vinyl Dust, Heavy Kick, Crisp Snare, Rhodes Chords',
    },
    {
      id: 'beat-melodic-01',
      title: 'Sad Nights Guitar Rap',
      genre: 'MELODIC_RAP',
      bpm: 130,
      keyScale: 'F# Minor',
      duration: 32,
      source: 'BUILT_IN',
      license: 'Royalty Free Commercial License',
      tags: 'Emo Rap, Acoustic Guitar, Punchy 808, Juice Vibe',
    },
    {
      id: 'beat-darktrap-01',
      title: 'Demon Realm 808',
      genre: 'DARK_TRAP',
      bpm: 135,
      keyScale: 'C Minor',
      duration: 32,
      source: 'BUILT_IN',
      license: 'Royalty Free Commercial License',
      tags: 'Distorted Bass, Hard Kick, Reverb Choirs, Ghostemane Vibe',
    },
  ];

  return NextResponse.json({ success: true, beats: library });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const profiles = await prisma.voiceProfile.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, profiles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, character, preferredGenre, preferredFxChain, referenceAudioUrl, notes } = body;

    const profile = await prisma.voiceProfile.create({
      data: {
        name: name || 'My Vocal Profile',
        character: character || 'Gritty Aggressive Rap',
        preferredGenre: preferredGenre || 'TRAP',
        preferredFxChain: typeof preferredFxChain === 'string' ? preferredFxChain : JSON.stringify(preferredFxChain || {}),
        referenceAudioUrl: referenceAudioUrl || null,
        notes: notes || '',
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

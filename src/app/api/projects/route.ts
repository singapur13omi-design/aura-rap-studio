import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateUserAccess, isOwnerEmail } from '@/lib/security';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const whereClause = userId ? { userId } : { userId: null };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        tracks: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    console.error('Failed to fetch projects:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const access = calculateUserAccess(user);
        if (!access.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: 'TRIAL_EXPIRED',
              message:
                'Váš 30-dňový bezplatný prístup vypršal. Pre tvorbu nových skladieb a neobmedzený export si aktivujte predplatné.',
              requiresUpgrade: true,
            },
            { status: 403 }
          );
        }
      }
    }

    const body = await req.json();
    const { title, genre, bpm, keyScale, language, projectType } = body;

    const defaultFX = JSON.stringify({
      highPassFreq: 85,
      eq: { low: 0, mid: 0, midFreq: 2500, high: 0 },
      compressor: { threshold: -20, ratio: 4, attack: 0.02, release: 0.1, knee: 10 },
      deEsser: { enabled: true, threshold: -20, frequency: 6000 },
      saturation: { enabled: false, drive: 0, warmth: 50 },
      reverb: { enabled: true, decay: 1.5, preDelay: 0.02, mix: 0.12 },
      delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.1, cutoff: 3500 },
      autoTune: { enabled: false, key: 'C', scale: 'minor', strength: 0.8, speed: 10, humanize: 20 },
    });

    const project = await prisma.project.create({
      data: {
        title: title || 'Untitled Rap Track',
        genre: genre || 'TRAP',
        bpm: Number(bpm) || 140,
        keyScale: keyScale || 'C Minor',
        language: language || 'sk',
        projectType: projectType || 'RECORD_VOICE',
        status: 'IN_PROGRESS',
        userId: userId || null,
        tracks: {
          create: [
            {
              name: 'Main Vocal',
              layerType: 'MAIN_VOCAL',
              color: '#00E5FF',
              volume: 1.0,
              pan: 0.0,
              orderIndex: 0,
              effects: defaultFX,
            },
            {
              name: 'Double Vocal',
              layerType: 'DOUBLE_VOCAL',
              color: '#A855F7',
              volume: 0.7,
              pan: -0.2,
              orderIndex: 1,
              effects: defaultFX,
            },
            {
              name: 'Ad-Libs & Hype',
              layerType: 'AD_LIBS',
              color: '#EAB308',
              volume: 0.75,
              pan: 0.2,
              orderIndex: 2,
              effects: defaultFX,
            },
            {
              name: '808 Trap Beat',
              layerType: 'BEAT',
              color: '#EF4444',
              volume: 0.85,
              pan: 0.0,
              orderIndex: 3,
              effects: defaultFX,
            },
          ],
        },
      },
      include: {
        tracks: true,
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create project:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

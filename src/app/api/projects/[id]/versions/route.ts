import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId && project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Prístup odmietnutý' }, { status: 403 });
    }

    const versions = await prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, versions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tracks: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId && project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Prístup odmietnutý' }, { status: 403 });
    }

    const body = await req.json();
    const versionName = body.versionName || `Version ${new Date().toLocaleTimeString('sk-SK')}`;
    const snapshotData = body.snapshot || {
      project: {
        title: project.title,
        genre: project.genre,
        bpm: project.bpm,
        keyScale: project.keyScale,
        masterVolume: project.masterVolume,
      },
      tracks: project.tracks.map((t) => ({
        id: t.id,
        name: t.name,
        layerType: t.layerType,
        color: t.color,
        volume: t.volume,
        pan: t.pan,
        muted: t.muted,
        soloed: t.soloed,
        startTime: t.startTime,
        duration: t.duration,
        assetUrl: t.assetUrl,
        storageType: t.storageType,
        audioChecksum: t.audioChecksum,
        effects: t.effects,
      })),
    };

    const version = await prisma.projectVersion.create({
      data: {
        projectId,
        versionName,
        snapshot: JSON.stringify(snapshotData),
      },
    });

    return NextResponse.json({ success: true, version });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

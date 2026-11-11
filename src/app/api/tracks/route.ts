import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const body = await req.json();
    const { id, projectId, name, layerType, color, volume, pan, orderIndex, assetUrl, effects } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Chýba projectId' }, { status: 400 });
    }

    // Verify Project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId && project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte práva k tomuto projektu' },
        { status: 403 }
      );
    }

    const track = await prisma.audioTrack.create({
      data: {
        ...(id ? { id } : {}),
        projectId,
        name: name || 'New Track',
        layerType: layerType || 'MAIN_VOCAL',
        color: color || '#00E5FF',
        volume: volume !== undefined ? Number(volume) : 0.8,
        pan: pan !== undefined ? Number(pan) : 0.0,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : 0,
        assetUrl: assetUrl || null,
        effects: typeof effects === 'string' ? effects : JSON.stringify(effects || {}),
      },
    });

    return NextResponse.json({ success: true, track });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const body = await req.json();
    const { id, name, layerType, color, volume, pan, muted, soloed, startTime, duration, effects, assetUrl } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Chýba track ID' }, { status: 400 });
    }

    // Look up track and verify parent project ownership
    const track = await prisma.audioTrack.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!track) {
      return NextResponse.json({ success: false, error: 'Audio stopa nebola nájdená' }, { status: 404 });
    }

    if (track.project.userId && track.project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte práva upravovať túto stopu' },
        { status: 403 }
      );
    }

    const updated = await prisma.audioTrack.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(layerType !== undefined && { layerType }),
        ...(color !== undefined && { color }),
        ...(volume !== undefined && { volume: Number(volume) }),
        ...(pan !== undefined && { pan: Number(pan) }),
        ...(muted !== undefined && { muted: Boolean(muted) }),
        ...(soloed !== undefined && { soloed: Boolean(soloed) }),
        ...(startTime !== undefined && { startTime: Number(startTime) }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(assetUrl !== undefined && { assetUrl }),
        ...(effects !== undefined && {
          effects: typeof effects === 'string' ? effects : JSON.stringify(effects),
        }),
      },
    });

    return NextResponse.json({ success: true, track: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Track id is required' }, { status: 400 });
    }

    const track = await prisma.audioTrack.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!track) {
      return NextResponse.json({ success: false, error: 'Audio stopa nebola nájdená' }, { status: 404 });
    }

    if (track.project.userId && track.project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte práva vymazať túto stopu' },
        { status: 403 }
      );
    }

    await prisma.audioTrack.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Track deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

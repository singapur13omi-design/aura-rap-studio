import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const project = await prisma.videoProject.findUnique({
      where: { id: params.id },
      include: {
        scenes: { orderBy: { sceneIndex: 'asc' } },
        assets: true,
        exports: true,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Video projekt nebol nájdený / Not found' }, { status: 404 });
    }

    if (project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'PRÍSTUP ODMIETNUTÝ / Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const project = await prisma.videoProject.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Video projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'PRÍSTUP ODMIETNUTÝ' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      artistName,
      songTitle,
      lyrics,
      visualStyle,
      aspectRatio,
      fps,
      resolution,
      duration,
      audioTrackUrl,
      timelineData,
      status,
    } = body;

    const updated = await prisma.videoProject.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(artistName !== undefined && { artistName }),
        ...(songTitle !== undefined && { songTitle }),
        ...(lyrics !== undefined && { lyrics }),
        ...(visualStyle !== undefined && { visualStyle }),
        ...(aspectRatio !== undefined && { aspectRatio }),
        ...(fps !== undefined && { fps: Number(fps) }),
        ...(resolution !== undefined && { resolution }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(audioTrackUrl !== undefined && { audioTrackUrl }),
        ...(timelineData !== undefined && {
          timelineData: typeof timelineData === 'string' ? timelineData : JSON.stringify(timelineData),
        }),
        ...(status !== undefined && { status }),
      },
      include: {
        scenes: { orderBy: { sceneIndex: 'asc' } },
        assets: true,
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const project = await prisma.videoProject.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'PRÍSTUP ODMIETNUTÝ' }, { status: 403 });
    }

    await prisma.videoProject.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, deletedId: params.id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail, calculateVideoAccess } from '@/lib/security';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    if (!userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Neprihlásený používateľ / Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.videoProject.findMany({
      where: isOwner ? {} : { userId },
      include: {
        scenes: { orderBy: { sceneIndex: 'asc' } },
        assets: true,
        exports: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(userEmail);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Neprihlásený používateľ / Unauthorized' }, { status: 401 });
    }

    // Check user video access rights
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Používateľ neexistuje / User not found' }, { status: 404 });
    }

    const access = calculateVideoAccess(user);
    if (!access.allowed && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Prémiový modul uzamknutý / Video Studio Add-on required', requiresAddon: true },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title = 'New Music Video',
      artistName = '13OMI Artist',
      songTitle = '',
      lyrics = '',
      visualStyle = 'DARK_TRAP',
      aspectRatio = '16:9',
      duration = 32.0,
      audioTrackUrl = '',
      audioProjectId = '',
    } = body;

    const newProject = await prisma.videoProject.create({
      data: {
        userId,
        title,
        artistName,
        songTitle: songTitle || title,
        lyrics,
        visualStyle,
        aspectRatio,
        duration: Number(duration) || 32.0,
        audioTrackUrl: audioTrackUrl || null,
        audioProjectId: audioProjectId || null,
        status: 'DRAFT',
      },
      include: {
        scenes: true,
        assets: true,
      },
    });

    return NextResponse.json({ success: true, project: newProject });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

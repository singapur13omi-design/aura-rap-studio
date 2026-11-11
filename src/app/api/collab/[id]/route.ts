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
    const collabId = params.id;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        project: {
          include: {
            tracks: {
              where: { muted: false },
              select: {
                id: true,
                name: true,
                layerType: true,
                color: true,
                volume: true,
                pan: true,
                startTime: true,
                duration: true,
                assetUrl: true,
                mimeType: true,
              },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        invites: {
          orderBy: { createdAt: 'desc' },
        },
        tracks: {
          include: {
            uploader: { select: { id: true, name: true, email: true, image: true } },
            versions: {
              orderBy: { versionNumber: 'desc' },
              include: {
                comments: {
                  include: { user: { select: { id: true, name: true, email: true } } },
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        splits: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { splitPercentage: 'desc' },
        },
      },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    // Access authorization:
    // User must be the owner, a registered member, or the studio OWNER
    const isMember = collab.members.some((m) => m.userId === userId);
    const isCollabOwner = collab.ownerId === userId;

    if (!isCollabOwner && !isMember && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nie ste účastníkom tejto spolupráce' },
        { status: 403 }
      );
    }

    // Determine current user's role and permissions
    const membership = collab.members.find((m) => m.userId === userId);
    const userRole = isCollabOwner ? 'OWNER' : membership?.role || 'FEATURE_ARTIST';
    const userPermissions = isCollabOwner ? 'CO_PRODUCER' : membership?.permissions || 'CAN_RECORD';

    return NextResponse.json({
      success: true,
      collab,
      currentUser: {
        role: userRole,
        permissions: userPermissions,
        isOwner: isCollabOwner || isOwner,
      },
    });
  } catch (err: any) {
    console.error('Error fetching collab details:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const collabId = params.id;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    if (collab.ownerId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Iba majiteľ projektu môže upravovať nastavenia spolupráce' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, status, terms } = body;

    const updated = await prisma.collaboration.update({
      where: { id: collabId },
      data: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(terms !== undefined && { terms }),
      },
    });

    return NextResponse.json({ success: true, collab: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

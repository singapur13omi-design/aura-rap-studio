import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email?.toLowerCase().trim();
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(userEmail);

    if (!userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. My Owned Collaborations
    const ownedCollabs = await prisma.collaboration.findMany({
      where: isOwner ? {} : { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        project: {
          select: { id: true, title: true, bpm: true, keyScale: true, genre: true, duration: true },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        invites: {
          orderBy: { createdAt: 'desc' },
        },
        tracks: {
          include: {
            uploader: { select: { id: true, name: true, email: true } },
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
        splits: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Collaborations where user is a Member (Feature Artist / Co-Producer)
    const memberCollabs = await prisma.collaboration.findMany({
      where: {
        members: { some: { userId } },
        ownerId: { not: userId },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        project: {
          select: { id: true, title: true, bpm: true, keyScale: true, genre: true, duration: true },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        tracks: {
          include: {
            uploader: { select: { id: true, name: true, email: true } },
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
        splits: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 3. Received Invites (matching user email or pending)
    const receivedInvites = userEmail
      ? await prisma.collaborationInvite.findMany({
          where: {
            OR: [
              { inviteeEmail: { equals: userEmail, mode: 'insensitive' } },
            ],
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
          include: {
            inviter: { select: { id: true, name: true, email: true } },
            collab: {
              select: {
                id: true,
                title: true,
                project: { select: { bpm: true, keyScale: true, genre: true } },
              },
            },
          },
        })
      : [];

    // 4. Sent Invites
    const sentInvites = await prisma.collaborationInvite.findMany({
      where: { inviterId: userId },
      include: {
        collab: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 5. Unread Notifications
    const notifications = await prisma.collaborationNotification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return NextResponse.json({
      success: true,
      ownedCollabs,
      memberCollabs,
      receivedInvites,
      sentInvites,
      notifications,
    });
  } catch (err: any) {
    console.error('Error fetching collabs:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    if (!userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Musíte sa prihlásiť' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, title, terms } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Chýba projectId' }, { status: 400 });
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { collaboration: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId && project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nie ste vlastníkom tohto projektu' },
        { status: 403 }
      );
    }

    // If collaboration already exists for this project, return it
    if (project.collaboration) {
      return NextResponse.json({ success: true, collab: project.collaboration, existing: true });
    }

    const collabTitle = title || project.title || 'Untitled Collab';

    const collab = await prisma.collaboration.create({
      data: {
        projectId: project.id,
        title: collabTitle,
        ownerId: userId || project.userId || 'owner',
        terms: terms || 'Standard Aura Collab Terms. Lossless audio feature.',
        status: 'ACTIVE',
        members: {
          create: {
            userId: userId || project.userId || 'owner',
            role: 'OWNER',
            permissions: 'CO_PRODUCER',
          },
        },
        splits: {
          create: {
            userId: userId || project.userId,
            artistName: session?.user?.name || session?.user?.email?.split('@')[0] || 'Main Artist',
            role: 'MAIN_ARTIST',
            splitPercentage: 100.0,
            confirmed: true,
            confirmedAt: new Date(),
          },
        },
      },
      include: {
        members: true,
        splits: true,
      },
    });

    return NextResponse.json({ success: true, collab });
  } catch (err: any) {
    console.error('Error creating collab:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

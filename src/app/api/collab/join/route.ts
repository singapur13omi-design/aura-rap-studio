import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Chýba pozývací token' }, { status: 400 });
    }

    const invite = await prisma.collaborationInvite.findUnique({
      where: { token },
      include: {
        inviter: { select: { id: true, name: true, email: true } },
        collab: {
          select: {
            id: true,
            title: true,
            terms: true,
            project: {
              select: { bpm: true, keyScale: true, genre: true, duration: true },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Pozvánka neexistuje alebo je neplatná' }, { status: 404 });
    }

    const isExpired = new Date() > new Date(invite.expiresAt);
    if (isExpired && invite.status === 'PENDING') {
      await prisma.collaborationInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      invite.status = 'EXPIRED';
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        collabId: invite.collabId,
        collabTitle: invite.collab.title,
        genre: invite.collab.project.genre,
        bpm: invite.collab.project.bpm,
        keyScale: invite.collab.project.keyScale,
        inviterName: invite.inviter.name || invite.inviter.email.split('@')[0],
        role: invite.role,
        permissions: invite.permissions,
        message: invite.message,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Pre prijatie pozvánky sa musíte prihlásiť alebo zaregistrovať', requiresAuth: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Chýba pozývací token' }, { status: 400 });
    }

    const invite = await prisma.collaborationInvite.findUnique({
      where: { token },
      include: { collab: true },
    });

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Pozvánka nebola nájdená' }, { status: 404 });
    }

    if (invite.status === 'ACCEPTED') {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        collabId: invite.collabId,
        message: 'Pozvánka už bola prijatá. Presmerovávam do štúdia...',
      });
    }

    if (new Date() > new Date(invite.expiresAt)) {
      await prisma.collaborationInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { success: false, error: 'Platnosť tejto pozvánky už vypršala' },
        { status: 410 }
      );
    }

    // Add user as CollaborationMember
    await prisma.collaborationMember.upsert({
      where: {
        collabId_userId: {
          collabId: invite.collabId,
          userId,
        },
      },
      create: {
        collabId: invite.collabId,
        userId,
        role: invite.role,
        permissions: invite.permissions,
      },
      update: {
        role: invite.role,
        permissions: invite.permissions,
      },
    });

    // Mark invite as ACCEPTED
    await prisma.collaborationInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Notify project owner
    await prisma.collaborationNotification.create({
      data: {
        collabId: invite.collabId,
        recipientId: invite.collab.ownerId,
        senderId: userId,
        type: 'INVITE_ACCEPTED',
        title: 'Pozvánka prijatá!',
        message: `${session?.user?.name || session?.user?.email || 'Interpret'} prijal vašu pozvánku na spoluprácu na skladbe "${invite.collab.title}".`,
        link: `/collab/${invite.collabId}`,
      },
    });

    return NextResponse.json({
      success: true,
      collabId: invite.collabId,
      role: invite.role,
      permissions: invite.permissions,
    });
  } catch (err: any) {
    console.error('Error joining collab:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

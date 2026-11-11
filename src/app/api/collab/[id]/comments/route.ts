import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const collabId = params.id;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    if (!userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Musíte sa prihlásiť' }, { status: 401 });
    }

    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { members: true },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    const isMember = collab.members.some((m) => m.userId === userId);
    const isCollabOwner = collab.ownerId === userId;

    if (!isCollabOwner && !isMember && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nie ste účastníkom tejto spolupráce' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { message, versionId, timestamp } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Správa nesmie byť prázdna' }, { status: 400 });
    }

    const comment = await prisma.collaborationComment.create({
      data: {
        collabId,
        userId: userId || collab.ownerId,
        versionId: versionId || null,
        timestamp: timestamp !== undefined ? Number(timestamp) : null,
        message: message.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Notify other members
    const otherMembers = collab.members.filter((m) => m.userId !== userId);
    for (const m of otherMembers) {
      await prisma.collaborationNotification.create({
        data: {
          collabId,
          recipientId: m.userId,
          senderId: userId,
          type: 'COMMENT_ADDED',
          title: `Nový komentár: ${collab.title}`,
          message: `${session?.user?.name || 'Účastník'}: "${message.slice(0, 80)}"`,
          link: `/collab/${collabId}`,
        },
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

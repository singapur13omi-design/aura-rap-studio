import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';
import crypto from 'crypto';

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
      include: { owner: true },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    if (collab.ownerId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Iba majiteľ projektu môže posielať pozvánky do spolupráce' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, username, role, permissions, message, expiresInDays } = body;

    // Generate secure cryptographic token
    const token = crypto.randomBytes(24).toString('hex');
    const days = expiresInDays && Number(expiresInDays) > 0 ? Number(expiresInDays) : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invite = await prisma.collaborationInvite.create({
      data: {
        collabId,
        inviterId: userId || collab.ownerId,
        inviteeEmail: email ? email.toLowerCase().trim() : null,
        inviteeUsername: username ? username.trim() : null,
        token,
        role: role || 'FEATURE_ARTIST',
        permissions: permissions || 'CAN_RECORD',
        message: message || `Ahoj! Pozývam ťa ako hosťa (feature) na skladbu "${collab.title}".`,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Check if invitee exists in database to create an in-app notification
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingUser) {
        await prisma.collaborationNotification.create({
          data: {
            collabId,
            recipientId: existingUser.id,
            senderId: userId || collab.ownerId,
            type: 'INVITE_RECEIVED',
            title: `Pozvánka na spoluprácu: ${collab.title}`,
            message: `${session?.user?.name || 'Interpret'} ťa pozval nahrať vokál na skladbu "${collab.title}".`,
            link: `/collab/join?token=${token}`,
          },
        });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aura-rap-studio.vercel.app';
    const inviteUrl = `${appUrl}/collab/join?token=${token}`;

    return NextResponse.json({
      success: true,
      invite,
      inviteUrl,
    });
  } catch (err: any) {
    console.error('Error creating invite:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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

    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { splits: true },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    if (collab.ownerId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Iba majiteľ projektu môže upravovať rozdelenie kreditov a podielov' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artistName, role, splitPercentage, notes, memberUserId } = body;

    if (!artistName || splitPercentage === undefined) {
      return NextResponse.json({ success: false, error: 'Chýba artistName alebo splitPercentage' }, { status: 400 });
    }

    const percentage = Number(splitPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json({ success: false, error: 'Percentuálny podiel musí byť medzi 0 a 100%' }, { status: 400 });
    }

    const split = await prisma.collaborationCreditSplit.create({
      data: {
        collabId,
        userId: memberUserId || null,
        artistName: artistName.trim(),
        role: role || 'FEATURED_ARTIST',
        splitPercentage: percentage,
        notes: notes || undefined,
        confirmed: memberUserId === userId, // Auto-confirmed if created by the same user
        confirmedAt: memberUserId === userId ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      split,
      disclaimer: 'Upozornenie: Technické potvrdenie podielov v aplikácii samo osebe nenahrádza právne platnú licenčnú zmluvu.',
    });
  } catch (err: any) {
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

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Musíte sa prihlásiť' }, { status: 401 });
    }

    const body = await req.json();
    const { splitId, confirm } = body;

    const split = await prisma.collaborationCreditSplit.findUnique({
      where: { id: splitId },
    });

    if (!split || split.collabId !== collabId) {
      return NextResponse.json({ success: false, error: 'Záznam o podiele nebol nájdený' }, { status: 404 });
    }

    // Only the assigned user or the collab owner can confirm
    const updated = await prisma.collaborationCreditSplit.update({
      where: { id: splitId },
      data: {
        confirmed: Boolean(confirm),
        confirmedAt: confirm ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, split: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

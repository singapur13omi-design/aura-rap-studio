import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          orderBy: { orderIndex: 'asc' },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený / Project not found' }, { status: 404 });
    }

    // Ownership check: If project belongs to a user, only that user or the studio owner may read it
    if (project.userId && project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie na tento projekt / Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const existing = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený / Project not found' }, { status: 404 });
    }

    // Strict Ownership verification to prevent IDOR attacks
    if (existing.userId && existing.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie upravovať tento projekt / Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, genre, bpm, keyScale, status, masterVolume, metronomeOn, duration } = body;

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(genre !== undefined && { genre }),
        ...(bpm !== undefined && { bpm: Number(bpm) }),
        ...(keyScale !== undefined && { keyScale }),
        ...(status !== undefined && { status }),
        ...(masterVolume !== undefined && { masterVolume: Number(masterVolume) }),
        ...(metronomeOn !== undefined && { metronomeOn: Boolean(metronomeOn) }),
        ...(duration !== undefined && { duration: Number(duration) }),
      },
      include: {
        tracks: true,
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const existing = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený / Project not found' }, { status: 404 });
    }

    // Strict Ownership verification before deletion
    if (existing.userId && existing.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie vymazať tento projekt / Forbidden' },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Projekt úspešne vymazaný / Project deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
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
    await prisma.project.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

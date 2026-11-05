import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, name, layerType, color, volume, pan, orderIndex, assetUrl, effects } = body;

    const track = await prisma.audioTrack.create({
      data: {
        projectId,
        name: name || 'New Track',
        layerType: layerType || 'MAIN_VOCAL',
        color: color || '#00E5FF',
        volume: volume !== undefined ? Number(volume) : 0.8,
        pan: pan !== undefined ? Number(pan) : 0.0,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : 0,
        assetUrl: assetUrl || null,
        effects: typeof effects === 'string' ? effects : JSON.stringify(effects || {}),
      },
    });

    return NextResponse.json({ success: true, track });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, layerType, color, volume, pan, muted, soloed, startTime, duration, effects, assetUrl } = body;

    const updated = await prisma.audioTrack.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(layerType !== undefined && { layerType }),
        ...(color !== undefined && { color }),
        ...(volume !== undefined && { volume: Number(volume) }),
        ...(pan !== undefined && { pan: Number(pan) }),
        ...(muted !== undefined && { muted: Boolean(muted) }),
        ...(soloed !== undefined && { soloed: Boolean(soloed) }),
        ...(startTime !== undefined && { startTime: Number(startTime) }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(assetUrl !== undefined && { assetUrl }),
        ...(effects !== undefined && {
          effects: typeof effects === 'string' ? effects : JSON.stringify(effects),
        }),
      },
    });

    return NextResponse.json({ success: true, track: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Track id is required' }, { status: 400 });
    }

    await prisma.audioTrack.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Track deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

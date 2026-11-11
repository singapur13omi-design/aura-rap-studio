import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const trackId = (formData.get('trackId') as string) || '';
    const projectId = (formData.get('projectId') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Chýba audio súbor / Missing audio file' }, { status: 400 });
    }

    // Limit audio file size to 35MB
    const MAX_SIZE = 35 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Súbor je príliš veľký (max 35MB) / File too large' },
        { status: 413 }
      );
    }

    // Verify track and ownership if trackId or projectId is provided
    let existingTrack = null;
    if (trackId) {
      existingTrack = await prisma.audioTrack.findUnique({
        where: { id: trackId },
        include: { project: true },
      });
    }

    if (!existingTrack && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (project) {
        if (project.userId && project.userId !== userId && !isOwner) {
          return NextResponse.json(
            { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie nahrávať do tohto projektu' },
            { status: 403 }
          );
        }
        existingTrack = await prisma.audioTrack.create({
          data: {
            ...(trackId ? { id: trackId } : {}),
            projectId,
            name: file.name.replace(/\.[^/.]+$/, '') || 'Recorded Track',
            layerType: 'MAIN_VOCAL',
          },
          include: { project: true },
        });
      }
    } else if (existingTrack) {
      if (existingTrack.project.userId && existingTrack.project.userId !== userId && !isOwner) {
        return NextResponse.json(
          { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie nahrávať do tohto projektu' },
          { status: 403 }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const mimeType = file.type || 'audio/wav';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'wav';
    const safeName = `track_${trackId || 'new'}_${Date.now()}.${ext}`;

    let storageType = 'POSTGRES_BYTEA';
    let assetUrl = `/api/audio/track/${trackId}`;

    // 1. If Vercel Blob storage is configured, attempt upload to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`recordings/${safeName}`, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        storageType = 'VERCEL_BLOB';
        assetUrl = blob.url;
      } catch (blobErr: any) {
        console.warn('Vercel Blob upload failed, falling back to PostgreSQL Bytea cloud storage:', blobErr.message);
      }
    }

    // 2. If trackId exists in DB, persist audio data and track metadata
    if (existingTrack) {
      if (storageType === 'POSTGRES_BYTEA') {
        await prisma.audioTrackBlob.upsert({
          where: { trackId: existingTrack.id },
          create: {
            trackId: existingTrack.id,
            mimeType,
            size: buffer.length,
            data: buffer,
            checksum,
          },
          update: {
            mimeType,
            size: buffer.length,
            data: buffer,
            checksum,
          },
        });
        assetUrl = `/api/audio/track/${existingTrack.id}`;
      }

      await prisma.audioTrack.update({
        where: { id: existingTrack.id },
        data: {
          assetUrl,
          storageType,
          fileSize: buffer.length,
          mimeType,
          audioChecksum: checksum,
        },
      });
    }

    return NextResponse.json({
      success: true,
      trackId: trackId || undefined,
      url: assetUrl,
      storage: storageType,
      size: buffer.length,
      checksum,
    });
  } catch (err: any) {
    console.error('Audio upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Chyba pri ukladaní audia do cloudu' },
      { status: 500 }
    );
  }
}

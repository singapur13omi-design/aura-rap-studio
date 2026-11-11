import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;
    if (!trackId) {
      return NextResponse.json({ success: false, error: 'Chýba track ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    // 1. Fetch track and verify project ownership
    const track = await prisma.audioTrack.findUnique({
      where: { id: trackId },
      include: {
        project: {
          select: { id: true, userId: true, title: true },
        },
        audioBlob: true,
      },
    });

    if (!track) {
      return NextResponse.json(
        { success: false, error: 'Audio stopa nebola nájdená / Track not found' },
        { status: 404 }
      );
    }

    // 2. Strict IDOR protection: only project owner or studio OWNER can access
    if (track.project?.userId && track.project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie k tejto nahrávke / Forbidden' },
        { status: 403 }
      );
    }

    const mimeType = track.mimeType || track.audioBlob?.mimeType || 'audio/wav';

    // 3. Serve from Postgres Bytea storage (cross-device resilient cloud)
    if (track.audioBlob?.data) {
      const buffer = Buffer.from(track.audioBlob.data);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
          'Accept-Ranges': 'bytes',
          'X-Audio-Storage': 'POSTGRES_BYTEA',
          ...(track.audioChecksum && { ETag: `"${track.audioChecksum}"` }),
        },
      });
    }

    // 4. Serve from Vercel Blob cloud if storageType is VERCEL_BLOB
    if (track.assetUrl && track.assetUrl.startsWith('http')) {
      const upstreamRes = await fetch(track.assetUrl);
      if (upstreamRes.ok && upstreamRes.body) {
        return new Response(upstreamRes.body, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': upstreamRes.headers.get('content-length') || (track.fileSize ? track.fileSize.toString() : ''),
            'Cache-Control': 'private, max-age=3600',
            'Accept-Ranges': 'bytes',
            'X-Audio-Storage': 'VERCEL_BLOB',
            ...(track.audioChecksum && { ETag: `"${track.audioChecksum}"` }),
          },
        });
      }
    }

    // 5. Fallback for legacy local disk uploads (development mode)
    if (track.assetUrl && track.assetUrl.startsWith('/uploads/audio/')) {
      const localFilePath = path.join(process.cwd(), 'public', track.assetUrl);
      if (fs.existsSync(localFilePath)) {
        const fileBuf = fs.readFileSync(localFilePath);
        return new Response(fileBuf, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileBuf.length.toString(),
            'Cache-Control': 'private, max-age=3600',
            'Accept-Ranges': 'bytes',
            'X-Audio-Storage': 'LOCAL_PUBLIC',
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Audio súbor nebol nájdený na úložisku / Audio content missing' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('Audio stream error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Chyba pri prehrávaní audia' },
      { status: 500 }
    );
  }
}

export async function HEAD(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const track = await prisma.audioTrack.findUnique({
      where: { id: params.id },
      include: { audioBlob: { select: { size: true, mimeType: true, checksum: true } } },
    });
    if (!track) return new Response(null, { status: 404 });

    const size = track.fileSize || track.audioBlob?.size || 0;
    const mime = track.mimeType || track.audioBlob?.mimeType || 'audio/wav';

    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': size.toString(),
        'Accept-Ranges': 'bytes',
        ...(track.audioChecksum && { ETag: `"${track.audioChecksum}"` }),
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

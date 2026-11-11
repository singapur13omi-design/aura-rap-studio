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
      include: {
        members: true,
        project: true,
      },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    // Verify user is a member with CAN_RECORD or CO_PRODUCER permission, or owner
    const isCollabOwner = collab.ownerId === userId;
    const member = collab.members.find((m) => m.userId === userId);
    const canRecord = isCollabOwner || isOwner || member?.permissions === 'CAN_RECORD' || member?.permissions === 'CO_PRODUCER';

    if (!canRecord) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte oprávnenie nahrávať do tejto spolupráce' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const trackName = (formData.get('trackName') as string) || 'Guest Feature Vocal';
    const timelineOffset = parseFloat((formData.get('timelineOffset') as string) || '0.0');
    const existingCollabTrackId = (formData.get('collabTrackId') as string) || '';
    const notes = (formData.get('notes') as string) || '';
    const sampleRate = parseInt((formData.get('sampleRate') as string) || '44100', 10);
    const bitDepth = parseInt((formData.get('bitDepth') as string) || '16', 10);
    const channels = parseInt((formData.get('channels') as string) || '1', 10);
    const duration = parseFloat((formData.get('duration') as string) || '0.0');

    if (!file) {
      return NextResponse.json({ success: false, error: 'Chýba audio súbor' }, { status: 400 });
    }

    // Limit audio file size to 40MB
    const MAX_SIZE = 40 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'Súbor presahuje limit 40MB' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const mimeType = file.type || 'audio/wav';

    // 1. Upload to Cloud Storage (Vercel Blob if available, or Postgres Bytea)
    let storageType = 'POSTGRES_BYTEA';
    let assetUrl = '';

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const ext = file.name.split('.').pop()?.toLowerCase() || 'wav';
        const blob = await put(`collab/${collabId}/${Date.now()}_take.${ext}`, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        storageType = 'VERCEL_BLOB';
        assetUrl = blob.url;
      } catch (blobErr: any) {
        console.warn('Vercel blob upload fallback to DB:', blobErr.message);
      }
    }

    // 2. Find or create CollaborationTrack
    let collabTrack = null;
    if (existingCollabTrackId) {
      collabTrack = await prisma.collaborationTrack.findUnique({
        where: { id: existingCollabTrackId },
        include: { versions: { orderBy: { versionNumber: 'desc' } } },
      });
    }

    if (!collabTrack) {
      collabTrack = await prisma.collaborationTrack.create({
        data: {
          collabId,
          uploaderId: userId || collab.ownerId,
          trackName,
          layerType: 'FEATURE_VOCAL',
          timelineOffset,
          status: 'SUBMITTED',
        },
        include: { versions: true },
      });
    }

    const nextVersionNum = (collabTrack.versions?.length || 0) + 1;

    // 3. Create AudioTrack record to hold the audio streaming endpoint
    const internalTrack = await prisma.audioTrack.create({
      data: {
        projectId: collab.projectId,
        name: `${trackName} (v${nextVersionNum})`,
        layerType: 'FEATURE_VOCAL',
        startTime: timelineOffset,
        duration: duration || 0.0,
        storageType,
        fileSize: buffer.length,
        mimeType,
        audioChecksum: checksum,
        muted: true, // Initially muted until approved by project owner
      },
    });

    if (storageType === 'POSTGRES_BYTEA') {
      await prisma.audioTrackBlob.create({
        data: {
          trackId: internalTrack.id,
          mimeType,
          size: buffer.length,
          data: buffer,
          checksum,
        },
      });
      assetUrl = `/api/audio/track/${internalTrack.id}`;
      await prisma.audioTrack.update({
        where: { id: internalTrack.id },
        data: { assetUrl },
      });
    } else if (!assetUrl) {
      assetUrl = `/api/audio/track/${internalTrack.id}`;
    }

    // 4. Create CollaborationVersion
    const version = await prisma.collaborationVersion.create({
      data: {
        collabTrackId: collabTrack.id,
        versionNumber: nextVersionNum,
        assetUrl,
        storageType,
        sampleRate,
        bitDepth,
        channels,
        duration: duration || 0.0,
        timelineOffset,
        fileSize: buffer.length,
        audioChecksum: checksum,
        notes: notes || undefined,
        isFinal: false,
      },
    });

    // Update CollabTrack status to SUBMITTED
    await prisma.collaborationTrack.update({
      where: { id: collabTrack.id },
      data: {
        status: 'SUBMITTED',
        timelineOffset,
      },
    });

    // 5. Notify Collab Owner (if uploader is not owner)
    if (!isCollabOwner) {
      await prisma.collaborationNotification.create({
        data: {
          collabId,
          recipientId: collab.ownerId,
          senderId: userId,
          type: 'TRACK_SUBMITTED',
          title: `Nový vokál od ${session?.user?.name || 'Hosťujúceho interpreta'}!`,
          message: `${session?.user?.name || 'Interpret'} odoslal verziu ${nextVersionNum} stopy "${trackName}" (offset ${timelineOffset.toFixed(2)}s).`,
          link: `/collab/${collabId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      collabTrackId: collabTrack.id,
      version,
      checksum,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('Error uploading collab track:', err);
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
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { project: true },
    });

    if (!collab) {
      return NextResponse.json({ success: false, error: 'Spolupráca nebola nájdená' }, { status: 404 });
    }

    if (collab.ownerId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Iba majiteľ projektu môže schváliť alebo odmietnuť nahrávku' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { collabTrackId, versionId, action, reviewNote } = body;

    if (!collabTrackId || !action) {
      return NextResponse.json({ success: false, error: 'Chýba collabTrackId alebo action' }, { status: 400 });
    }

    const track = await prisma.collaborationTrack.findUnique({
      where: { id: collabTrackId },
      include: {
        uploader: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    if (!track) {
      return NextResponse.json({ success: false, error: 'Stopa nebola nájdená' }, { status: 404 });
    }

    const selectedVersion = versionId
      ? track.versions.find((v) => v.id === versionId)
      : track.versions[0];

    let newStatus = 'SUBMITTED';
    if (action === 'APPROVE') {
      newStatus = 'APPROVED';

      // 1. Mark version as final
      if (selectedVersion) {
        await prisma.collaborationVersion.updateMany({
          where: { collabTrackId: track.id },
          data: { isFinal: false },
        });
        await prisma.collaborationVersion.update({
          where: { id: selectedVersion.id },
          data: { isFinal: true },
        });
      }

      // 2. Synchronize into Master Project: un-mute or create track in master project
      let masterTrack = null;
      if (track.parentTrackId) {
        masterTrack = await prisma.audioTrack.update({
          where: { id: track.parentTrackId },
          data: {
            name: `${track.trackName} (${track.uploader.name || 'Feature'})`,
            startTime: selectedVersion ? selectedVersion.timelineOffset : track.timelineOffset,
            duration: selectedVersion ? selectedVersion.duration : 0.0,
            assetUrl: selectedVersion ? selectedVersion.assetUrl : undefined,
            muted: false,
          },
        });
      } else {
        masterTrack = await prisma.audioTrack.create({
          data: {
            projectId: collab.projectId,
            name: `${track.trackName} (${track.uploader.name || 'Feature'})`,
            layerType: 'FEATURE_VOCAL',
            color: '#EC4899',
            volume: 0.85,
            startTime: selectedVersion ? selectedVersion.timelineOffset : track.timelineOffset,
            duration: selectedVersion ? selectedVersion.duration : 0.0,
            assetUrl: selectedVersion ? selectedVersion.assetUrl : undefined,
            muted: false,
          },
        });
        await prisma.collaborationTrack.update({
          where: { id: track.id },
          data: { parentTrackId: masterTrack.id },
        });
      }

      // 3. Notify guest artist of approval
      await prisma.collaborationNotification.create({
        data: {
          collabId,
          recipientId: track.uploaderId,
          senderId: userId,
          type: 'TRACK_APPROVED',
          title: 'Vokál bol schválený!',
          message: `Majiteľ projektu schválil vašu stopu "${track.trackName}". Vokál bol úspešne vložený do finálnej skladby.`,
          link: `/collab/${collabId}`,
        },
      });
    } else if (action === 'REQUEST_REVISION') {
      newStatus = 'REVISION_REQUESTED';
      await prisma.collaborationNotification.create({
        data: {
          collabId,
          recipientId: track.uploaderId,
          senderId: userId,
          type: 'REVISION_REQUESTED',
          title: 'Žiadosť o úpravu nahrávky',
          message: reviewNote || `Majiteľ projektu žiada novú verziu stopy "${track.trackName}".`,
          link: `/collab/${collabId}`,
        },
      });
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
    }

    const updated = await prisma.collaborationTrack.update({
      where: { id: track.id },
      data: {
        status: newStatus,
        reviewNote: reviewNote || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      track: updated,
      status: newStatus,
    });
  } catch (err: any) {
    console.error('Error reviewing collab track:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

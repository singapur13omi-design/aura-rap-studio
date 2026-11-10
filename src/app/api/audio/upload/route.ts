import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isOwnerEmail } from '@/lib/security';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const trackId = (formData.get('trackId') as string) || '';

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'wav';
    const safeName = `track_${trackId || Date.now()}_${Date.now()}.${ext}`;

    // 1. If Vercel Blob storage is configured, upload to cloud
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`recordings/${safeName}`, buffer, {
          access: 'public',
          contentType: file.type || 'audio/wav',
        });
        return NextResponse.json({
          success: true,
          url: blob.url,
          storage: 'VERCEL_BLOB',
          size: file.size,
        });
      } catch (blobErr: any) {
        console.warn('Vercel Blob upload failed, falling back to local/static storage:', blobErr.message);
      }
    }

    // 2. Local filesystem storage fallback (development / self-hosted)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/audio/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      storage: 'LOCAL_PUBLIC',
      size: file.size,
    });
  } catch (err: any) {
    console.error('Audio upload error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Chyba pri ukladaní audia' }, { status: 500 });
  }
}

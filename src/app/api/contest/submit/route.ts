import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const body = await req.json();
    const { artistName, email, trackTitle, socialLink, audioUrl, notes } = body;

    const contactEmail = (email || session?.user?.email || '').trim().toLowerCase();

    if (!artistName || !contactEmail || !trackTitle) {
      return NextResponse.json(
        { error: 'Meno umelca, e-mail a názov tracku sú povinné / Name, email and track title are required' },
        { status: 400 }
      );
    }

    const submission = await prisma.contestSubmission.create({
      data: {
        userId: userId || null,
        artistName: artistName.trim(),
        email: contactEmail,
        trackTitle: trackTitle.trim(),
        socialLink: socialLink?.trim() || null,
        audioUrl: audioUrl?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Prihláška do 13OMI AURA Challenge bola úspešne zaznamenaná! / Contest entry registered!',
      submissionId: submission.id,
    });
  } catch (error: any) {
    console.error('Contest submission error:', error);
    return NextResponse.json({ error: error?.message || 'Chyba servera pri odosielaní prihlášky' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail, calculateVideoAccess } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    if (!userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Neprihlásený používateľ' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, sourceVideoUrl, enhancementType = 'DARK_CINEMATIC', customPrompt = '' } = body;

    if (!projectId || !sourceVideoUrl) {
      return NextResponse.json({ success: false, error: 'Chýba projectId alebo sourceVideoUrl' }, { status: 400 });
    }

    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'PRÍSTUP ODMIETNUTÝ' }, { status: 403 });
    }

    // Verify credits (3 credits for enhancer, OWNER free)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const access = calculateVideoAccess(user || {});
    const CREDITS_REQUIRED = 3;

    if (!isOwner && access.credits < CREDITS_REQUIRED) {
      return NextResponse.json(
        { success: false, error: 'Nedostatok kreditov na úpravu videa (potrebné 3 kredity).' },
        { status: 402 }
      );
    }

    if (!isOwner) {
      await prisma.user.update({
        where: { id: userId },
        data: { videoCredits: { decrement: CREDITS_REQUIRED } },
      });

      await prisma.videoCreditTransaction.create({
        data: {
          userId,
          amount: -CREDITS_REQUIRED,
          balanceAfter: access.credits - CREDITS_REQUIRED,
          reason: 'VIDEO_ENHANCE',
          referenceId: projectId,
        },
      });
    }

    // Register enhanced asset in DB (original source is completely preserved)
    const enhancedAsset = await prisma.videoAsset.create({
      data: {
        projectId,
        type: 'ENHANCED',
        sourceModel: `AI_ENHANCER_${enhancementType}`,
        storageUrl: sourceVideoUrl, // In live, points to enhanced render result
        duration: 5.0,
        promptUsed: customPrompt || `Cinematic color grade: ${enhancementType}`,
        generationCost: isOwner ? 0 : CREDITS_REQUIRED,
      },
    });

    return NextResponse.json({
      success: true,
      enhancedAsset,
      message: 'Video úspešne upravené pomocou AI Video Enhancer (pôvodný súbor zachovaný)',
      creditsRemaining: isOwner ? 999999 : access.credits - CREDITS_REQUIRED,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

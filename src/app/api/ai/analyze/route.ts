import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    const body = await req.json();
    const { projectId, analysisData } = body;

    if (!projectId || !analysisData) {
      return NextResponse.json({ success: false, error: 'Chýba projectId alebo analysisData' }, { status: 400 });
    }

    // Verify Project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId && project.userId !== userId && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'PRÍSTUP ODMIETNUTÝ: Nemáte práva k tomuto projektu' },
        { status: 403 }
      );
    }

    // Increment AI usage counter for user
    if (userId && !isOwner) {
      await prisma.user.update({
        where: { id: userId },
        data: { aiUsageCount: { increment: 1 } },
      });
    }

    const saved = await prisma.aIAnalysis.create({
      data: {
        projectId,
        estimatedBpm: analysisData.estimatedBpm || 140,
        flowStyle: analysisData.flowStyle || 'Aggressive Flow',
        energy: analysisData.energy || 'High',
        vocalCharacter: analysisData.vocalCharacter || 'Deep & Punchy',
        keyScale: analysisData.detectedKey || 'C Minor',
        detectedKey: analysisData.detectedKey || 'C Minor',
        chorusLocations: JSON.stringify(analysisData.chorusLocations || []),
        adlibLocations: JSON.stringify(analysisData.adlibLocations || []),
        styleRecommendation: analysisData.styleRecommendation || 'TRAP',
        beatRecommendation: analysisData.beatRecommendation || 'Heavy 808 Trap Beat',
        rawAnalysisJson: JSON.stringify(analysisData),
      },
    });

    return NextResponse.json({ success: true, analysis: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

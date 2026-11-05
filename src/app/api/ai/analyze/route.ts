import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, analysisData } = body;

    if (!projectId || !analysisData) {
      return NextResponse.json({ success: false, error: 'Missing projectId or analysisData' }, { status: 400 });
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

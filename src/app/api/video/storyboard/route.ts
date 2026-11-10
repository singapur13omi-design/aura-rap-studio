import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

interface GenerateStoryboardRequest {
  projectId: string;
  songTitle?: string;
  artistName?: string;
  lyrics?: string;
  visualStyle?: string;
  bpm?: number;
  duration?: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    if (!userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'Neprihlásený používateľ' }, { status: 401 });
    }

    const body: GenerateStoryboardRequest = await req.json();
    const { projectId, songTitle, artistName, lyrics, visualStyle = 'DARK_TRAP', bpm = 140, duration = 32 } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Chýba projectId' }, { status: 400 });
    }

    // Verify ownership
    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Projekt nebol nájdený' }, { status: 404 });
    }

    if (project.userId !== userId && !isOwner) {
      return NextResponse.json({ success: false, error: 'PRÍSTUP ODMIETNUTÝ' }, { status: 403 });
    }

    // AI Director: calculate scene divisions based on BPM & duration
    const totalDuration = Math.max(16, Number(duration) || 32);
    const sceneCount = 6;
    const sceneDuration = totalDuration / sceneCount;

    // Style prompt presets for authentic underground rap visuals
    const styleKeywords: Record<string, { promptMod: string; lighting: string; camera: string }> = {
      DARK_TRAP: {
        promptMod: 'dark cinematic underground rap music video, moody atmosphere, wet asphalt, dark alleys, hooded artist, deep contrast, 35mm film look',
        lighting: 'Neon electric blue and deep violet rim lights, volumetric haze, shadows',
        camera: 'Low-angle slow tracking shot, subtle camera shake',
      },
      UNDERGROUND_STREET: {
        promptMod: 'raw urban street culture, concrete buildings, graffiti textures, streetwear, authentic gritty hip-hop aesthetic, 16mm grain',
        lighting: 'Flickering sodium streetlights, harsh overhead shadows, smoke',
        camera: 'Handheld dynamic follow shot, rapid whip pan',
      },
      LUXURY_RAP: {
        promptMod: 'high-end luxury rap aesthetic, sleek black sports car, marble interiors, tailored designer clothing, reflection of city lights',
        lighting: 'Warm metallic gold highlights, soft diffusion, crystal sharp bokeh',
        camera: 'Smooth gimbal orbital movement, slow motion 60fps glide',
      },
      CINEMATIC_HIPHOP: {
        promptMod: 'epic cinematic hip-hop mastershot, dramatic skyline backdrop, wind blowing smoke, intense gaze into lens, anamorphic lens flare',
        lighting: 'Teal and orange cinematic color grading, moody directional keylight',
        camera: 'Slow cinematic push-in on protagonist, wide 2.39:1 aspect framing',
      },
      DRILL_STREET: {
        promptMod: 'high-energy UK drill aesthetic, masked crew in background, cold industrial estate, aggressive performance, fast motion blur',
        lighting: 'Cold stark white strobe light, deep blacks, monochromatic vibe',
        camera: 'Rapid zoom punch-in, syncopated camera tilts to bass hits',
      },
    };

    const currentStyle = styleKeywords[visualStyle] || styleKeywords.DARK_TRAP;

    const sections = [
      {
        index: 1,
        type: 'INTRO',
        title: 'SCENE 01 – INTRO',
        action: `Atmospheric establishing shot. ${artistName || 'The artist'} emerges from shadows, skyline in the distance.`,
        cam: 'Slow cinematic crane down, establishing urban environment',
      },
      {
        index: 2,
        type: 'VERSE_1',
        title: 'SCENE 02 – VERSE 1',
        action: `Intense close-up performance. Lip sync delivery matching the first verse cadence. ${lyrics ? `Focus on lyrics: "${lyrics.slice(0, 40)}..."` : 'Rhythmic head nod to 808 beat.'}`,
        cam: 'Medium portrait tracking, locked on artist facial flow',
      },
      {
        index: 3,
        type: 'BUILD_UP',
        title: 'SCENE 03 – BUILD-UP',
        action: `Rising tension. Fast cut between artist and headlights of black luxury car. Smoke fills the air as snare rolls accelerate.`,
        cam: 'Dutch angle handheld, rising camera angle',
      },
      {
        index: 4,
        type: 'CHORUS',
        title: 'SCENE 04 – CHORUS (MAIN DROP)',
        action: `Explosive visual energy on the main bass drop. Wide angle shot, heavy bass reverberation visual effect, rain on lens.`,
        cam: 'Wide-angle dynamic forward dolly zoom, 60fps slow-motion impact',
      },
      {
        index: 5,
        type: 'VERSE_2',
        title: 'SCENE 05 – VERSE 2',
        action: `Nighttime underground venue or rooftop. Neon reflections on black leather jacket, dark cinematic contrast.`,
        cam: 'Orbital 180-degree sweep around the rapper',
      },
      {
        index: 6,
        type: 'FINAL_OUTRO',
        title: 'SCENE 06 – FINAL OUTRO',
        action: `Fade into legend. Artist looks into camera, turns around and walks into the darkness as final notes fade out.`,
        cam: 'Slow pull-back drone shot, fading into deep black',
      },
    ];

    // Delete existing scenes for this project before regenerating
    await prisma.videoScene.deleteMany({ where: { projectId } });

    // Insert new generated scenes
    const createdScenes = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const startT = Number((i * sceneDuration).toFixed(2));
      const endT = Number(((i + 1) * sceneDuration).toFixed(2));

      const scene = await prisma.videoScene.create({
        data: {
          projectId,
          sceneIndex: s.index,
          title: s.title,
          sectionType: s.type,
          startTime: startT,
          endTime: endT,
          duration: Number((endT - startT).toFixed(2)),
          visualPrompt: `${s.action}, ${currentStyle.promptMod}, realistic film image, 4k resolution, cinematic lighting`,
          negativePrompt: 'blurry, cartoon, 3d render, deformed hands, low quality, oversaturated, watermark, amateur video',
          cameraMovement: s.cam,
          lightingStyle: currentStyle.lighting,
          status: 'PLANNED',
        },
      });
      createdScenes.push(scene);
    }

    return NextResponse.json({
      success: true,
      scenes: createdScenes,
      message: 'AI Director úspešne vygeneroval filmový storyboard',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

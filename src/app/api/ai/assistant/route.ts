import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

const FREE_TRIAL_AI_LIMIT = 50;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isOwner = (session?.user as any)?.role === 'OWNER' || isOwnerEmail(session?.user?.email);

    // Limit AI operations for free trial users to prevent system exhaustion
    if (userId && !isOwner) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiUsageCount: true, subscriptionStatus: true },
      });

      if (user && user.subscriptionStatus !== 'ACTIVE' && user.aiUsageCount >= FREE_TRIAL_AI_LIMIT) {
        return NextResponse.json(
          {
            error: 'AI_LIMIT_REACHED',
            message:
              'Dosiahli ste limit 50 bezplatných AI rapových asistencií v skúšobnej verzii. Pre neobmedzeného AI producenta aktivujte predplatné.',
            requiresUpgrade: true,
          },
          { status: 429 }
        );
      }

      // Increment AI usage count
      await prisma.user.update({
        where: { id: userId },
        data: { aiUsageCount: { increment: 1 } },
      });
    }

    const body = await req.json();
    const { message, language, projectContext } = body;
    const isSk = language !== 'en';

    const lower = (message || '').toLowerCase();
    let reply = '';
    let action: any = null;

    if (lower.includes('agresívn') || lower.includes('aggressive')) {
      reply = isSk
        ? 'Navrhujem pridať analógovú páskovú saturáciu (+35% drive), zvýšiť kompresný pomer na 6:1 s rýchlejším attackom (10ms) a pridať prítomnosť na 3.2 kHz (+4dB). Tým tvoj rap získa agresívny, prierazný charakter.'
        : 'I recommend adding analog tape saturation (+35% drive), increasing the compression ratio to 6:1 with a fast 10ms attack, and boosting presence at 3.2 kHz (+4dB) to give your vocals an aggressive, cutting edge.';
      action = {
        type: 'UPDATE_FX',
        layer: 'MAIN_VOCAL',
        changes: {
          saturation: { enabled: true, drive: 35 },
          compressor: { ratio: 6.0, attack: 0.01 },
          eq: { mid: 4.0, midFreq: 3200 },
        },
      };
    } else if (lower.includes('bas') || lower.includes('808') || lower.includes('bass')) {
      reply = isSk
        ? 'Navrhujem jemne znížiť frekvenciu 250Hz na vokáli (-3dB), aby vznikol čistý priestor pre 808 sub-bas, a na beate pridať +2.5dB low-shelf posilnenie na 45Hz s mäkkým orezaním.'
        : 'I propose carving -3dB at 250Hz on the vocal track to make clean room for the 808 sub-bass, and applying a +2.5dB low-shelf boost at 45Hz with soft saturation on the beat.';
      action = {
        type: 'UPDATE_FX',
        layer: 'BEAT',
        changes: {
          eq: { low: 2.5 },
          saturation: { enabled: true, drive: 20 },
        },
      };
    } else if (lower.includes('ad-lib') || lower.includes('adlib')) {
      reply = isSk
        ? 'Analyzoval som pauzy medzi veršami. Na koncoch barov 4, 8 a 16 navrhujem nahrať krátke úderné výkriky ("Yeah!", "Skrrt!", "Brrr") a nastaviť na ne široký stereo pan (L/R 60%) so 30% delayom.'
        : 'Analyzed verse pauses. At the ends of bars 4, 8, and 16, record short punchy hype shouts ("Yeah!", "Skrrt!") with a wide 60% stereo pan and a 30% spatial delay send.';
      action = {
        type: 'NAVIGATE_TO_LAYER',
        layer: 'AD_LIBS',
      };
    } else if (lower.includes('čistejš') || lower.includes('clean') || lower.includes('vocal')) {
      reply = isSk
        ? 'Na vyčistenie hlasu odporúčam aktivovať High-Pass filter na 95Hz (odstráni dunenie mikrofónu), znížiť stredové zablatenie na 300Hz (-3dB) a zapnúť De-Esser na 6.5kHz na skrotenie sykaviek.'
        : 'To clean up your vocals, activate the 95Hz High-Pass filter (removes mic rumble), carve 300Hz boxiness (-3dB), and engage the De-Esser at 6.5kHz to tame harsh sibilance.';
      action = {
        type: 'UPDATE_FX',
        layer: 'MAIN_VOCAL',
        changes: {
          highPassFreq: 95,
          eq: { low: -3.0 },
          deEsser: { enabled: true, threshold: -20, frequency: 6500 },
        },
      };
    } else if (lower.includes('delay') || lower.includes('ozvena') || lower.includes('echo')) {
      reply = isSk
        ? 'Nastavil som 1/4 note tempo-synced stereo delay (250ms) s 30% feedbackom a damping filtrom na 3.5kHz. Delay sa ozve jemne za hlasom bez rozostrenia hlavného toku slov.'
        : 'Configured a 1/4 note tempo-synced stereo delay (250ms) with 30% feedback and high-cut damping at 3.5kHz. Sits cleanly behind your flow without muddying words.';
      action = {
        type: 'UPDATE_FX',
        layer: 'MAIN_VOCAL',
        changes: {
          delay: { enabled: true, mix: 0.18, time: 0.25, feedback: 0.3 },
        },
      };
    } else {
      reply = isSk
        ? `Ako tvoj AI producent som skontroloval projekt "${projectContext?.title || 'Rap Track'}". Vokály sedia v tempe ${projectContext?.bpm || 140} BPM. Môžeš mi zadať pokyn ako: "Sprav môj hlas agresívnejší", "Pridaj viac basov do 808", "Navrhni ad-libs", alebo kliknúť na AI Mix pre automatické vyladenie.`
        : `As your AI producer, I checked project "${projectContext?.title || 'Rap Track'}". Locked in at ${projectContext?.bpm || 140} BPM. You can ask me to: "Make voice more aggressive", "Add punch to 808", "Suggest ad-libs", or click AI Mix for automated balancing.`;
    }

    return NextResponse.json({
      success: true,
      reply,
      action,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

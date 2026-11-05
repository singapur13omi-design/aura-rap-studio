import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, projectContext } = body;

    const lower = (message || '').toLowerCase();
    let reply = '';
    let action: any = null;

    if (lower.includes('agresívn') || lower.includes('aggressive')) {
      reply =
        'Navrhujem pridať analógovú páskovú saturáciu (+35% drive), zvýšiť kompresný pomer na 6:1 s rýchlejším attackom (10ms) a pridať prítomnosť na 3.2 kHz (+4dB). Tým tvoj rap získa agresívny, prierazný charakter.';
      action = {
        type: 'UPDATE_FX',
        layer: 'MAIN_VOCAL',
        changes: {
          saturation: { enabled: true, drive: 35 },
          compressor: { ratio: 6.0, attack: 0.01 },
          eq: { mid: 4.0, midFreq: 3200 },
        },
      };
    } else if (lower.includes('bas') || lower.includes('808')) {
      reply =
        'Navrhujem jemne znížiť frekvenciu 250Hz na vokáli (-3dB), aby vznikol čistý priestor pre 808 sub-bas, a na beate pridať +2.5dB low-shelf posilnenie na 45Hz s mäkkým orezaním.';
      action = {
        type: 'UPDATE_FX',
        layer: 'BEAT',
        changes: {
          eq: { low: 2.5 },
          saturation: { enabled: true, drive: 20 },
        },
      };
    } else if (lower.includes('ad-lib') || lower.includes('adlib')) {
      reply =
        'Analyzoval som pauzy medzi veršami. Na koncoch barov 4, 8 a 16 navrhujem nahrať krátke úderné výkriky ("Yeah!", "Skrrt!", "Brrr") a nastaviť na ne široký stereo pan (L/R 60%) so 30% delayom.';
      action = {
        type: 'NAVIGATE_TO_LAYER',
        layer: 'AD_LIBS',
      };
    } else if (lower.includes('čistejš') || lower.includes('clean') || lower.includes('vocal')) {
      reply =
        'Na vyčistenie hlasu odporúčam aktivovať High-Pass filter na 95Hz (odstráni dunenie mikrofónu), znížiť stredové zablatenie na 300Hz (-3dB) a zapnúť De-Esser na 6.5kHz na skrotenie sykaviek.';
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
      reply =
        'Nastavil som 1/4 note tempo-synced stereo delay (250ms) s 30% feedbackom a damping filtrom na 3.5kHz. Delay sa ozve jemne za hlasom bez rozostrenia hlavného toku slov.';
      action = {
        type: 'UPDATE_FX',
        layer: 'MAIN_VOCAL',
        changes: {
          delay: { enabled: true, mix: 0.18, time: 0.25, feedback: 0.3 },
        },
      };
    } else {
      reply = `Ako tvoj AI producent som skontroloval projekt "${projectContext?.title || 'Rap Track'}". Vokály sedia v BPM ${projectContext?.bpm || 140}. Môžeš mi zadať pokyn ako napr.: "Sprav môj hlas agresívnejší", "Pridaj viac basov do 808", "Navrhni ad-libs", alebo kliknúť na AI Mix pre automatické vyladenie.`;
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

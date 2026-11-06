import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Musíte sa najprv prihlásiť / You must be signed in' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe nie je nakonfigurovaný / Stripe not configured' },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Používateľ zatiaľ nemá aktívne predplatné v Stripe / No active customer record' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://aura-rap-studio.vercel.app';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba pri otváraní zákazníckeho portálu / Customer portal error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, SUBSCRIPTION_PLANS } from '@/lib/stripe';

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
    const userEmail = session.user.email;

    const body = await req.json();
    const { planId } = body;

    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    if (!selectedPlan || selectedPlan.id === 'FREE') {
      return NextResponse.json(
        { error: 'Neplatný plán predplatného / Invalid subscription plan' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        {
          error: 'Stripe API kľúč nie je nakonfigurovaný v .env (STRIPE_SECRET_KEY missing)',
          configured: false,
        },
        { status: 503 }
      );
    }

    // Find current user in DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Používateľ nebol nájdený / User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://aura-rap-studio.vercel.app';

    // Build line items (supports both preset Stripe Price IDs and dynamic price_data)
    const hasPresetPriceId =
      selectedPlan.stripePriceId &&
      selectedPlan.stripePriceId.startsWith('price_') &&
      !selectedPlan.stripePriceId.includes('monthly'); // avoid placeholder string

    const line_items = hasPresetPriceId
      ? [{ price: selectedPlan.stripePriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `AURA RAP STUDIO – ${selectedPlan.name}`,
                description: selectedPlan.tagline,
              },
              unit_amount: Math.round(selectedPlan.priceEur * 100),
              recurring: {
                interval: 'month' as const,
              },
            },
            quantity: 1,
          },
        ];

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      billing_address_collection: 'auto',
      line_items,
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${origin}/?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        userId: user.id,
        planId: selectedPlan.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: selectedPlan.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba pri vytváraní platobnej relácie / Error creating checkout session' },
      { status: 500 }
    );
  }
}

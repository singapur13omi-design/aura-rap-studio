import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In local development or testing without signature verification configured
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId || 'PRO_ARTIST';

        if (userId) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id;

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planId,
              subscriptionStatus: 'ACTIVE',
              stripeCustomerId: (session.customer as string) || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
            },
          });
          console.log(`[Stripe Webhook] User ${userId} upgraded to ${planId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status; // 'active', 'past_due', 'canceled', etc.

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          const mappedStatus =
            status === 'active'
              ? 'ACTIVE'
              : status === 'past_due'
              ? 'PAST_DUE'
              : status === 'canceled'
              ? 'CANCELED'
              : 'TRIALING';

          const planId = subscription.metadata?.planId || user.plan;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: mappedStatus,
              plan: mappedStatus === 'ACTIVE' ? planId : 'FREE',
              stripeSubscriptionId: subscription.id,
              stripeCurrentPeriodEnd: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : null,
            },
          });
          console.log(`[Stripe Webhook] User ${user.id} subscription status: ${mappedStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'FREE',
              subscriptionStatus: 'CANCELED',
            },
          });
          console.log(`[Stripe Webhook] User ${user.id} subscription canceled. Reverted to FREE.`);
        }
        break;
      }

      default:
        // Other events ignored
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

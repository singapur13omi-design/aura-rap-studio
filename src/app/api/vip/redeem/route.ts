import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Pre uplatnenie kódu sa musíte najprv prihlásiť / Sign in required to redeem code' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || '';

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Zadajte kód / Code is required' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Look up VIP or Contest Code in Database
    const vip = await prisma.vipCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!vip || vip.isRevoked) {
      return NextResponse.json(
        { error: 'Neplatný alebo zrušený kód / Invalid or revoked code' },
        { status: 404 }
      );
    }

    if (vip.timesUsed >= vip.maxUses) {
      return NextResponse.json(
        { error: 'Tento kód už bol vyčerpaný / This code has already reached its redemption limit' },
        { status: 409 }
      );
    }

    // Check if this specific user already redeemed this code
    const existingRedemption = await prisma.vipRedemption.findUnique({
      where: {
        codeId_userId: {
          codeId: vip.id,
          userId,
        },
      },
    });

    if (existingRedemption) {
      return NextResponse.json(
        { error: 'Tento kód ste už na svojom účte uplatnili / Code already redeemed on your account' },
        { status: 400 }
      );
    }

    // Atomic transaction: Record redemption, increment counter, extend access
    const result = await prisma.$transaction(async (tx) => {
      // 1. Record redemption
      await tx.vipRedemption.create({
        data: {
          codeId: vip.id,
          userId,
          userEmail,
        },
      });

      // 2. Increment code usage count
      await tx.vipCode.update({
        where: { id: vip.id },
        data: { timesUsed: { increment: 1 } },
      });

      // 3. Extend user trial / VIP period in database
      const newExpiry = new Date(Date.now() + vip.durationDays * 24 * 60 * 60 * 1000);
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          trialEndsAt: newExpiry,
          subscriptionStatus: 'ACTIVE',
          plan: vip.isContest ? 'ANNUAL_PASS' : 'FREE_TRIAL',
        },
        select: {
          id: true,
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
        },
      });

      return { updatedUser, vip };
    });

    return NextResponse.json({
      success: true,
      message: `Kód úspešne aktivovaný na ${result.vip.durationDays} dní! / Code successfully activated!`,
      durationDays: result.vip.durationDays,
      label: result.vip.label,
      trialEndsAt: result.updatedUser.trialEndsAt,
    });
  } catch (error: any) {
    console.error('VIP Redemption error:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba pri uplatňovaní kódu / Error processing code' },
      { status: 500 }
    );
  }
}

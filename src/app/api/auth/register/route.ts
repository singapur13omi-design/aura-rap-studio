import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isOwnerEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Zadajte platnú e-mailovú adresu / Enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Heslo musí mať aspoň 6 znakov / Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Používateľ s týmto e-mailom už existuje / User with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Strict Owner check: ONLY exact match to verified identity
    const isOwner = isOwnerEmail(normalizedEmail);

    const role = isOwner ? 'OWNER' : 'USER';
    const plan = isOwner ? 'OWNER' : 'FREE_TRIAL';
    const subscriptionStatus = isOwner ? 'ACTIVE' : 'TRIALING';

    // 30 Days Trial calculation handled purely on server
    const trialEndsAt = isOwner
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || (isOwner ? '13OMI (Founder)' : normalizedEmail.split('@')[0]),
        passwordHash,
        role,
        plan,
        subscriptionStatus,
        trialEndsAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registrácia úspešná / Registration successful',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Chyba servera pri registrácii / Server error during registration' },
      { status: 500 }
    );
  }
}

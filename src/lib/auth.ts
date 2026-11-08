import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { isOwnerEmail } from './security';

export const authOptions: NextAuthOptions = {
  // @ts-ignore PrismaAdapter types match
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'artist@aurarap.studio' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('MISSING_CREDENTIALS');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          throw new Error('INVALID_CREDENTIALS');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('INVALID_CREDENTIALS');
        }

        // Strict Server-side Owner Check: ONLY exact match to verified owner identity
        const isOwner = user.role === 'OWNER' || isOwnerEmail(user.email);

        return {
          id: user.id,
          email: user.email,
          name: isOwner ? '13OMI (Founder)' : user.name || user.email.split('@')[0],
          role: isOwner ? 'OWNER' : user.role,
          plan: isOwner ? 'OWNER' : user.plan,
          subscriptionStatus: isOwner ? 'ACTIVE' : user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.plan = (user as any).plan || 'FREE_TRIAL';
        token.subscriptionStatus = (user as any).subscriptionStatus || 'TRIALING';
        token.trialEndsAt = (user as any).trialEndsAt || null;
      }

      // If user session update is triggered (e.g. after Stripe checkout or VIP redeem)
      if (trigger === 'update' && session?.plan) {
        token.plan = session.plan;
        token.subscriptionStatus = session.subscriptionStatus;
        if (session.trialEndsAt) token.trialEndsAt = session.trialEndsAt;
      }

      // Periodically refresh plan and trial from DB if user ID is known
      if (token.id && !user) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true, subscriptionStatus: true, role: true, email: true, trialEndsAt: true },
          });
          if (freshUser) {
            const isOwner = freshUser.role === 'OWNER' || isOwnerEmail(freshUser.email);
            token.plan = isOwner ? 'OWNER' : freshUser.plan;
            token.subscriptionStatus = isOwner ? 'ACTIVE' : freshUser.subscriptionStatus;
            token.role = isOwner ? 'OWNER' : freshUser.role;
            token.trialEndsAt = freshUser.trialEndsAt ? freshUser.trialEndsAt.toISOString() : null;
          }
        } catch {
          // ignore db errors on jwt refresh
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || 'USER';
        (session.user as any).plan = token.plan || 'FREE_TRIAL';
        (session.user as any).subscriptionStatus = token.subscriptionStatus || 'TRIALING';
        (session.user as any).trialEndsAt = token.trialEndsAt || null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'aura-rap-studio-super-secret-jwt-key-32chars',
};

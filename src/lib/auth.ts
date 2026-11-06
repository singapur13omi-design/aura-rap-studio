import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: user.role,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.plan = (user as any).plan || 'FREE';
        token.subscriptionStatus = (user as any).subscriptionStatus || 'INACTIVE';
      }

      // If user session update is triggered (e.g. after Stripe checkout)
      if (trigger === 'update' && session?.plan) {
        token.plan = session.plan;
        token.subscriptionStatus = session.subscriptionStatus;
      }

      // Periodically refresh plan from DB if user ID is known
      if (token.id && !user) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true, subscriptionStatus: true, role: true },
          });
          if (freshUser) {
            token.plan = freshUser.plan;
            token.subscriptionStatus = freshUser.subscriptionStatus;
            token.role = freshUser.role;
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
        (session.user as any).plan = token.plan || 'FREE';
        (session.user as any).subscriptionStatus = token.subscriptionStatus || 'INACTIVE';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'aura-rap-studio-super-secret-jwt-key-32chars',
};

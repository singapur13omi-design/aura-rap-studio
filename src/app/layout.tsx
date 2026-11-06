import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'AURA RAP STUDIO – Professional Digital Hip-Hop & Rap Studio',
  description: 'YOUR VOICE. YOUR FLOW. YOUR SOUND. Web-based digital audio workstation for Hip-hop, Trap, Drill and Boom Bap.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

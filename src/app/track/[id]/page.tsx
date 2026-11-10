import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { PublicTrackPlayer } from '@/components/public/PublicTrackPlayer';
import { Flame, Mic, Sparkles, ArrowRight, Music, Headphones, ShieldCheck } from 'lucide-react';

interface TrackPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { title: true, genre: true },
  });

  if (!project) {
    return {
      title: 'Track Not Found | AURA RAP STUDIO',
    };
  }

  return {
    title: `${project.title} | AURA RAP STUDIO - 13OMI`,
    description: `Počúvaj rap track "${project.title}" (${project.genre}) vytvorený a zmixovaný v slovenskom rap štúdiu AURA RAP STUDIO od 13OMI.`,
    openGraph: {
      title: `${project.title} - AURA RAP STUDIO`,
      description: `Počúvaj nový rap track zmixovaný v AURA RAP STUDIO.`,
      images: ['/assets/branding/13omi-original-artwork.jpg'],
    },
  };
}

export default async function PublicTrackPage({ params }: TrackPageProps) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tracks: {
        select: {
          id: true,
          name: true,
          layerType: true,
          assetUrl: true,
          duration: true,
          orderIndex: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!project) {
    return (
      <main className="min-h-screen bg-surface-300 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-aura-red/20 text-aura-red flex items-center justify-center mb-4">
          <Flame className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black mb-2">Track sa nenašiel</h1>
        <p className="text-gray-400 max-w-md mb-6 text-sm">
          Tento track buď neexistuje, alebo bol autorom presunutý. Vytvor si svoj vlastný v AURA RAP STUDIO!
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-aura-blue to-aura-purple text-black font-extrabold text-sm shadow-glow hover:opacity-90 transition-all"
        >
          Otvoriť AURA RAP STUDIO →
        </Link>
      </main>
    );
  }

  const artistName = project.user?.name || '13OMI Underground Artist';

  return (
    <main className="min-h-screen bg-surface-300 text-white flex flex-col selection:bg-aura-purple selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-20 border-b border-surface-50/20 px-6 sm:px-12 flex items-center justify-between bg-surface-300/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aura-blue via-aura-purple to-aura-red flex items-center justify-center font-black text-black text-xl shadow-glow">
            A
          </div>
          <div>
            <div className="font-black text-base tracking-wider flex items-center gap-2">
              <span>AURA</span>
              <span className="text-aura-blue font-mono text-xs">RAP STUDIO</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">13OMI SIGNATURE PLATFORM</span>
          </div>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-aura-red to-aura-purple hover:opacity-95 text-white text-xs font-extrabold shadow-glow-red transition-all"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Nahraj svoj rap</span>
        </Link>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col gap-10">
        {/* Track Player Card */}
        <PublicTrackPlayer
          projectTitle={project.title}
          genre={project.genre}
          bpm={project.bpm}
          keyScale={project.keyScale}
          artistName={artistName}
          tracks={project.tracks}
          projectDuration={project.duration}
        />

        {/* Stem Breakdown */}
        {project.tracks.length > 0 && (
          <div className="bg-surface-200/60 border border-surface-50/30 rounded-2xl p-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-aura-blue" />
              <span>Zloženie tracku ({project.tracks.length} vrstiev)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {project.tracks.map((trk) => (
                <div
                  key={trk.id}
                  className="bg-surface-100/70 border border-surface-50/40 rounded-xl p-3 flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-white truncate">{trk.name}</span>
                  <span className="text-[10px] font-mono text-aura-purple uppercase mt-1">
                    {trk.layerType.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 13OMI Branding & Viral CTA Banner */}
        <div className="bg-gradient-to-br from-surface-200 via-surface-100 to-black/80 border border-surface-50/40 rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shrink-0 border-2 border-aura-red/40 shadow-glow-red">
            <Image
              src="/assets/branding/13omi-original-artwork.jpg"
              alt="13OMI Original Artwork"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-3 flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aura-red/20 text-aura-red border border-aura-red/40 text-[11px] font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>13OMI OFFICIAL SOUND</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Páči sa ti tento zvuk? Vytvor si vlastný track.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              AURA RAP STUDIO je online nahrávacie štúdio s 26 beatmi, automatickým ladením Auto-Tune, 
              AI aranžérom a bezstratovým cloudovým ukladaním. Žiadne sťahovanie, priamo z prehliadača.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-aura-blue to-aura-purple hover:opacity-90 text-black font-extrabold text-xs shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <span>Vstúpiť do štúdia zadarmo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                <ShieldCheck className="w-4 h-4 text-aura-green" />
                <span>30-dňový bezplatný prístup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-surface-50/20 py-8 px-6 text-center text-xs text-gray-500 font-mono">
        © 2026 AURA RAP STUDIO • Founded & Artistic Vision by 13OMI • All Rights Reserved
      </footer>
    </main>
  );
}

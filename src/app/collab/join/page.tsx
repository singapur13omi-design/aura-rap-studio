'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Shield,
  Mic2,
  ArrowRight,
  Flame,
} from 'lucide-react';

function CollabJoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const token = searchParams.get('token');
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Chýba pozývací kód (token).');
      setLoading(false);
      return;
    }

    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/collab/join?token=${token}`);
        const data = await res.json();
        if (data.success && data.invite) {
          setInvite(data.invite);
        } else {
          setError(data.error || 'Pozvánka neexistuje alebo už vypršala.');
        }
      } catch (err: any) {
        setError('Chyba spojenia pri načítaní pozvánky.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!session) {
      // Trigger sign-in
      signIn();
      return;
    }

    setAccepting(true);
    setError(null);
    try {
      const res = await fetch('/api/collab/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success && data.collabId) {
        setAcceptedSuccess(true);
        setTimeout(() => {
          router.push(`/?tab=COLLAB&collabId=${data.collabId}`);
        }, 1200);
      } else {
        setError(data.error || 'Nepodarilo sa prijať pozvánku.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba pri prijímaní pozvánky.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-aura-blue animate-pulse">
          <div className="w-4 h-4 border-2 border-aura-blue border-t-transparent rounded-full animate-spin" />
          <span>Overujem pozvánku na spoluprácu...</span>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111318] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Neplatná pozvánka</h2>
          <p className="text-xs text-gray-400">{error || 'Platnosť tejto pozvánky vypršala alebo bola zrušená.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl bg-surface-300 hover:bg-surface-100 text-xs font-bold text-gray-200 transition"
          >
            Prejsť na AURA RAP STUDIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#111318] border border-brand-electric/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-electric/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-brand-electric/20 text-brand-electric font-mono text-[10px] font-bold tracking-wider uppercase border border-brand-electric/30">
            AURA COLLAB • INVITATION
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <Shield className="w-3 h-3" /> 100% Zadarmo (0 kreditov)
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            {invite.collabTitle}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Pozýva vás: <span className="text-white font-bold">{invite.inviterName}</span>
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-gray-400 mt-2">
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">{invite.genre}</span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">{invite.bpm} BPM</span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">{invite.keyScale}</span>
          </div>
        </div>

        {invite.message && (
          <div className="p-4 bg-black/50 border border-white/10 rounded-xl text-xs text-gray-300 italic">
            &quot;{invite.message}&quot;
          </div>
        )}

        <div className="space-y-2 text-xs text-gray-400 border-t border-[#24262c] pt-4">
          <div className="flex items-center justify-between">
            <span>Pridelená rola:</span>
            <span className="text-white font-semibold font-mono">{invite.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Oprávnenie:</span>
            <span className="text-aura-blue font-semibold font-mono">{invite.permissions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Kvalita prenosu:</span>
            <span className="text-emerald-400 font-semibold font-mono">Lossless 16-bit PCM WAV</span>
          </div>
        </div>

        {acceptedSuccess ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-300">Pozvánka úspešne prijatá!</p>
            <p className="text-xs text-gray-400">Pripravujem nahrávacie štúdio...</p>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-aura-blue via-purple-600 to-pink-600 hover:brightness-110 font-bold text-white text-xs uppercase tracking-wider transition shadow-glow flex items-center justify-center gap-2"
          >
            {accepting ? (
              <span>Pripájam k projektu...</span>
            ) : (
              <>
                <Mic2 className="w-4 h-4" />
                <span>Prijať Pozvánku & Otvoriť Štúdio</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CollabJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center">
          Načítavam...
        </div>
      }
    >
      <CollabJoinContent />
    </Suspense>
  );
}

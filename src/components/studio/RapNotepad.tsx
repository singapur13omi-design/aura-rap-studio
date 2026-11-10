'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  Flame,
  Volume2,
  Play,
  RotateCcw,
  Sliders,
  X,
  Type,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface RapNotepadProps {
  projectId?: string;
  isPlaying?: boolean;
  onClose?: () => void;
  isEmbeddedInModal?: boolean;
}

// Hip-hop rhyme dictionary for Slovak and English rap
const COMMON_RHYMES: Record<string, string[]> = {
  // Slovak rhymes
  flow: ['show', 'low', 'blow', 'glow', 'slow', 'stoj', 'boj', 'tvoj', 'zdroj', 'postoj'],
  hlas: ['čas', 'pas', 'jas', 'zas', 'trás', 'klas', 'has', 'bas', 'nás', 'kontrast'],
  rap: ['trap', 'clap', 'map', 'step', 'track', 'crack', 'fakt', 'kontakt', 'pakt'],
  ulica: ['hranica', 'lavica', 'pľúca', 'horúca', 'chytá ma zima', 'hlavná stanica'],
  beat: ['hit', 'shit', 'fit', 'lit', 'klip', 'trip', 'limit', 'elit'],
  noc: ['moc', 'pomoc', 'ovoc', 'polnoc', 'stokrát viac', 'mesiac'],
  sen: ['deň', 'tieň', 'plameň', 'kameň', 'koreň', 'premeň', 'oheň'],
  svet: ['vpred', 'hneď', 'odpoveď', 'obetovať', 'let', 'stret'],
  brat: ['hrať', 'stáť', 'brať', 'vyhrať', 'pád', 'rad', 'sklad', 'chlad'],
  peniaze: ['reťaze', 'na váhe', 'v prahe', 'zákaze', 'odkaze'],

  // English rhymes
  rhyme: ['time', 'climb', 'prime', 'dime', 'crime', 'grind', 'mind', 'shine'],
  street: ['beat', 'heat', 'feet', 'meet', 'elite', 'repeat', 'complete'],
  game: ['flame', 'fame', 'name', 'claim', 'aim', 'shame', 'same'],
  mic: ['strike', 'like', 'hype', 'pipe', 'tight', 'night', 'flight', 'light'],
  cash: ['dash', 'flash', 'smash', 'crash', 'stash', 'blast', 'fast', 'last'],
};

// Simple syllable counter for SK and EN lyrics
function countSyllables(line: string): number {
  if (!line || !line.trim()) return 0;
  const cleaned = line.trim().toLowerCase();
  // Vowels in Slovak & English
  const vowels = cleaned.match(/[aeiouyáéíóúýäô]/gi);
  return vowels ? vowels.length : 1;
}

export const RapNotepad: React.FC<RapNotepadProps> = ({
  projectId = 'default',
  isPlaying = false,
  onClose,
  isEmbeddedInModal = false,
}) => {
  const { language } = useI18n();
  const isSk = language === 'sk';

  const storageKey = `aura_notepad_lyrics_${projectId}`;
  const [lyrics, setLyrics] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(storageKey) ||
        (isSk
          ? `[INTRO]\nYeah, 13OMI na beate...\nAURA RAP STUDIO, počúvaj ten zvuk.\n\n[VERSE 1]\nKaždý večer píšem bary do noci,\nstratil som strach, už niet pomoci.\nTento flow reže ako ostrá čepeľ,\nzo zeme stúpam hore, čistý popol a popol.\n\n[CHORUS]\nTvoj hlas, tvoj flow, tvoj zvuk,\nnikto ti nevezme to, čo je v tvojich rukách.\n13OMI originál, ulice a chrám,\nz temnoty do svetla, sám sebe pán.\n\n[OUTRO]\n13OMI. AURA STUDIO. 2026.`
          : `[INTRO]\nYeah, 13OMI on the beat...\nAURA RAP STUDIO, feel the underground.\n\n[VERSE 1]\nWriting these bars late into the night,\nTurning my shadows into blinding light.\nFlow so sharp it cuts through the fake,\nEvery single promise that I refuse to break.\n\n[CHORUS]\nYour voice. Your flow. Your sound.\nRising from the underground.\n13OMI signature on the track,\nMoving straight forward, never looking back.`)
      );
    }
    return '';
  });

  const [selectedWord, setSelectedWord] = useState<string>('');
  const [rhymeSuggestions, setRhymeSuggestions] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-save lyrics to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, lyrics);
    }
  }, [lyrics, storageKey]);

  // Handle teleprompter auto-scroll during playback
  useEffect(() => {
    if (!autoScroll || !isPlaying || !textareaRef.current) return;
    const interval = setInterval(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop += 1.5;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [autoScroll, isPlaying]);

  // Handle word selection for rhyme search
  const handleSelectText = () => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;
    const selEnd = textareaRef.current.selectionEnd;
    const sel = lyrics.substring(selStart, selEnd).trim().toLowerCase();

    if (sel.length > 1) {
      searchRhymes(sel);
    }
  };

  const searchRhymes = (word: string) => {
    const clean = word.replace(/[^a-záéíóúýäôčďľňšťž]/gi, '').toLowerCase();
    setSelectedWord(clean);

    if (COMMON_RHYMES[clean]) {
      setRhymeSuggestions(COMMON_RHYMES[clean]);
      return;
    }

    // Heuristic rhyme matching: match last 2 or 3 letters
    const ending2 = clean.slice(-2);
    const ending3 = clean.slice(-3);
    const matches: string[] = [];

    Object.values(COMMON_RHYMES)
      .flat()
      .forEach((w) => {
        if (w !== clean && (w.endsWith(ending3) || w.endsWith(ending2))) {
          if (!matches.includes(w)) matches.push(w);
        }
      });

    if (matches.length > 0) {
      setRhymeSuggestions(matches.slice(0, 8));
    } else {
      // General rap power-words fallback
      setRhymeSuggestions(
        isSk
          ? ['strop', 'blok', 'krok', 'šok', 'tlak', 'vlak', 'znak', 'zrak']
          : ['flow', 'glow', 'glow', 'zone', 'throne', 'stone', 'shown']
      );
    }
  };

  const insertTag = (tag: string) => {
    setLyrics((prev) => `${prev}\n\n[${tag}]\n`);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const copyLyrics = () => {
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = lyrics.split('\n');

  return (
    <div
      className={`flex flex-col bg-brand-carbon border border-brand-concrete rounded-2xl shadow-2xl overflow-hidden ${
        isEmbeddedInModal ? 'h-[320px] w-full' : 'h-full w-full'
      }`}
    >
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-brand-black/90 border-b border-brand-concrete flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-gold" />
          <span className="font-headline text-base tracking-wider text-white">
            {isSk ? 'RAPOVÝ ZÁPISNÍK & RÝMOVNÍK' : 'RAP LYRICS & RHYME NOTEPAD'}
          </span>
          <span className="text-[10px] font-accent text-brand-steel px-2 py-0.5 rounded bg-brand-concrete/60">
            {isSk ? '13OMI WORKFLOW' : 'FLOW BOOTH'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Teleprompter Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg text-[10px] font-accent font-bold uppercase tracking-wider flex items-center gap-1 transition ${
              autoScroll
                ? 'bg-brand-electric text-black shadow-glow'
                : 'bg-brand-concrete/70 text-brand-steel hover:text-white'
            }`}
            title={isSk ? 'Plynulé posúvanie textu počas nahrávania' : 'Auto-scroll during recording'}
          >
            <Play className={`w-3 h-3 ${autoScroll ? 'fill-current' : ''}`} />
            <span>TELEPROMPTER</span>
          </button>

          {/* Copy button */}
          <button
            onClick={copyLyrics}
            className="p-1.5 rounded-lg bg-brand-concrete hover:bg-brand-steel/60 text-brand-steel hover:text-white transition"
            title="Kopírovať text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-brand-concrete text-brand-steel hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Tag Insert Bar */}
      <div className="px-4 py-1.5 bg-brand-black/40 border-b border-brand-concrete/50 flex items-center gap-1.5 overflow-x-auto text-[10px] font-accent font-bold text-brand-steel">
        <span className="text-brand-steel/60 mr-1 uppercase">{isSk ? 'Vložiť:' : 'Insert:'}</span>
        {['INTRO', 'VERSE 1', 'HOOK', 'VERSE 2', 'BRIDGE', 'OUTRO'].map((tag) => (
          <button
            key={tag}
            onClick={() => insertTag(tag)}
            className="px-2 py-0.5 rounded bg-brand-concrete/60 hover:bg-brand-gold hover:text-black transition"
          >
            [{tag}]
          </button>
        ))}
      </div>

      {/* Main Split: Left Lyrics Editor, Right Rhyme Assistant */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Textarea with Syllable counter helper */}
        <div className="flex-1 relative flex">
          <textarea
            ref={textareaRef}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            onSelect={handleSelectText}
            placeholder={
              isSk
                ? 'Napíš svoj text sem... Označ slovo a vpravo sa ti zobrazia rýmy.'
                : 'Write your lyrics here... Highlight any word to see instant rhymes.'
            }
            className="w-full h-full p-4 bg-transparent text-white font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none placeholder-brand-steel/50 selection:bg-brand-gold/30 selection:text-white"
            spellCheck={false}
          />
        </div>

        {/* Right Sidebar: Rhyme Finder & Flow Assistant */}
        <div className="w-48 sm:w-56 bg-brand-black/70 border-l border-brand-concrete/60 p-3 flex flex-col justify-between overflow-y-auto select-none">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-accent font-bold text-brand-gold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSk ? 'RÝMOVNÍK' : 'RHYME FINDER'}</span>
            </div>

            {selectedWord ? (
              <div className="mb-3">
                <span className="text-[10px] text-brand-steel block uppercase">{isSk ? 'Slovo:' : 'Word:'}</span>
                <span className="font-headline text-lg text-brand-electric font-bold tracking-wide">
                  {selectedWord}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-brand-steel/70 leading-relaxed mb-3">
                {isSk
                  ? 'Dvojklikom označ slovo v texte pre okamžité rýmy.'
                  : 'Double-click any word in your lyrics to find rhymes.'}
              </p>
            )}

            {/* Rhyme suggestions chips */}
            {rhymeSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-accent text-brand-steel/80 block uppercase tracking-wider">
                  {isSk ? 'Odporúčané rýmy:' : 'Suggestions:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rhymeSuggestions.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLyrics((prev) => `${prev} ${r}`);
                        if (textareaRef.current) textareaRef.current.focus();
                      }}
                      className="px-2 py-1 rounded bg-brand-concrete hover:bg-brand-gold hover:text-black font-mono text-[11px] text-brand-chrome font-bold transition shadow-sm"
                      title={isSk ? 'Klikni pre vloženie na koniec' : 'Click to append'}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Syllable & Flow helper */}
          <div className="pt-3 border-t border-brand-concrete/60">
            <div className="flex items-center justify-between text-[11px] font-accent text-brand-steel">
              <span>{isSk ? 'Riadkov celkovo:' : 'Total lines:'}</span>
              <span className="font-bold text-white">{lines.length}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-accent text-brand-steel mt-1">
              <span>{isSk ? 'Slov celkovo:' : 'Words:'}</span>
              <span className="font-bold text-brand-gold">
                {lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

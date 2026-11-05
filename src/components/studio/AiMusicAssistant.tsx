'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Check,
  RotateCcw,
  Bot,
  User,
  Sliders,
} from 'lucide-react';
import { ProjectData, AudioTrackItem } from '@/types';

interface AiMusicAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  tracks: AudioTrackItem[];
  onApplyAssistantAction: (action: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: any;
  actionApplied?: boolean;
}

export const AiMusicAssistant: React.FC<AiMusicAssistantProps> = ({
  isOpen,
  onClose,
  project,
  tracks,
  onApplyAssistantAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: `Ahoj! Som tvoj AI hudobný producent pre "${project.title}". Počúvam tvoje vokály a beat (${project.bpm} BPM). Môžeš mi napísať požiadavku, napríklad: "Sprav môj hlas agresívnejší", "Pridaj viac basov do 808", "Navrhni ad-libs", alebo "Vyčisti vokál".`,
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          projectContext: {
            title: project.title,
            genre: project.genre,
            bpm: project.bpm,
            tracksCount: tracks.length,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          action: data.action,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = (msgId: string, action: any) => {
    onApplyAssistantAction(action);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionApplied: true } : m))
    );
  };

  const quickPrompts = [
    'Sprav môj hlas agresívnejší',
    'Pridaj viac basov do 808',
    'Vyčisti vokál a sykavky',
    'Pridaj delay na konce riadkov',
    'Navrhni ad-libs',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-surface-200 border-l border-surface-50/30 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-surface-100 border-b border-surface-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-aura-blue animate-pulse" />
          <h3 className="font-bold text-sm text-white">AI Studio Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.sender === 'user'
                  ? 'bg-aura-blue text-black font-medium'
                  : 'bg-surface-100 text-gray-200 border border-surface-50/30'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>

            {/* Action Proposal Approval Card */}
            {msg.action && (
              <div className="mt-2 w-full max-w-[85%] bg-surface-300 p-3 rounded-xl border border-aura-purple/40 space-y-2">
                <span className="text-[10px] font-mono text-aura-purple font-bold block uppercase flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Navrhovaná úprava parametrov
                </span>
                <p className="text-[11px] text-gray-300">
                  Target: {msg.action.layer || 'Master'}
                </p>

                {msg.actionApplied ? (
                  <span className="text-[10px] font-mono text-aura-green flex items-center gap-1">
                    <Check className="w-3 h-3" /> Zmeny boli úspešne aplikované
                  </span>
                ) : (
                  <button
                    onClick={() => handleApproveAction(msg.id, msg.action)}
                    className="w-full py-1.5 rounded-lg bg-aura-purple hover:bg-aura-purple/90 text-white font-bold text-[11px] shadow-glow-purple transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Schváliť a aplikovať do projektu
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Bot className="w-4 h-4 text-aura-blue animate-spin" />
            <span>AI premýšľa nad rapovým mixom...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-surface-50/20 flex items-center gap-1.5 overflow-x-auto text-[10px] text-gray-400 font-mono">
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            onClick={() => handleSend(qp)}
            className="px-2.5 py-1 bg-surface-100 hover:bg-surface-50 text-gray-300 rounded-full whitespace-nowrap border border-surface-50/30 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-surface-100 border-t border-surface-50/30 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Napíš AI producentovi..."
          className="flex-1 px-3 py-2 bg-surface-200 border border-surface-50/40 rounded-xl text-xs text-white focus:outline-none focus:border-aura-blue"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-aura-blue hover:bg-aura-blue/90 text-black rounded-xl font-bold transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

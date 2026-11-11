'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  Mic2,
  Sparkles,
  Shield,
  FileAudio,
  Send,
  MessageSquare,
  Percent,
  Play,
  Check,
  X,
  Copy,
  ChevronRight,
  ExternalLink,
  Flame,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { CollaborationItem, CollabInviteItem, CollabTrackItem, ProjectData } from '@/types';
import { GuestRecordingStudio } from './GuestRecordingStudio';

interface CollabDashboardProps {
  currentUserId?: string;
  projects?: ProjectData[];
  onOpenProject?: (projectId: string) => void;
}

export const CollabDashboard: React.FC<CollabDashboardProps> = ({
  currentUserId,
  projects = [],
  onOpenProject,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RECEIVED' | 'SENT' | 'COMPLETED'>('ACTIVE');
  const [loading, setLoading] = useState(true);

  // Collab Data
  const [ownedCollabs, setOwnedCollabs] = useState<CollaborationItem[]>([]);
  const [memberCollabs, setMemberCollabs] = useState<CollaborationItem[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CollabInviteItem[]>([]);
  const [sentInvites, setSentInvites] = useState<CollabInviteItem[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCollabForInvite, setSelectedCollabForInvite] = useState<CollaborationItem | null>(null);
  const [activeGuestCollab, setActiveGuestCollab] = useState<CollaborationItem | null>(null);
  const [activeManageCollab, setActiveManageCollab] = useState<CollaborationItem | null>(null);

  // Form states
  const [newCollabProjectId, setNewCollabProjectId] = useState('');
  const [newCollabTitle, setNewCollabTitle] = useState('');
  const [newCollabTerms, setNewCollabTerms] = useState('');
  const [isSubmittingCollab, setIsSubmittingCollab] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteRole, setInviteRole] = useState('FEATURE_ARTIST');
  const [invitePermissions, setInvitePermissions] = useState('CAN_RECORD');
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Manage Collab states (splits, reviews, comments)
  const [reviewNote, setReviewNote] = useState('');
  const [newComment, setNewComment] = useState('');
  const [splitArtistName, setSplitArtistName] = useState('');
  const [splitPercentage, setSplitPercentage] = useState(50);

  const fetchCollabs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/collab');
      const data = await res.json();
      if (data.success) {
        setOwnedCollabs(data.ownedCollabs || []);
        setMemberCollabs(data.memberCollabs || []);
        setReceivedInvites(data.receivedInvites || []);
        setSentInvites(data.sentInvites || []);
      }
    } catch (err) {
      console.error('Failed to load collabs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollabs();
  }, []);

  // Create Collaboration from Project
  const handleCreateCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabProjectId) return;
    setIsSubmittingCollab(true);
    try {
      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: newCollabProjectId,
          title: newCollabTitle,
          terms: newCollabTerms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        fetchCollabs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCollab(false);
    }
  };

  // Send Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollabForInvite) return;
    try {
      const res = await fetch(`/api/collab/${selectedCollabForInvite.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          permissions: invitePermissions,
          message: inviteMessage,
        }),
      });
      const data = await res.json();
      if (data.success && data.inviteUrl) {
        setGeneratedInviteUrl(data.inviteUrl);
        fetchCollabs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept Invite
  const handleAcceptInvite = async (token: string) => {
    try {
      const res = await fetch('/api/collab/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success && data.collabId) {
        fetchCollabs();
        // Automatically open the guest recording studio for this collab
        const fullRes = await fetch(`/api/collab/${data.collabId}`);
        const fullData = await fullRes.json();
        if (fullData.success) {
          setActiveGuestCollab(fullData.collab);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Review Track (Approve / Request Revision)
  const handleReviewTrack = async (collabId: string, trackId: string, action: 'APPROVE' | 'REQUEST_REVISION') => {
    try {
      const res = await fetch(`/api/collab/${collabId}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collabTrackId: trackId,
          action,
          reviewNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCollabs();
        // Refresh active manage collab
        const refresh = await fetch(`/api/collab/${collabId}`);
        const refData = await refresh.json();
        if (refData.success) setActiveManageCollab(refData.collab);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment
  const handleAddComment = async (collabId: string) => {
    if (!newComment.trim()) return;
    try {
      await fetch(`/api/collab/${collabId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newComment }),
      });
      setNewComment('');
      const refresh = await fetch(`/api/collab/${collabId}`);
      const refData = await refresh.json();
      if (refData.success) setActiveManageCollab(refData.collab);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Credit Split
  const handleAddSplit = async (collabId: string) => {
    if (!splitArtistName) return;
    try {
      await fetch(`/api/collab/${collabId}/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: splitArtistName,
          splitPercentage: splitPercentage,
          role: 'FEATURED_ARTIST',
        }),
      });
      setSplitArtistName('');
      const refresh = await fetch(`/api/collab/${collabId}`);
      const refData = await refresh.json();
      if (refData.success) setActiveManageCollab(refData.collab);
    } catch (err) {
      console.error(err);
    }
  };

  // If Guest Studio is open, render Guest Recording Studio
  if (activeGuestCollab) {
    return (
      <div className="p-4 sm:p-6 overflow-y-auto h-full">
        <GuestRecordingStudio
          collab={activeGuestCollab}
          currentUserId={currentUserId}
          onClose={() => {
            setActiveGuestCollab(null);
            fetchCollabs();
          }}
          onVocalSubmitted={() => {
            fetchCollabs();
          }}
        />
      </div>
    );
  }

  const allActiveCollabs = [...ownedCollabs, ...memberCollabs];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 text-white max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d111a] via-[#111318] to-[#121622] p-6 rounded-2xl border border-[#24262c] shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-brand-electric/20 text-brand-electric text-[11px] font-mono font-bold tracking-wider uppercase border border-brand-electric/40">
              CROSS-BORDER MUSIC CREATION
            </span>
            <span className="text-xs text-brand-gold font-mono flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> AURA COLLAB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Štúdiové Spolupráce & Hosťovania
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mt-1">
            Spolupracujte s rappermi a producentmi z celého sveta. Nahrávajte hosťovské vokály v štúdiovej 16-bit PCM WAV kvalite s presnou synchronizáciou na timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aura-blue to-purple-600 hover:brightness-110 font-bold text-xs uppercase tracking-wider text-white transition shadow-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Nová Spolupráca</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#24262c] pb-3">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'ACTIVE'
              ? 'bg-aura-blue/20 text-aura-blue border border-aura-blue/40'
              : 'text-gray-400 hover:text-white hover:bg-surface-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Moje Spolupráce ({allActiveCollabs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIVED')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'RECEIVED'
              ? 'bg-brand-electric/20 text-brand-electric border border-brand-electric/40'
              : 'text-gray-400 hover:text-white hover:bg-surface-300'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Prijaté Pozvánky ({receivedInvites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SENT')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'SENT'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'text-gray-400 hover:text-white hover:bg-surface-300'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Odoslané Pozvánky ({sentInvites.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE COLLABORATIONS */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-4">
          {allActiveCollabs.length === 0 ? (
            <div className="text-center py-12 bg-[#111318] rounded-2xl border border-white/5 space-y-3">
              <Users className="w-10 h-10 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-300">Zatiaľ nemáte žiadne aktívne spolupráce</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Vytvorte novú spoluprácu zo svojho existujúceho projektu v AURA RAP STUDIO a pozvite hosťujúceho interpreta.
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 bg-aura-blue text-black font-bold text-xs rounded-xl shadow-glow hover:brightness-110 transition"
              >
                Vytvoriť prvú spoluprácu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allActiveCollabs.map((collab) => {
                const isOwner = collab.ownerId === currentUserId;
                const submittedTracksCount = collab.tracks?.length || 0;
                const membersCount = collab.members?.length || 1;

                return (
                  <div
                    key={collab.id}
                    className="bg-[#111318] hover:bg-[#14161f] p-5 rounded-2xl border border-[#24262c] transition flex flex-col justify-between space-y-4 shadow-lg hover:border-aura-blue/40"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            isOwner
                              ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
                              : 'bg-aura-blue/20 text-aura-blue border border-aura-blue/40'
                          }`}
                        >
                          {isOwner ? 'MOJA SKLADBA (OWNER)' : 'HOSŤUJÚCI INTERPRET'}
                        </span>

                        <span className="text-[10px] text-gray-500 font-mono">
                          {collab.project.genre} • {collab.project.bpm} BPM
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-2 truncate">{collab.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {collab.terms || 'Bez špeciálnych podmienok. Lossless audio feature.'}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-aura-blue" /> {membersCount} umelci
                        </span>
                        <span className="flex items-center gap-1">
                          <FileAudio className="w-3.5 h-3.5 text-purple-400" /> {submittedTracksCount} stôp
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#24262c] flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCollabForInvite(collab);
                              setInviteModalOpen(true);
                            }}
                            className="flex-1 py-2 rounded-lg bg-[#181a20] hover:bg-[#22252c] text-xs font-bold text-aura-blue border border-aura-blue/30 transition text-center"
                          >
                            + Pozvať Feature
                          </button>
                          <button
                            onClick={() => setActiveManageCollab(collab)}
                            className="flex-1 py-2 rounded-lg bg-aura-blue text-black font-bold text-xs hover:brightness-110 transition text-center shadow-glow"
                          >
                            Spravovať
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setActiveGuestCollab(collab)}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-aura-blue to-purple-600 text-white font-bold text-xs hover:brightness-110 transition flex items-center justify-center gap-2 shadow-glow"
                        >
                          <Mic2 className="w-3.5 h-3.5" />
                          <span>Otvoriť Nahrávacie Štúdio</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECEIVED INVITES */}
      {activeTab === 'RECEIVED' && (
        <div className="space-y-4">
          {receivedInvites.length === 0 ? (
            <div className="text-center py-12 bg-[#111318] rounded-2xl border border-white/5">
              <Mail className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-300">Nemáte žiadne čakajúce pozvánky</h3>
              <p className="text-xs text-gray-500 mt-1">Keď vás iný umelec pozve na hosťovanie, pozvánka sa zobrazí tu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receivedInvites.map((invite) => (
                <div key={invite.id} className="bg-[#111318] p-5 rounded-2xl border border-brand-electric/30 space-y-4 shadow-xl">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-electric/20 text-brand-electric border border-brand-electric/40">
                      POZVÁNKA NA HOSŤOVANIE
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{invite.collab?.title || 'Skladba'}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Pozýva: <span className="text-white font-semibold">{invite.inviter?.name || invite.inviter?.email}</span>
                    </p>
                    {invite.message && (
                      <p className="text-xs text-gray-300 bg-black/40 p-3 rounded-lg border border-white/5 mt-2 italic">
                        &quot;{invite.message}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span>Platnosť do: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                    <span className="text-emerald-400">100% Zadarmo (0 kreditov)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptInvite(invite.token)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-aura-blue to-purple-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition shadow-glow flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Prijať a Nahrávať</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SENT INVITES */}
      {activeTab === 'SENT' && (
        <div className="space-y-4">
          {sentInvites.length === 0 ? (
            <div className="text-center py-12 bg-[#111318] rounded-2xl border border-white/5">
              <Send className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-300">Zatiaľ ste neodoslali žiadne pozvánky</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {sentInvites.map((inv) => {
                const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/join?token=${inv.token}`;
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#111318] rounded-xl border border-[#24262c] gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{inv.collab?.title}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                            inv.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : inv.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Príjemca: {inv.inviteeEmail || 'Súkromný odkaz'} • Rola: {inv.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteLink);
                          alert('Pozývací odkaz skopírovaný do schránky!');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181a20] hover:bg-[#22252c] text-xs font-mono text-gray-300 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopírovať odkaz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE COLLAB */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#24262c] rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24262c] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-aura-blue" /> Vytvoriť novú spoluprácu
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollab} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Vyberte projekt z AURA RAP STUDIO</label>
                <select
                  value={newCollabProjectId}
                  onChange={(e) => {
                    setNewCollabProjectId(e.target.value);
                    const p = projects.find((x) => x.id === e.target.value);
                    if (p) setNewCollabTitle(p.title);
                  }}
                  required
                  className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Vyberte skladbu --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.genre} • {p.bpm} BPM)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Názov spolupráce</label>
                <input
                  type="text"
                  value={newCollabTitle}
                  onChange={(e) => setNewCollabTitle(e.target.value)}
                  placeholder="napr. 13OMI feat. Guest - Demon Flow"
                  required
                  className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Podmienky a inštrukcie pre hosťa</label>
                <textarea
                  rows={3}
                  value={newCollabTerms}
                  onChange={(e) => setNewCollabTerms(e.target.value)}
                  placeholder="napr. Hľadáme agresívnu slohu na 16 barov. Nahrávajte prosím bez reverb efektu priamo v Lossless PCM."
                  className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-300 text-xs font-semibold text-gray-300"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCollab}
                  className="px-5 py-2 rounded-xl bg-aura-blue text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-glow"
                >
                  {isSubmittingCollab ? 'Vytváram...' : 'Vytvoriť Spoluprácu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE FEATURE */}
      {inviteModalOpen && selectedCollabForInvite && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#24262c] rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24262c] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-aura-blue" /> Pozvať hosťa na &quot;{selectedCollabForInvite.title}&quot;
              </h3>
              <button
                onClick={() => {
                  setInviteModalOpen(false);
                  setGeneratedInviteUrl(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedInviteUrl ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Pozvánka bola úspešne vygenerovaná!</h4>
                <p className="text-xs text-gray-400">
                  Pošlite tento súkromný zabezpečený odkaz hosťujúcemu umelcovi:
                </p>

                <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="w-full bg-transparent text-xs font-mono text-aura-blue focus:outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-aura-blue text-black font-bold text-xs rounded-lg shrink-0"
                  >
                    {copiedLink ? 'Skopírované!' : 'Kopírovať'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 block mb-1">E-mail umelca (alebo nechajte prázdne pre súkromný link)</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="artist@aura.com"
                    className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-gray-400 block mb-1">Rola</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="FEATURE_ARTIST">Hosťujúci Rapper (Feature)</option>
                      <option value="PRODUCER">Koproducent (Producer)</option>
                      <option value="SONGWRITER">Autor textu (Songwriter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-gray-400 block mb-1">Oprávnenia</label>
                    <select
                      value={invitePermissions}
                      onChange={(e) => setInvitePermissions(e.target.value)}
                      className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="CAN_RECORD">Nahrávať vokál (Can Record)</option>
                      <option value="CAN_LISTEN_ONLY">Iba počúvať (Listen Only)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-gray-400 block mb-1">Osobná správa</label>
                  <textarea
                    rows={2}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Ahoj, posielam beat, poď nahrať refrén!"
                    className="w-full bg-[#181a20] border border-[#24262c] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-300 text-xs font-semibold text-gray-300"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-aura-blue to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-glow"
                  >
                    Vygenerovať Pozvánku
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: MANAGE COLLABORATION (REVIEWS, TRACK VERSIONS, SPLITS, COMMENTS) */}
      {activeManageCollab && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#24262c] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24262c] pb-3">
              <div>
                <span className="text-[10px] font-mono text-brand-gold font-bold uppercase">
                  MANAGEMENT SPOLUPRÁCE
                </span>
                <h3 className="text-lg font-bold text-white">{activeManageCollab.title}</h3>
              </div>
              <button onClick={() => setActiveManageCollab(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submitted Tracks Review */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-aura-blue" /> Odoslané vokálne stopy od hostí
              </h4>

              {activeManageCollab.tracks?.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center bg-black/30 rounded-xl border border-white/5">
                  Hosťujúci umelci zatiaľ neodoslali žiadne vokálne stopy.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeManageCollab.tracks?.map((trk) => {
                    const latestVersion = trk.versions?.[0];

                    return (
                      <div key={trk.id} className="p-4 bg-[#181a20] rounded-xl border border-[#24262c] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{trk.trackName}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                  trk.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : trk.status === 'REVISION_REQUESTED'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-aura-blue/20 text-aura-blue'
                                }`}
                              >
                                {trk.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Nahral: <span className="text-white font-semibold">{trk.uploader.name || trk.uploader.email}</span> • Offset: {trk.timelineOffset.toFixed(2)}s • Verzia: v{latestVersion?.versionNumber || 1}
                            </p>
                            {latestVersion?.audioChecksum && (
                              <p className="text-[10px] font-mono text-gray-500 truncate max-w-md mt-0.5">
                                SHA-256: {latestVersion.audioChecksum}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {trk.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleReviewTrack(activeManageCollab.id, trk.id, 'APPROVE')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase transition shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              >
                                Schváliť & Vložiť do skladby
                              </button>
                            )}

                            {trk.status === 'SUBMITTED' && (
                              <button
                                onClick={() => handleReviewTrack(activeManageCollab.id, trk.id, 'REQUEST_REVISION')}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition"
                              >
                                Žiadať novú verziu
                              </button>
                            )}
                          </div>
                        </div>

                        {latestVersion?.assetUrl && (
                          <div className="bg-black/40 p-2 rounded-lg flex items-center justify-between">
                            <audio controls src={latestVersion.assetUrl} className="w-full h-8" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Credit Splits & Royalties */}
            <div className="space-y-3 pt-4 border-t border-[#24262c]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-brand-gold" /> Autorské práva & Rozdelenie podielov (Credits Split)
                </h4>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                ⚠️ <span className="font-bold">Právne upozornenie:</span> Technické potvrdenie v aplikácii samo osebe nenahrádza právne platnú zmluvu. Slúži na transparentnú predbežnú dohodu medzi interpretmi.
              </div>

              <div className="space-y-2">
                {activeManageCollab.splits?.map((split) => (
                  <div key={split.id} className="flex items-center justify-between p-2.5 bg-[#181a20] rounded-lg border border-[#24262c]">
                    <div>
                      <span className="text-xs font-bold text-white">{split.artistName}</span>
                      <span className="text-[10px] text-gray-400 font-mono ml-2">({split.role})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-brand-gold">{split.splitPercentage}%</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${split.confirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                        {split.confirmed ? 'POTVRDENÉ' : 'ČAKÁ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Split Form */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Meno interpreta / producenta"
                  value={splitArtistName}
                  onChange={(e) => setSplitArtistName(e.target.value)}
                  className="flex-1 bg-[#181a20] border border-[#24262c] rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={splitPercentage}
                  onChange={(e) => setSplitPercentage(Number(e.target.value))}
                  className="w-20 bg-[#181a20] border border-[#24262c] rounded-lg px-3 py-1.5 text-xs text-white font-mono text-center"
                />
                <button
                  onClick={() => handleAddSplit(activeManageCollab.id)}
                  className="px-3 py-1.5 bg-brand-gold text-black font-bold text-xs rounded-lg shrink-0"
                >
                  Pridať podiel
                </button>
              </div>
            </div>

            {/* Collab Comments */}
            <div className="space-y-3 pt-4 border-t border-[#24262c]">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> Diskusia k projektu
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeManageCollab.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 bg-black/40 rounded-lg border border-white/5 text-xs">
                    <span className="font-bold text-aura-blue">{c.user.name || c.user.email}:</span>{' '}
                    <span className="text-gray-300">{c.message}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Napíšte poznámku alebo pripomienku..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(activeManageCollab.id);
                  }}
                  className="flex-1 bg-[#181a20] border border-[#24262c] rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => handleAddComment(activeManageCollab.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 font-bold text-xs rounded-lg text-white transition"
                >
                  Odoslať
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

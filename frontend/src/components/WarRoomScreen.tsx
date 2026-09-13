import React, { useState, useEffect } from 'react';
import { ScreenId } from '../types';
import {
  calibratePayload,
  getStoredStats,
  TacticianStats,
} from '../services/api';

interface WarRoomScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenAutopsy: () => void;
  showToast: (msg: string) => void;
}

const MODES = [
  { id: 'cold-war', label: 'CALM', emoji: '🧊' },
  { id: 'heated', label: 'DE-ESCALATE', emoji: '🔥' },
  { id: 'passive', label: 'POLITE', emoji: '🙃' },
  { id: 'stonewall', label: 'SHORT & FIRM', emoji: '🧱' },
];

const DEFAULT_PAYLOADS: Record<string, string[]> = {
  'cold-war': [
    '“No stress, get through work! Catch you later this week ✌️”',
    '“Sounds good, let me know when your calendar clears up 👍”',
    '“All clear. Good luck with the crunch, talk soon!”',
    '“No worries at all! Have a great weekend regardless 🥂”',
  ],
  heated: [
    '“Let’s pause this until we can talk in person without typing past each other.”',
    '“I hear your frustration, but let’s stick strictly to what was agreed on Friday.”',
    '“We are both elevated right now. Let’s regroup tomorrow morning with clear heads.”',
  ],
  passive: [
    '“Noted. We can circle back whenever you have bandwidth.”',
    '“Understood! Keep me posted on what works for your schedule.”',
    '“Heard. Best of luck getting through today.”',
  ],
  stonewall: [
    '“Understood.”',
    '“Acknowledged. Talk next week.”',
    '“Received.”',
  ],
};

export const WarRoomScreen: React.FC<WarRoomScreenProps> = ({
  onNavigate,
  onOpenAutopsy,
  showToast,
}) => {
  const [stats, setStats] = useState<TacticianStats>(getStoredStats());
  const [activeMode, setActiveMode] = useState('cold-war');
  const [payloads, setPayloads] = useState<string[]>(DEFAULT_PAYLOADS['cold-war']);
  const [payloadIndex, setPayloadIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    setStats(getStoredStats());
  }, []);

  const handleSelectMode = async (modeId: string) => {
    setActiveMode(modeId);
    setPayloadIndex(0);
    const modeLabel = MODES.find((m) => m.id === modeId)?.label || modeId;
    showToast(`Tone: ${modeLabel}`);

    // Call API to calibrate if online
    setCalibrating(true);
    try {
      const res = await calibratePayload(modeId);
      if (res.variants && res.variants.length > 0) {
        setPayloads(res.variants);
      } else {
        setPayloads(DEFAULT_PAYLOADS[modeId] || DEFAULT_PAYLOADS['cold-war']);
      }
    } catch {
      setPayloads(DEFAULT_PAYLOADS[modeId] || DEFAULT_PAYLOADS['cold-war']);
    } finally {
      setCalibrating(false);
    }
  };

  const currentPayload =
    payloads[payloadIndex % payloads.length] ||
    DEFAULT_PAYLOADS['cold-war'][0];

  const handleCopy = () => {
    const textToCopy = currentPayload.replace(/[“""”]/g, '');
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    showToast('Copied reply to clipboard! 👍');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReroll = () => {
    setPayloadIndex((prev) => (prev + 1) % payloads.length);
    showToast('Loaded another reply option');
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 gap-6 pt-2 pb-36">
      {/* Top Handle & Persona Switcher */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md tracking-tight">{stats.handle}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block"></span>
          </div>
          <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            <span>LEVEL {stats.level} • {stats.clout} POINTS</span>
          </div>
        </div>

        {/* Mode Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" id="mode-selector">
          {MODES.map((mode) => {
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`mode-${mode.id}`}
                onClick={() => handleSelectMode(mode.id)}
                className={`px-4 py-2 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-[2px_2px_0px_#000000]'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-container'
                }`}
              >
                <span>{mode.label}</span>
                <span className="text-sm">{mode.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Stats Strip */}
      <div className="grid grid-cols-3 gap-2 text-center py-1">
        <div className="flex flex-col items-center justify-center p-3 bg-surface-container-lowest rounded-xl shadow-[2px_2px_0px_#000000] gap-1 border border-black/10">
          <span className="font-headline-lg text-headline-lg text-primary">{stats.cleanWins}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
            Good Replies
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-surface-container-lowest rounded-xl shadow-[2px_2px_0px_#000000] gap-1 border border-black/10">
          <span className="font-headline-lg text-headline-lg text-secondary">{stats.fumbleFlags}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
            Drafts Checked
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-surface-container-lowest rounded-xl shadow-[2px_2px_0px_#000000] gap-1 border border-black/10">
          <span className="font-headline-lg text-headline-lg text-on-surface">{stats.meltdowns}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
            Saved Chats
          </span>
        </div>
      </div>

      {/* 2x2 Matrix Module */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-[4px_4px_0px_#000000] border-2 border-black">
        <div className="px-4 py-2 bg-surface-container-low flex items-center justify-between border-b-2 border-black">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            Quick Tools
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">grid_view</span>
        </div>
        <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-black">
          {/* Quadrant 1 */}
          <button
            id="quadrant-receipts"
            onClick={() => onNavigate('drop-receipts')}
            className="p-4 flex flex-col justify-between h-28 hover:bg-secondary-container/40 transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="font-headline-md text-headline-md">Screenshots</span>
              <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">
                receipt_long
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
              Scan text ↗
            </span>
          </button>
          {/* Quadrant 2 */}
          <button
            id="quadrant-fumble"
            onClick={() => onNavigate('fumble-radar')}
            className="p-4 flex flex-col justify-between h-28 hover:bg-secondary-container/40 transition-colors group bg-surface-container-lowest text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="font-headline-md text-headline-md">Check Draft</span>
              <span className="material-symbols-outlined text-[24px] text-error group-hover:scale-110 transition-transform">
                crisis_alert
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-error uppercase tracking-wide font-bold">
              Catch mistakes
            </span>
          </button>
          {/* Quadrant 3 */}
          <button
            id="quadrant-sparring"
            onClick={() => onNavigate('sparring-sandbox')}
            className="p-4 flex flex-col justify-between h-28 hover:bg-secondary-container/40 transition-colors group bg-surface-container-lowest text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="font-headline-md text-headline-md">Practice Chat</span>
              <span className="material-symbols-outlined text-[24px] group-hover:-translate-y-1 transition-transform">
                forum
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
              Try conversations
            </span>
          </button>
          {/* Quadrant 4 */}
          <button
            id="quadrant-draft-detox"
            onClick={() => onNavigate('fumble-radar')}
            className="p-4 flex flex-col justify-between h-28 hover:bg-secondary-container/40 transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="font-headline-md text-headline-md">Shorten Text</span>
              <span className="material-symbols-outlined text-[24px] group-hover:scale-125 transition-transform text-secondary">
                content_cut
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
              Cut long messages
            </span>
          </button>
        </div>
        {/* Neo Ticker Strip */}
        <div className="bg-primary text-on-primary py-2 px-4 flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="text-secondary-fixed text-sm">✨</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wide animate-pulse">
            Tip: Don&apos;t rush to double-text. Give the conversation space to breathe. ✨
          </span>
        </div>
      </div>

      {/* Featured Target Audit Banner */}
      <div className="relative rounded-xl p-5 bg-tertiary-fixed text-on-tertiary-fixed shadow-[4px_4px_0px_#000000] border-2 border-black overflow-hidden">
        <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center rotate-12 shadow-[2px_2px_0px_#000000] border border-black">
          <span className="material-symbols-outlined text-[22px] text-on-secondary-fixed font-bold">
            priority_high
          </span>
        </div>
        <div className="flex flex-col gap-2 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-on-surface uppercase w-fit border border-black/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Message Check
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-tertiary-fixed leading-tight pt-1">
            Single-word “Fine.” Received
          </h2>
          <p className="font-body-sm text-body-sm text-on-tertiary-fixed/90 leading-relaxed mt-1">
            11:04 PM • 34 min delay. Tone: <span className="font-bold">Likely annoyed or closed-off</span>. Pushing for plans right now might cause unnecessary tension.
          </p>
          <div className="mt-4 pt-1 flex items-center justify-between">
            <button
              id="btn-autopsy"
              onClick={onOpenAutopsy}
              className="px-4 py-2.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md uppercase transition-all shadow-[2px_2px_0px_#000000] border border-black active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 hover:bg-secondary-container"
            >
              <span>See Analysis</span>
              <span className="material-symbols-outlined text-[16px]">north_east</span>
            </button>
            <span className="font-label-sm text-label-sm uppercase opacity-75 font-semibold">
              Best to wait before replying
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Move Card */}
      <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[4px_4px_0px_#000000] border-2 border-black flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-label-md text-label-md uppercase font-bold">🎯 Suggested Reply ({activeMode.toUpperCase()})</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold border border-black/10">
            {calibrating ? 'Finding options...' : 'Ready to Send'}
          </span>
        </div>
        <div className="p-4 bg-surface-container-low rounded-xl border border-black/10 min-h-[64px] flex items-center">
          <p className="font-body-lg text-body-lg text-on-surface italic font-medium leading-relaxed" id="payload-text">
            {currentPayload}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            id="copy-payload-btn"
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check_circle' : 'content_copy'}
            </span>
            <span id="copy-btn-text">
              {copied ? 'COPIED TO CLIPBOARD!' : 'Copy Reply'}
            </span>
          </button>
          <button
            id="reroll-payload-btn"
            onClick={handleReroll}
            className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-secondary-container transition-colors cursor-pointer border border-black/10"
            title="Get another reply option"
          >
            <span className="material-symbols-outlined text-[20px]">cached</span>
          </button>
        </div>
      </div>

      {/* Interactive Sandbox Quick Tap */}
      <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[2px_2px_0px_#000000] border border-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0 border border-black">
            <span className="material-symbols-outlined text-[22px] text-on-secondary-fixed">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md leading-tight">Have a tricky text?</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Upload a screenshot to get advice</span>
          </div>
        </div>
        <button
          id="btn-quick-scan"
          onClick={() => onNavigate('drop-receipts')}
          className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase hover:bg-primary hover:text-on-primary transition-all shrink-0 border border-black/20 cursor-pointer font-bold"
        >
          Scan
        </button>
      </div>
    </div>
  );
};

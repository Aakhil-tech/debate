import React, { useState, useEffect } from 'react';
import { ScreenId } from '../types';
import { analyzeDraft, FumbleAnalysisResult, recordFumble } from '../services/api';

interface FumbleScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onLaunchSparring?: (topic: string) => void;
  showToast: (msg: string) => void;
  initialDraft?: string;
}

const DEFAULT_DRAFT =
  "Honestly it feels like you never actually want to see me anymore and you're just making excuses because if you wanted to you would...";

const DEFAULT_COUNTERMEASURES = [
  '“No stress, get through work! Catch you later this week ✌️”',
  '“All good! Have fun with the grind, let me know when you resurface 🫡”',
  '“No worries at all. Let me know when you have breathing room ⚡”',
  '“Heard! Kill it at work, talk over the weekend 👍”',
];

export const FumbleScreen: React.FC<FumbleScreenProps> = ({
  onNavigate,
  onLaunchSparring,
  showToast,
  initialDraft,
}) => {
  const [draft, setDraft] = useState(initialDraft || DEFAULT_DRAFT);
  const [isIncinerated, setIsIncinerated] = useState(false);
  const [countermeasureIdx, setCountermeasureIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (initialDraft && initialDraft !== draft) {
      setDraft(initialDraft);
      setIsIncinerated(false);
      handleAnalyzeDraft(initialDraft);
    }
  }, [initialDraft]);

  const [analysisResult, setAnalysisResult] = useState<FumbleAnalysisResult>({
    threatLevel: 4,
    fumblePct: 92,
    survivalChance: 8,
    cringeKb: '0.44',
    dignityDeficit: '-58% Frame Loss',
    panicTriggers: ['Paragraph Bloat', 'Emotional Referendum', 'Over-apologizing'],
    tacticalCritique:
      'You are actively converting a simple “I am busy” into an existential relationship referendum. Stand down.',
    safeCountermeasures: DEFAULT_COUNTERMEASURES,
  });

  const charCount = draft.length;
  const cringeKb = (charCount * 0.00032).toFixed(2);

  // Function to run real AI analysis on draft
  const handleAnalyzeDraft = async (textToScan: string) => {
    if (!textToScan.trim()) {
      showToast('Draft is empty');
      return;
    }
    setAnalyzing(true);
    showToast('Checking draft tone and clarity...');
    try {
      const result = await analyzeDraft(textToScan);
      setAnalysisResult(result);
      showToast(`Check Complete: Risk level ${result.threatLevel}/5`);
    } catch (err: any) {
      console.error('Draft analysis error:', err);
      showToast('Draft check complete.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (initialDraft && initialDraft !== DEFAULT_DRAFT) {
      setDraft(initialDraft);
      handleAnalyzeDraft(initialDraft);
    }
  }, [initialDraft]);

  const handleDetonate = () => {
    setIsIncinerated(true);
    recordFumble();
    showToast('💥 Draft discarded! Disaster averted.');
  };

  const handleReset = () => {
    setIsIncinerated(false);
    setDraft(DEFAULT_DRAFT);
    showToast('Ready for a new draft');
  };

  const activeCountermeasures =
    analysisResult.safeCountermeasures && analysisResult.safeCountermeasures.length > 0
      ? analysisResult.safeCountermeasures
      : DEFAULT_COUNTERMEASURES;

  const currentCountermeasure =
    activeCountermeasures[countermeasureIdx % activeCountermeasures.length];

  const handleCopyReplacement = () => {
    const text = currentCountermeasure.replace(/[“""”]/g, '');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    showToast('Copied reply to clipboard! 👍');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwapReplacement = () => {
    setCountermeasureIdx((prev) => (prev + 1) % activeCountermeasures.length);
    showToast('Loaded another reply option');
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 gap-6 pt-2 pb-36">
      {/* Sub-Header & Live Threat Indicator */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Check Draft
            </span>
            <span className="text-headline-lg">🛑</span>
          </div>
          <button
            onClick={() => handleAnalyzeDraft(draft)}
            disabled={analyzing || isIncinerated}
            className="px-3 py-1 bg-secondary-container text-on-secondary-fixed rounded-full font-label-sm uppercase font-bold text-xs flex items-center gap-1 border border-black/10 hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[14px] ${analyzing ? 'animate-spin' : ''}`}>
              {analyzing ? 'autorenew' : 'radar'}
            </span>
            <span>{analyzing ? 'CHECKING...' : 'CHECK DRAFT'}</span>
          </button>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Before you send that long message in the heat of the moment, check it here first.
        </p>
      </div>

      {/* Live Blast Chamber (Card Container) */}
      <div
        id="blast-chamber"
        className={`flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#000000] border-2 border-black transition-all duration-300 gap-4 ${
          isIncinerated ? 'scale-[0.99] border-error/60' : ''
        }`}
      >
        {/* Chamber Meta Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-error font-bold">crisis_alert</span>
            <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold">
              DRAFT INSPECTION
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold">
            {charCount} CHARACTERS
          </span>
        </div>

        {/* Live Text Area Container */}
        <div className="py-1 flex flex-col gap-2">
          <div className="relative bg-surface-container-low rounded-xl p-4 border border-black/10">
            {isIncinerated ? (
              <div className="space-y-2">
                <span className="line-through opacity-40 font-body-lg text-body-lg text-on-surface font-medium leading-relaxed block">
                  &ldquo;{draft}&rdquo;
                </span>
                <span className="text-error font-bold uppercase tracking-wider font-label-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  💥 DRAFT DISCARDED (GOOD CALL!)
                </span>
              </div>
            ) : isEditing ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full bg-transparent font-body-lg text-body-lg text-on-surface font-medium outline-none resize-none border-b border-black/20 pb-2"
                placeholder="Paste the message you were about to send..."
              />
            ) : (
              <div
                id="draft-text"
                onClick={() => setIsEditing(true)}
                className="font-body-lg text-body-lg text-on-surface font-medium leading-relaxed cursor-text"
                title="Click to edit or paste your own message"
              >
                &ldquo;{draft}&rdquo;
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error text-on-error font-label-sm text-label-sm uppercase tracking-wider font-bold">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                RISK LEVEL {analysisResult.threatLevel}/5
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      handleAnalyzeDraft(draft);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="text-xs text-on-surface-variant hover:text-black uppercase font-bold underline cursor-pointer"
                >
                  {isEditing ? 'Check & Done' : 'Edit Draft'}
                </button>
                <span className="font-label-sm text-label-sm text-outline font-bold">
                  High Emotion
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panic Triggers Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {analysisResult.panicTriggers.map((trigger, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-surface-container rounded-full text-xs font-bold uppercase text-on-surface border border-black/10 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[12px] text-error">flag</span>
              <span>{trigger}</span>
            </span>
          ))}
        </div>

        {/* Threat Gauge Progress Bar */}
        <div className="flex flex-col gap-2 pt-1 pb-1">
          <div className="flex items-center justify-between font-label-md text-label-md">
            <span className="text-error font-bold flex items-center gap-1.5">
              <span>{analysisResult.fumblePct}% RISK OF TENSION</span>
              <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
              CALM OUTCOME: {analysisResult.survivalChance}%
            </span>
          </div>
          {/* Segmented Bar based on threat level */}
          <div className="grid grid-cols-5 gap-1.5 w-full h-3">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`rounded-full transition-all ${
                  lvl <= analysisResult.threatLevel
                    ? 'bg-error'
                    : 'bg-surface-container-high'
                } ${lvl === analysisResult.threatLevel ? 'animate-pulse' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Primary Incinerator CTA */}
        <div className="pt-1 flex flex-col gap-2">
          {isIncinerated ? (
            <div className="flex items-center gap-2">
              <button
                id="detonate-btn-done"
                disabled
                className="flex-1 py-4 px-4 rounded-full bg-surface-container-highest text-on-surface-variant font-headline-md text-headline-md uppercase tracking-tight flex items-center justify-center gap-2 border border-black/10 cursor-not-allowed font-bold"
              >
                <span className="material-symbols-outlined text-[20px] text-error">check_circle</span>
                <span>DRAFT DISCARDED</span>
              </button>
              <button
                id="btn-rearm-chamber"
                onClick={handleReset}
                className="px-4 py-4 rounded-full bg-primary text-on-primary font-label-md uppercase tracking-wider hover:bg-surface-container-high hover:text-black transition-colors border border-black cursor-pointer font-bold"
                title="Try another draft"
              >
                New Draft
              </button>
            </div>
          ) : (
            <button
              id="detonate-btn"
              onClick={handleDetonate}
              className="w-full py-4 px-4 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer border-2 border-black hover:opacity-90 shadow-[2px_2px_0px_#000000] font-bold"
            >
              <span className="material-symbols-outlined text-[22px] text-secondary-fixed">
                delete
              </span>
              <span>DISCARD DRAFT &amp; SEE BETTER REPLIES</span>
            </button>
          )}
        </div>
      </div>

      {/* Neo-Brutalist Callout Banner */}
      <div className="flex flex-col rounded-xl bg-secondary-container p-5 text-on-secondary-fixed shadow-[4px_4px_0px_#000000] border-2 border-black gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-error">info</span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest bg-primary text-on-primary px-3 py-1 rounded-full font-bold">
            ADVICE
          </span>
        </div>
        <div className="mt-1 font-headline-lg text-headline-lg uppercase leading-snug tracking-tight font-bold">
          DON&apos;T SEND THIS MESSAGE.
        </div>
        <p className="font-body-md text-body-md text-on-secondary-fixed-variant leading-relaxed font-medium">
          {analysisResult.tacticalCritique}
        </p>
      </div>

      {/* Tactical Countermeasure Card */}
      <div className="flex flex-col rounded-xl bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#000000] border-2 border-black gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight font-bold">
              Better Reply ({countermeasureIdx + 1}/{activeCountermeasures.length})
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase font-bold tracking-wider border border-black/10">
            Suggested
          </span>
        </div>

        {/* Suggested Reply Quote Box */}
        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-black/10">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
            Try saying this instead:
          </span>
          <div
            id="countermeasure-text"
            className="font-body-lg text-body-lg text-on-surface font-semibold italic leading-relaxed"
          >
            {currentCountermeasure}
          </div>
        </div>

        {/* Copy Action & Swap */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="copy-countermeasure-btn"
            onClick={handleCopyReplacement}
            className="flex-1 py-3.5 px-4 rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer hover:opacity-90 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check_circle' : 'content_copy'}
            </span>
            <span id="copy-btn-text">
              {copied ? 'COPIED TO CLIPBOARD!' : 'Copy Reply'}
            </span>
          </button>
          <button
            id="swap-countermeasure-btn"
            onClick={handleSwapReplacement}
            className="w-11 h-11 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-black/10"
            title="See another option"
          >
            <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
          </button>
        </div>

        {/* Test in Sparring Sandbox */}
        <div className="pt-1">
          <button
            onClick={() => {
              const topicText = `“Testing response: ${currentCountermeasure.replace(/[“"”]/g, '')}”`;
              if (onLaunchSparring) {
                onLaunchSparring(topicText);
              } else {
                onNavigate('sparring-sandbox');
              }
              showToast('Opening practice chat...');
            }}
            className="w-full py-2.5 px-3 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-black/20 hover:bg-secondary-container transition-colors cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">forum</span>
            <span>Practice Reply in Chat →</span>
          </button>
        </div>
      </div>

      {/* Kinetic Ticker Band */}
      <div className="overflow-hidden rounded-full bg-primary py-3 px-4 flex items-center justify-center text-on-primary shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-2 font-label-sm text-label-sm tracking-wider uppercase whitespace-nowrap font-bold">
          <span className="text-secondary-fixed">✨</span>
          <span>Keeps things calm</span>
          <span className="text-outline-variant">•</span>
          <span>Friendly &amp; polite</span>
          <span className="text-outline-variant">•</span>
          <span>No pressure</span>
          <span className="text-secondary-fixed">✨</span>
        </div>
      </div>
    </div>
  );
};

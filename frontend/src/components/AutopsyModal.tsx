import React from 'react';
import { ForensicReceiptResult } from '../services/api';

interface AutopsyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployCounter: (text?: string) => void;
  onLaunchSparring?: (topic: string) => void;
  caseData?: ForensicReceiptResult | null;
}

export const AutopsyModal: React.FC<AutopsyModalProps> = ({
  isOpen,
  onClose,
  onDeployCounter,
  onLaunchSparring,
  caseData,
}) => {
  if (!isOpen) return null;

  // Find the locked target node if available
  const targetNode =
    caseData?.nodes?.find((n) => n.badge?.toLowerCase().includes('target')) ||
    caseData?.nodes?.[caseData.nodes.length - 1];

  const targetText = targetNode?.text || 'Fine.';
  const latencyText = targetNode?.latency || '34m 12s';
  const charLength = targetText.length;
  const wordCount = targetText.trim().split(/\s+/).length;
  const subtextSummary =
    caseData?.forensic_summary ||
    'The target used terminal punctuation and maximum economy of phrasing to invert leverage. Any eager follow-up question confirms guilt or insecurity.';
  const tacticalCounter = caseData?.tactical_move || '“Sounds good. Catch you at 8:30.”';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-[6px_6px_0px_#000000] border-2 border-black max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-headline-md text-headline-md uppercase tracking-tight font-bold">
              Message Analysis: “{targetText.slice(0, 16)}”
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-surface-container-low rounded-xl border border-black/10">
            <span className="font-label-sm uppercase text-outline block font-bold">Response Time</span>
            <span className="font-headline-lg text-error font-bold">{latencyText}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Time to reply</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-black/10">
            <span className="font-label-sm uppercase text-outline block font-bold">Message Length</span>
            <span className="font-headline-lg text-primary font-bold">{wordCount} Word ({charLength} chars)</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Short response</span>
          </div>
        </div>

        {/* Power Dynamic Analysis */}
        <div className="p-4 bg-tertiary-fixed rounded-xl border-2 border-black flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-tertiary-fixed">
              What this means
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black text-white font-label-sm text-[10px] font-bold uppercase">
              {caseData?.subtext_score || 92}/100 Tension
            </span>
          </div>
          <p className="font-body-md text-body-md leading-relaxed text-on-tertiary-fixed font-medium">
            {subtextSummary}
          </p>
        </div>

        {/* Frame Shift Timeline */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm uppercase font-bold text-outline">
            When should you reply?
          </span>
          <div className="space-y-2 font-body-sm text-body-sm">
            <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-low border border-black/5">
              <span>Replying immediately (under 5m):</span>
              <span className="text-error font-bold">Can feel rushed or overly eager</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-low border border-black/5">
              <span>Replying in 1-2 hours:</span>
              <span className="text-secondary font-bold">Calm &amp; standard pace</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-secondary-container/60 border border-black/15 font-bold">
              <span>Replying when convenient:</span>
              <span className="text-green-700 font-bold">Relaxed &amp; comfortable</span>
            </div>
          </div>
        </div>

        {/* Suggested Tactical Counter */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-black/10">
          <span className="font-label-sm uppercase text-outline block text-[10px] font-bold mb-1">
            Recommended Reply:
          </span>
          <p className="font-body-md text-on-surface font-semibold italic">
            {tacticalCounter}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              onDeployCounter(tacticalCounter);
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wide flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000] border-2 border-black hover:bg-secondary transition-colors cursor-pointer font-bold"
          >
            <span>Check in Draft Checker</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          {onLaunchSparring && (
            <button
              onClick={() => {
                onLaunchSparring(`“${caseData?.title || targetText}”`);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-full bg-surface-container text-on-surface font-label-md uppercase tracking-wider flex items-center justify-center gap-2 border border-black hover:bg-surface-container-high transition-colors cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
              <span>Practice Reply in Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

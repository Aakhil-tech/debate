import React from 'react';
import { RefereeVerdictResult } from '../services/api';

interface RefereeModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdictData?: RefereeVerdictResult | null;
  topic?: string;
}

export const RefereeModal: React.FC<RefereeModalProps> = ({
  isOpen,
  onClose,
  verdictData,
  topic,
}) => {
  if (!isOpen) return null;

  if (!verdictData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-[6px_6px_0px_#000000] border-2 border-black flex flex-col gap-4 items-center text-center">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant">gavel</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">No verdict yet.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-primary text-on-primary font-label-md uppercase font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const rulingTitle = verdictData.rulingTitle;
  const contestTopic = topic || 'this match';
  const cloutPoints = verdictData.cloutPoints;
  const scorecard = verdictData.scorecard;
  const arbitratorNote = verdictData.arbitratorNote;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-[6px_6px_0px_#000000] border-2 border-black max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-secondary">forum</span>
            <span className="font-headline-md text-headline-md uppercase tracking-tight font-bold">
              Practice Results
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Verdict Badge Banner */}
        <div className="p-4 bg-secondary-container rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] text-center flex flex-col items-center gap-1">
          <span className="font-label-sm uppercase tracking-widest font-bold px-3 py-0.5 rounded-full bg-black text-white">
            SUMMARY
          </span>
          <h3 className="font-display-lg-mobile text-display-lg-mobile uppercase tracking-tight text-on-secondary-fixed mt-1 font-bold">
            {rulingTitle}
          </h3>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed font-medium truncate max-w-xs">
            Topic: {contestTopic}
          </p>
        </div>

        {/* Scorecard Table */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm uppercase font-bold text-outline">Communication Scorecard</span>
          <div className="rounded-xl border-2 border-black overflow-hidden bg-surface-container-lowest shadow-[2px_2px_0px_#000000]">
            <div className="grid grid-cols-3 p-2.5 bg-surface-container-low font-label-sm uppercase font-bold border-b border-black">
              <span>Metric</span>
              <span className="text-center">You</span>
              <span className="text-center">Practice Partner</span>
            </div>
            <div className="grid grid-cols-3 p-2.5 font-body-sm border-b border-black/10">
              <span className="font-medium">Stayed on Topic</span>
              <span className="text-center text-green-700 font-bold">
                {scorecard.timestampAnchoring}
              </span>
              <span className="text-center text-on-surface-variant">Mixed</span>
            </div>
            <div className="grid grid-cols-3 p-2.5 font-body-sm border-b border-black/10">
              <span className="font-medium">Emotional Slips</span>
              <span className="text-center font-bold text-green-700">
                {scorecard.fallaciesDetectedUser}
              </span>
              <span className="text-center text-error font-bold">
                {scorecard.fallaciesDetectedAi}
              </span>
            </div>
            <div className="grid grid-cols-3 p-2.5 font-body-sm bg-secondary-container/30">
              <span className="font-bold">Confidence Score</span>
              <span className="text-center font-bold text-primary">
                {scorecard.finalFrameUser}%
              </span>
              <span className="text-center font-bold text-secondary">
                {scorecard.finalFrameAi}%
              </span>
            </div>
          </div>
        </div>

        {/* Referee Remarks */}
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-black/15 font-body-sm leading-relaxed text-on-surface">
          <span className="font-label-sm uppercase font-bold block mb-1 text-secondary">
            Feedback:
          </span>
          <p className="italic">{arbitratorNote}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wide flex items-center justify-center gap-2 border-2 border-black hover:bg-secondary transition-colors cursor-pointer font-bold"
        >
          <span>Done (+{cloutPoints} Points)</span>
        </button>
      </div>
    </div>
  );
};

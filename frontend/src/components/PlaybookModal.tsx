import React from 'react';

interface PlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RULES = [
  {
    id: 1,
    title: 'Never double text on passive compliance',
    rule: 'A single-word period closure shifts the entire burden of enthusiasm onto you. Stand down and yield the floor.',
    category: 'VULNERABILITY PREVENTION',
  },
  {
    id: 2,
    title: 'Match delivery latency + 15%',
    rule: 'If an incoming response takes 24 minutes, responding in 58 seconds signals asymmetrical investment and panic.',
    category: 'TEMPO DISCIPLINE',
  },
  {
    id: 3,
    title: 'Quarantine multi-paragraph grievances',
    rule: 'Before sending a wall of text, drop it in the Fumble Radar detonator. Never negotiate relationship terms via text.',
    category: 'DRAFT NEUTRALIZATION',
  },
  {
    id: 4,
    title: 'Re-anchor on concrete timestamps',
    rule: 'When opponent utilizes selective memory or goalpost shifting, cite explicit receipt timestamps rather than emotions.',
    category: 'EVIDENTIARY CONTROL',
  },
  {
    id: 5,
    title: 'Close with an open boundary',
    rule: '“No stress, get through work! Catch you later this week” preserves complete frame while transferring the initiative.',
    category: 'LEVERAGE RETENTION',
  },
];

export const PlaybookModal: React.FC<PlaybookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-[6px_6px_0px_#000000] border-2 border-black max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-black font-label-sm uppercase font-bold">
              MANUAL v3.0
            </span>
            <span className="font-headline-md text-headline-md uppercase tracking-tight">
              Tactical Playbook
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-black hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          The 5 Cardinal Rules of Textual Warfare. Grounded in conversational forensics, frame preservation, and unforced error deterrence.
        </p>

        {/* Rules Stack */}
        <div className="flex flex-col gap-3">
          {RULES.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-surface-container-low border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-label-sm uppercase font-bold text-secondary">
                  RULE #{r.id} // {r.category}
                </span>
              </div>
              <h4 className="font-headline-md text-headline-md uppercase tracking-tight text-on-surface">
                {r.title}
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {r.rule}
              </p>
            </div>
          ))}
        </div>

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wide flex items-center justify-center gap-2 border-2 border-black hover:bg-surface-container-high hover:text-black transition-colors cursor-pointer mt-2"
        >
          <span>Acknowledged &amp; Armed</span>
        </button>
      </div>
    </div>
  );
};

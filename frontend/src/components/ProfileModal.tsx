import React, { useEffect, useState } from 'react';
import { getStoredStats, refreshStoredStats, subscribeStats, TacticianStats } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, showToast }) => {
  const [stats, setStats] = useState<TacticianStats>(getStoredStats());

  useEffect(() => {
    if (!isOpen) return;
    setStats(getStoredStats());
    refreshStoredStats();
    return subscribeStats(setStats);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-[6px_6px_0px_#000000] border-2 border-black max-h-[85vh] overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="font-headline-md uppercase">Tactician Profile</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-secondary-container rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-4">
          <img
            alt="Tactician Avatar"
            src="/logo.jpeg"
            className="w-14 h-14 rounded-full border-2 border-black object-cover"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-lg">{stats.handle}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
            </div>
            <span className="font-label-sm uppercase font-bold text-on-secondary-fixed">
              LVL {stats.level} TACTICIAN
            </span>
            <span className="font-body-sm text-xs text-on-secondary-fixed-variant mt-0.5">
              Credits remaining: {stats.credits}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 font-body-sm">
          <div className="p-3 bg-surface-container-low rounded-xl border border-black/15">
            <span className="font-label-sm uppercase text-outline block">Clean Wins</span>
            <span className="font-headline-lg text-primary">{stats.cleanWins}</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-black/15">
            <span className="font-label-sm uppercase text-outline block">Drafts Checked</span>
            <span className="font-headline-lg text-primary">{stats.fumbleFlags}</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-black/15">
            <span className="font-label-sm uppercase text-outline block">Meltdowns</span>
            <span className="font-headline-lg text-primary">{stats.meltdowns}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              showToast('Profile refreshed');
              refreshStoredStats();
              onClose();
            }}
            className="w-full py-3 rounded-full bg-primary text-on-primary font-label-md uppercase tracking-wider border-2 border-black hover:opacity-90 transition-opacity cursor-pointer"
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
};

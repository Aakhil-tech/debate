import React, { useState } from 'react';
import { ScreenId } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
}

const NAV_ITEMS: { title: string; screen: ScreenId; category: string }[] = [
  { title: 'War Room — stats & suggested reply', screen: 'war-room', category: 'Overview' },
  { title: 'Screenshots — scan a conversation', screen: 'drop-receipts', category: 'Forensic' },
  { title: 'Check Draft — before you send it', screen: 'fumble-radar', category: 'Draft Detonator' },
  { title: 'Practice Chat — spar against an AI opponent', screen: 'sparring-sandbox', category: 'Sparring' },
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = NAV_ITEMS.filter((item) =>
    (item.title + item.category).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-[6px_6px_0px_#000000] border-2 border-black max-h-[85vh] overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span className="font-headline-md uppercase">Go To</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens..."
            className="w-full p-3 pl-10 rounded-full bg-surface-container-low border-2 border-black outline-none font-body-md text-body-md"
            autoFocus
          />
          <span className="material-symbols-outlined text-[20px] absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onNavigate(item.screen);
                onClose();
              }}
              className="p-3 bg-surface-container-low rounded-xl border border-black/15 text-left hover:bg-secondary-container transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-label-sm uppercase font-bold text-secondary">
                  {item.category}
                </span>
                <span className="font-headline-md text-headline-md group-hover:text-black">
                  {item.title}
                </span>
              </div>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-6 font-body-sm text-outline">No matching screens.</p>
          )}
        </div>
      </div>
    </div>
  );
};

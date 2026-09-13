import React from 'react';
import { ScreenId } from '../types';

interface HeaderProps {
  currentScreen?: ScreenId;
  onSelectScreen?: (screen: ScreenId) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenOcrStudio?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen = 'war-room',
  onSelectScreen,
  onOpenSearch,
  onOpenProfile,
  onOpenOcrStudio,
}) => {
  const navLinks: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'war-room', label: 'Overview', icon: 'dashboard' },
    { id: 'drop-receipts', label: 'Screenshots', icon: 'receipt_long' },
    { id: 'fumble-radar', label: 'Check Draft', icon: 'edit_note' },
    { id: 'sparring-sandbox', label: 'Practice Chat', icon: 'forum' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#f9f9f9]/90 backdrop-blur-xl border-b border-[#e2e2e2]/70 shadow-sm">
      <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Version */}
        <div
          onClick={() => onSelectScreen && onSelectScreen('war-room')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img
            alt="Brand logo"
            className="h-8 w-auto object-contain rounded-sm"
            src="/logo.jpeg"
            referrerPolicy="no-referrer"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight font-bold">
              Debate &amp; Win
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold">
              3.0
            </span>
          </div>
        </div>

        {/* Desktop Web Navigation Bar */}
        {onSelectScreen && (
          <nav className="hidden md:flex items-center gap-1 bg-surface-container-lowest/80 p-1 rounded-full border border-black/10 shadow-xs">
            {navLinks.map((link) => {
              const isActive = currentScreen === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectScreen(link.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-label-md uppercase font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-[1px_1px_0px_#000000]'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Header Utilities & Actions */}
        <div className="flex items-center gap-2">
          {/* Quick OCR Vision Trigger */}
          {onOpenOcrStudio && (
            <button
              onClick={onOpenOcrStudio}
              title="Scan image text (or press Ctrl+V anywhere)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-fixed text-xs font-label-md uppercase font-bold border border-black/15 shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">document_scanner</span>
              <span>Scan Image</span>
              <kbd className="hidden lg:inline text-[10px] px-1 py-0.2 bg-white/70 rounded font-mono">
                Ctrl+V
              </kbd>
            </button>
          )}

          <button
            id="btn-search-archive"
            aria-label="Search Archive"
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[19px]">search</span>
          </button>

          <button
            id="btn-profile-toggle"
            aria-label="User Profile"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-85 transition-opacity shadow-xs"
          >
            <span className="material-symbols-outlined text-on-primary text-[17px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};

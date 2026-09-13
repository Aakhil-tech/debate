import React from 'react';
import { ScreenId } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onSelectScreen }) => {
  const navItems: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'war-room', label: 'Overview', icon: 'dashboard' },
    { id: 'drop-receipts', label: 'Screenshots', icon: 'receipt_long' },
    { id: 'fumble-radar', label: 'Check Draft', icon: 'edit_note' },
    { id: 'sparring-sandbox', label: 'Practice', icon: 'forum' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe pointer-events-none md:hidden" id="main-navigation">
      <div className="px-4 pb-4 flex justify-center w-full max-w-md mx-auto">
        <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-black/10">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectScreen(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-label-md text-label-md uppercase transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-[2px_2px_0px_#000000]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="tracking-tight text-[11px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

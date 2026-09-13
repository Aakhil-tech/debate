import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="app-toast"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-4 py-2 rounded-full font-label-md text-label-md uppercase tracking-wider shadow-[4px_4px_0px_#fbe44f] flex items-center gap-2 animate-bounce border border-secondary-container"
    >
      <span className="text-secondary-container">⚡</span>
      <span>{message}</span>
    </div>
  );
};

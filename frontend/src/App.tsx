/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenId } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { WarRoomScreen } from './components/WarRoomScreen';
import { ReceiptsScreen } from './components/ReceiptsScreen';
import { FumbleScreen } from './components/FumbleScreen';
import { SparringScreen } from './components/SparringScreen';
import { AutopsyModal } from './components/AutopsyModal';
import { PlaybookModal } from './components/PlaybookModal';
import { RefereeModal } from './components/RefereeModal';
import { SearchModal } from './components/SearchModal';
import { ProfileModal } from './components/ProfileModal';
import { Toast } from './components/Toast';
import { ApiHubScreen } from './components/ApiHubScreen';
import { ForensicReceiptResult, RefereeVerdictResult } from './services/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('war-room');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cross-screen state
  const [activeAutopsyData, setActiveAutopsyData] = useState<ForensicReceiptResult | null>(null);
  const [refereeVerdict, setRefereeVerdict] = useState<RefereeVerdictResult | null>(null);
  const [refereeTopic, setRefereeTopic] = useState<string>('');
  const [fumbleInitialDraft, setFumbleInitialDraft] = useState<string | undefined>(undefined);

  // Modals state
  const [isAutopsyOpen, setIsAutopsyOpen] = useState(false);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);
  const [isRefereeOpen, setIsRefereeOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAutopsyWithData = (data: ForensicReceiptResult) => {
    setActiveAutopsyData(data);
    setIsAutopsyOpen(true);
  };

  const handleOpenRefereeWithVerdict = (verdict: RefereeVerdictResult, topic: string) => {
    setRefereeVerdict(verdict);
    setRefereeTopic(topic);
    setIsRefereeOpen(true);
  };

  const [sparringTopic, setSparringTopic] = useState<string | undefined>(undefined);

  const handleDeployCounterToFumble = (text?: string) => {
    if (text) {
      setFumbleInitialDraft(text);
    }
    handleNavigate('fumble-radar');
  };

  const handleLaunchSparring = (topic: string) => {
    setSparringTopic(topic);
    handleNavigate('sparring-sandbox');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col antialiased selection:bg-secondary-container selection:text-on-secondary-fixed">
      {/* Fixed Sticky Header */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full pt-16">
        {currentScreen === 'war-room' && (
          <WarRoomScreen
            onNavigate={handleNavigate}
            onOpenAutopsyWithData={handleOpenAutopsyWithData}
            showToast={showToast}
          />
        )}

        {currentScreen === 'drop-receipts' && (
          <ReceiptsScreen
            onNavigate={handleNavigate}
            onOpenPlaybook={() => setIsPlaybookOpen(true)}
            onOpenAutopsyWithData={handleOpenAutopsyWithData}
            onDeployCounterToFumble={handleDeployCounterToFumble}
            onLaunchSparring={handleLaunchSparring}
            showToast={showToast}
          />
        )}

        {currentScreen === 'fumble-radar' && (
          <FumbleScreen
            onNavigate={handleNavigate}
            onLaunchSparring={handleLaunchSparring}
            showToast={showToast}
            initialDraft={fumbleInitialDraft}
          />
        )}

        {currentScreen === 'sparring-sandbox' && (
          <SparringScreen
            onOpenRefereeWithVerdict={handleOpenRefereeWithVerdict}
            onOpenReferee={() => setIsRefereeOpen(true)}
            showToast={showToast}
            initialTopic={sparringTopic}
          />
        )}

        {currentScreen === 'api-hub' && (
          <ApiHubScreen
            showToast={showToast}
            onNavigateToReceipts={() => handleNavigate('drop-receipts')}
          />
        )}
      </main>

      {/* Floating Bottom Nav Dock */}
      <BottomNav
        currentScreen={currentScreen}
        onSelectScreen={handleNavigate}
      />

      {/* Interactive Modals */}
      <AutopsyModal
        isOpen={isAutopsyOpen}
        onClose={() => setIsAutopsyOpen(false)}
        onDeployCounter={handleDeployCounterToFumble}
        onLaunchSparring={handleLaunchSparring}
        caseData={activeAutopsyData}
      />

      <PlaybookModal
        isOpen={isPlaybookOpen}
        onClose={() => setIsPlaybookOpen(false)}
      />

      <RefereeModal
        isOpen={isRefereeOpen}
        onClose={() => setIsRefereeOpen(false)}
        verdictData={refereeVerdict}
        topic={refereeTopic}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        showToast={showToast}
      />

      {/* Feedback Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { SparringMessage } from '../types';
import { sendSparringParry, getRefereeVerdict, RefereeVerdictResult, recordWin } from '../services/api';

interface SparringScreenProps {
  onOpenRefereeWithVerdict?: (verdict: RefereeVerdictResult, topic: string) => void;
  onOpenReferee: () => void;
  showToast: (msg: string) => void;
  initialTopic?: string;
}

const PERSONAS = [
  { id: 'defensive_partner', label: 'Defensive Partner', emoji: '💔' },
  { id: 'roommate', label: 'Passive Roommate', emoji: '🧦' },
  { id: 'boss', label: 'Micromanager Boss', emoji: '📊' },
  { id: 'landlord', label: 'Evasive Landlord', emoji: '🔑' },
  { id: 'friend', label: 'Guilt-tripping Friend', emoji: '🎭' },
];

const INITIAL_MESSAGES: SparringMessage[] = [
  {
    id: 'ai-1',
    sender: 'ai',
    text: '“You literally said you didn\'t care, and now you\'re acting like I forced you to eat raw fish.”',
    time: '19:42:01',
    fallacy: 'Fallacy: Selective Memory',
    frameImpact: -12,
  },
];

export const SparringScreen: React.FC<SparringScreenProps> = ({
  onOpenRefereeWithVerdict,
  onOpenReferee,
  showToast,
  initialTopic,
}) => {
  const [topic, setTopic] = useState(initialTopic || '“Who decided on sushi vs tacos last Friday?”');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('defensive_partner');
  const [aggressiveness, setAggressiveness] = useState(8);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      // Also update initial AI prompt to align with new topic
      setMessages([
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `“Look, regarding ${initialTopic.replace(/[“"”]/g, '')}, I already gave you my stance. Why are we bringing this up again?”`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          fallacy: 'Fallacy: Stonewalling & Fatigue Induction',
          frameImpact: -8,
        },
      ]);
    }
  }, [initialTopic]);

  const [messages, setMessages] = useState<SparringMessage[]>(INITIAL_MESSAGES);
  const [coachTip, setCoachTip] = useState(
    'Do not take the “you always do this” bait. Re-anchor strictly to the Friday 7:30 PM WhatsApp timestamp.'
  );
  const [inputText, setInputText] = useState('');
  const [userFrame, setUserFrame] = useState(68);
  const [isTypingAI, setIsTypingAI] = useState(false);
  const [tapeRecording, setTapeRecording] = useState(false);
  const [callingReferee, setCallingReferee] = useState(false);

  const handleSendParry = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) {
      showToast('Please type or inject a tactical parry');
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const userMsg: SparringMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `“${textToSend}”`,
      time: timeStr,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsTypingAI(true);
    showToast('Parry sent! Calculating frame shift... ⚡');

    try {
      const result = await sendSparringParry({
        messages: updatedHistory.map((m) => ({ sender: m.sender, text: m.text })),
        topic,
        persona: selectedPersona,
        aggressiveness,
        userParry: textToSend,
      });

      const newFrame = Math.min(96, Math.max(10, userFrame + (result.frameDelta || 5)));
      setUserFrame(newFrame);
      setCoachTip(result.coachTip || 'Re-anchor on verifiable chat history timestamps.');

      const aiMsg: SparringMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.botReply,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        fallacy: result.fallacy,
      };

      setMessages((prev) => [...prev, aiMsg]);
      showToast(`Frame updated: ${newFrame}% in your favor (${result.frameDelta > 0 ? '+' : ''}${result.frameDelta}%)`);
    } catch (err: any) {
      console.error('Sparring error:', err);
      // Calibrated local turn
      const fallbackAiMsg: SparringMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: '“Okay but you literally read the menu for 15 minutes before we left the car without objecting.”',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        fallacy: 'Fallacy: Moving the Goalposts',
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
      setUserFrame((prev) => Math.min(94, prev + 4));
    } finally {
      setIsTypingAI(false);
    }
  };

  const handleCallReferee = async () => {
    setCallingReferee(true);
    showToast('Calling Head Arbitrator to assess debate transcript... ⚖️');
    try {
      const verdict = await getRefereeVerdict({
        messages: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
          fallacy: m.fallacy,
        })),
        topic,
        userFrame,
      });

      if (verdict.winner === 'user') {
        recordWin(verdict.cloutPoints);
      }

      if (onOpenRefereeWithVerdict) {
        onOpenRefereeWithVerdict(verdict, topic);
      } else {
        onOpenReferee();
      }
      showToast('Official arbitration ruling ready!');
    } catch (err: any) {
      console.warn('Referee network warning, using calibrated ruling:', err);
      const isWinner = userFrame >= 50;
      const fallbackVerdict = {
        winner: (isWinner ? 'user' : 'ai') as 'user' | 'ai' | 'draw',
        rulingTitle: isWinner ? 'VERDICT: USER REIGNS SUPREME' : 'VERDICT: SPLIT CONCESSION',
        scorecard: {
          timestampAnchoring: 'Flawless',
          fallaciesDetectedUser: 0,
          fallaciesDetectedAi: 2,
          finalFrameUser: userFrame,
          finalFrameAi: 100 - userFrame,
        },
        arbitratorNote:
          'The adversary attempted multiple deflections. The user maintained frame, anchored to timestamp evidence, and avoided emotional concessions.',
        cloutPoints: 25,
      };
      if (fallbackVerdict.winner === 'user') {
        recordWin(fallbackVerdict.cloutPoints);
      }
      if (onOpenRefereeWithVerdict) {
        onOpenRefereeWithVerdict(fallbackVerdict, topic);
      } else {
        onOpenReferee();
      }
      showToast('Arbitration ruling rendered! ⚖️');
    } finally {
      setCallingReferee(false);
    }
  };

  const handleInjectTactic = (tactic: 'strike' | 'shift' | 'concession') => {
    let injected = '';
    if (tactic === 'strike') {
      injected = "The chat history at 19:30 explicitly records 'either is fine', which disproves your claim.";
    } else if (tactic === 'shift') {
      injected = 'You are evading the primary point: who placed the final order without confirmation?';
    } else {
      injected = 'I agree communication was brief, but unilateral action was not authorized.';
    }
    setInputText(injected);
    showToast('Tactical parry injected into argument chamber');
  };

  const handleVoiceSim = () => {
    setInputText("Timestamp 19:42 explicitly disproves that. Let's inspect the actual receipts.");
    showToast('Voice transcription injected into parry field');
  };

  const toggleTape = () => {
    setTapeRecording(!tapeRecording);
    showToast(!tapeRecording ? 'Tape recorder active: Archiving sparring dialogue' : 'Tape recorder paused');
  };

  const aiChaos = 100 - userFrame;

  return (
    <div className="flex flex-col w-full pb-36">
      {/* Top Marquee Ribbon */}
      <div className="w-full bg-primary text-on-primary py-1.5 px-4 overflow-hidden flex items-center justify-between border-b border-black">
        <div className="flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider">
          <span className="inline-block w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
          <span>Chaos Engine v3.0 // Aggro Lvl {aggressiveness}/10</span>
        </div>
        <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary-fixed uppercase font-bold">
          <span>ROUND {Math.floor(messages.length / 2) + 1}</span>
          <span>•</span>
          <span>MATCH ID #7729</span>
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto w-full flex flex-col gap-4 mt-4">
        {/* Topic Showcase Card with Neo-brutalist Architectural Graphic */}
        <div className="w-full rounded-xl bg-surface-container-lowest overflow-hidden shadow-[4px_4px_0px_#000000] border-2 border-black">
          {/* Header Visual Canvas */}
          <div className="w-full bg-tertiary-fixed py-4 px-4 flex flex-col items-center justify-center relative border-b-2 border-black">
            <div className="absolute top-2 left-3 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/20"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-primary/20"></span>
            </div>
            <div className="absolute top-2 right-3 font-label-sm text-label-sm uppercase px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-bold">
              LIVE MAT
            </div>

            {/* Architectural Wireframe Illustration */}
            <svg
              className="w-48 h-20 text-on-surface"
              fill="none"
              viewBox="0 0 200 80"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                fill="#FFE853"
                height="46"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
                width="160"
                x="20"
                y="30"
              />
              <path d="M10 32L100 8L190 32H10Z" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.8" />
              <rect fill="#FFFFFF" height="32" stroke="currentColor" strokeWidth="1.5" width="16" x="35" y="44" />
              <rect fill="#FFFFFF" height="32" stroke="currentColor" strokeWidth="1.5" width="16" x="65" y="44" />
              <rect fill="#FFFFFF" height="32" stroke="currentColor" strokeWidth="1.5" width="16" x="119" y="44" />
              <rect fill="#FFFFFF" height="32" stroke="currentColor" strokeWidth="1.5" width="16" x="149" y="44" />
              <rect fill="#201C00" height="30" stroke="currentColor" strokeWidth="1.5" width="20" x="90" y="46" />
              <circle cx="100" cy="22" fill="#FFFFFF" r="5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface/70 mt-1 font-bold">
              THE SPREADSHEET COURT
            </span>
          </div>

          {/* Card Core Meta */}
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold border border-black/10">
                CONTESTED TOPIC
              </span>
              <button
                onClick={() => setIsEditingTopic(!isEditingTopic)}
                className="font-label-sm text-label-sm text-secondary font-bold underline uppercase cursor-pointer"
              >
                {isEditingTopic ? 'Done' : 'Change Topic'}
              </button>
            </div>

            {isEditingTopic ? (
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 text-sm bg-surface-container-low border border-black rounded-lg font-bold"
                placeholder="Enter custom debate topic..."
              />
            ) : (
              <h2 className="font-display-lg-mobile text-display-lg-mobile text-on-surface leading-tight">
                {topic}
              </h2>
            )}

            {/* Persona Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPersona(p.id);
                    showToast(`Sparring opponent: ${p.label}`);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 transition-all cursor-pointer ${
                    selectedPersona === p.id
                      ? 'bg-black text-white'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span>{p.emoji} {p.label}</span>
                </button>
              ))}
            </div>

            {/* Frame Dominance Bar */}
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface flex items-center gap-1 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                  You: {userFrame}% Frame
                </span>
                <span className="text-on-surface-variant flex items-center gap-1 font-bold">
                  Opponent: {aiChaos}% Chaos
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed inline-block"></span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex shadow-inner border border-black/20">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${userFrame}%` }}
                ></div>
                <div
                  className="h-full bg-secondary-fixed transition-all duration-500"
                  style={{ width: `${aiChaos}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 2x2 Matrix Block in Reference Style */}
          <div className="grid grid-cols-2 bg-surface-container-highest gap-[1.5px] border-t-2 border-black">
            <div className="p-3.5 bg-surface-container-lowest flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-outline font-bold">STATUS</span>
                <span className="font-headline-md text-headline-md text-on-surface">
                  {userFrame >= 50 ? 'In User Favor' : 'Frame Contested'}
                </span>
              </div>
              <span className="material-symbols-outlined text-[24px] text-primary font-bold">
                {userFrame >= 50 ? 'verified' : 'pending'}
              </span>
            </div>
            <div className="p-3.5 bg-surface-container-lowest flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-outline font-bold">AGGRO LEVEL</span>
                <div className="flex items-center gap-1">
                  <span className="font-headline-md text-headline-md text-on-surface">{aggressiveness}/10</span>
                  <button
                    onClick={() => setAggressiveness((prev) => (prev % 10) + 1)}
                    className="text-xs text-secondary font-bold underline"
                  >
                    Adjust
                  </button>
                </div>
              </div>
              <span className="material-symbols-outlined text-[24px] text-secondary font-bold">flash_on</span>
            </div>
          </div>
        </div>

        {/* Arena Live Log Section */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="font-label-lg text-label-lg uppercase text-on-surface font-bold">
              Sparring Feed
            </span>
            <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          </div>
          <button
            id="btn-tape-recorder"
            onClick={toggleTape}
            className={`font-label-sm text-label-sm uppercase px-3 py-1 rounded-full border border-black/20 transition-colors cursor-pointer font-bold ${
              tapeRecording ? 'bg-error text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {tapeRecording ? 'RECORDING 🔴' : 'TAPE RECORDER ⏺'}
          </button>
        </div>

        {/* Live Sparring Dialogue Stack */}
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`w-full rounded-xl p-4 flex flex-col gap-1 shadow-[2px_2px_0px_#000000] border-2 border-black ${
                msg.sender === 'ai'
                  ? 'bg-surface-container-low'
                  : 'bg-surface-container-lowest border-primary ml-auto'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold ${
                      msg.sender === 'ai' ? 'bg-primary text-on-primary' : 'bg-secondary-container text-black'
                    }`}
                  >
                    {msg.sender === 'ai' ? 'AI' : 'YOU'}
                  </div>
                  <span className="font-label-md text-label-md uppercase text-on-surface font-bold">
                    {msg.sender === 'ai' ? 'Opponent' : 'Tactician Move'}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline">{msg.time}</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface mt-1 leading-relaxed">{msg.text}</p>
              {msg.fallacy && (
                <div className="flex items-center gap-1 pt-1.5">
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm uppercase px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-bold border border-error/20">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    {msg.fallacy}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isTypingAI && (
            <div className="p-3 bg-surface-container-low rounded-xl border border-black/20 flex items-center gap-2 text-xs font-label-md uppercase animate-pulse">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              <span>AI Opponent formulating retort...</span>
            </div>
          )}

          {/* Tactical Coach Whisper Banner */}
          <div className="w-full rounded-xl p-4 bg-tertiary-fixed text-on-tertiary-fixed flex flex-col gap-1 shadow-[2px_2px_0px_#000000] border-2 border-black">
            <div className="flex items-center justify-between font-label-sm text-label-sm uppercase">
              <span className="flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                Coach Whisper
              </span>
              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-bold">
                TACTIC
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-tertiary-fixed font-medium mt-1">{coachTip}</p>
          </div>
        </div>

        {/* Quick Strike Tactics Row */}
        <div className="pt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline font-bold">TACTICAL SHORTCUTS</span>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">CLICK TO INJECT</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              id="btn-strike"
              onClick={() => handleInjectTactic('strike')}
              className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md uppercase shadow-[0_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform border border-black cursor-pointer"
            >
              <span>⚡</span>
              <span>Direct Strike</span>
            </button>
            <button
              id="btn-shift"
              onClick={() => handleInjectTactic('shift')}
              className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full bg-secondary-container text-on-secondary-fixed font-label-md text-label-md uppercase shadow-[0_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform border border-black cursor-pointer"
            >
              <span>🔄</span>
              <span>Call Shift</span>
            </button>
            <button
              id="btn-concession"
              onClick={() => handleInjectTactic('concession')}
              className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md uppercase shadow-[0_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform border border-black cursor-pointer"
            >
              <span>🤝</span>
              <span>Tactical Concession</span>
            </button>
          </div>
        </div>

        {/* Input Chamber Card */}
        <div className="rounded-xl p-4 bg-surface-container-lowest flex flex-col gap-3 shadow-[4px_4px_0px_#000000] border-2 border-black">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline font-bold">
              Formulate Argument
            </span>
            <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold">
              {inputText.length} / 140 MAX
            </span>
          </div>
          <div className="relative w-full">
            <textarea
              id="parry-input"
              value={inputText}
              maxLength={140}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendParry();
                }
              }}
              className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md outline-none resize-none placeholder:text-outline border border-black/10"
              placeholder="Anchor down the exact timestamps or quote their statement directly..."
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-audio"
              aria-label="Voice Parry"
              onClick={handleVoiceSim}
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shadow-[0_2px_0px_#000000] border border-black cursor-pointer hover:bg-secondary-container transition-colors"
              title="Speak parry"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
            <button
              id="btn-send-parry"
              onClick={handleSendParry}
              disabled={isTypingAI}
              className="flex-1 py-3 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase flex items-center justify-center gap-2 shadow-[0_2px_0px_#000000] active:translate-y-0.5 transition-transform cursor-pointer border-2 border-black hover:opacity-90"
            >
              <span>{isTypingAI ? 'PARRYING...' : 'Send Parry'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* The Final Verdict Button */}
        <div className="w-full pt-1 pb-4">
          <button
            id="btn-verdict"
            onClick={handleCallReferee}
            disabled={callingReferee}
            className="w-full py-4 px-4 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-3 shadow-[4px_4px_0px_#000000] active:translate-y-1 transition-transform border-2 border-black cursor-pointer hover:bg-secondary hover:text-white"
          >
            <span className={`material-symbols-outlined text-[22px] text-secondary-fixed ${callingReferee ? 'animate-spin' : ''}`}>
              {callingReferee ? 'refresh' : 'gavel'}
            </span>
            <span>{callingReferee ? 'ARBITRATING MATCH...' : 'Call The Referee (Declare Verdict)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

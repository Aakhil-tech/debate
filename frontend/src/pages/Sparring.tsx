import { FormEvent, useState } from "react";
import { ApiError, SparringSession, VerdictResult, sparringApi } from "../lib/api";

interface DisplayMessage {
  sender: "user" | "bot";
  text: string;
  fallacyUsed?: string;
  coachWhisper?: string;
}

export function Sparring() {
  const [session, setSession] = useState<SparringSession | null>(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSession(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const s = await sparringApi.start(topic);
      setSession(s);
      setMessages([]);
      setVerdict(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start session");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!session || !message.trim()) return;
    setLoading(true);
    setError(null);
    const userText = message;
    setMessage("");
    try {
      const turn = await sparringApi.sendMessage(session.session_id, userText);
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: userText },
        { sender: "bot", text: turn.botReply, coachWhisper: turn.coachWhisper, fallacyUsed: turn.fallacyUsed },
      ]);
      setSession({
        ...session,
        userFramePct: turn.userFramePct,
        botFramePct: turn.botFramePct,
        status: turn.roundStatus,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Message failed");
    } finally {
      setLoading(false);
    }
  }

  async function callVerdict() {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      setVerdict(await sparringApi.verdict(session.session_id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verdict failed");
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col w-full px-margin gap-space-lg pt-space-lg">
        <span className="font-headline-lg text-headline-lg uppercase tracking-tight">Live Sparring</span>
        <form
          onSubmit={startSession}
          className="flex flex-col gap-space-md bg-surface-container-lowest rounded-DEFAULT p-space-lg"
        >
          <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">Contested Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='"Who decided on sushi vs tacos last Friday?"'
            className="p-space-sm rounded-DEFAULT bg-surface-container-low outline-none"
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start Sparring"}
          </button>
        </form>
        {error && <p className="text-error font-body-sm text-body-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-margin gap-space-md pt-space-lg pb-space-xl">
      <h2 className="font-display-lg-mobile text-display-lg-mobile leading-tight">{session.topic}</h2>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-label-md text-label-md">
          <span>You: {session.userFramePct}% Frame</span>
          <span>AI: {session.botFramePct}% Chaos</span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
          <div className="h-full bg-primary" style={{ width: `${session.userFramePct}%` }} />
          <div className="h-full bg-secondary-fixed" style={{ width: `${session.botFramePct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-space-md">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-DEFAULT p-space-md max-w-[85%] ${
              m.sender === "user" ? "bg-surface-container-lowest self-end" : "bg-surface-container-low self-start"
            }`}
          >
            <p className="font-body-md text-body-md">{m.text}</p>
            {m.fallacyUsed && (
              <span className="mt-1 inline-block font-label-sm text-label-sm uppercase px-space-sm py-0.5 rounded-full bg-error-container text-on-error-container">
                Fallacy: {m.fallacyUsed}
              </span>
            )}
            {m.coachWhisper && (
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant italic">Coach: {m.coachWhisper}</p>
            )}
          </div>
        ))}
      </div>

      {session.status === "active" ? (
        <form onSubmit={sendMessage} className="flex items-center gap-space-sm">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anchor down the exact timestamps…"
            className="flex-1 p-space-sm rounded-DEFAULT bg-surface-container-low outline-none"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="py-2.5 px-space-lg rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="font-label-sm text-label-sm uppercase text-error">Knockout — round over.</p>
      )}

      {!verdict && (
        <button
          onClick={callVerdict}
          disabled={loading || messages.length < 2}
          className="py-3.5 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wider disabled:opacity-50"
        >
          Call The Referee
        </button>
      )}

      {error && <p className="text-error font-body-sm text-body-sm">{error}</p>}

      {verdict && (
        <div className="flex flex-col gap-space-sm bg-surface-container-lowest rounded-DEFAULT p-space-lg">
          <span className="font-headline-md text-headline-md uppercase">Winner: {verdict.winner}</span>
          <p className="font-body-md text-body-md">{verdict.verdictSummary}</p>
          <ul className="list-disc list-inside font-body-sm text-body-sm text-on-surface-variant">
            {verdict.lessons.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

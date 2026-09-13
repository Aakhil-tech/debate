import { FormEvent, useState } from "react";
import { ApiError, FumbleResult, fumbleApi } from "../lib/api";

export function FumbleRadar() {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<FumbleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await fumbleApi.analyze(draft));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full px-margin gap-space-xl pt-space-lg pb-space-xl">
      <div className="flex flex-col gap-space-sm">
        <span className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
          Fumble Radar
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Paste your draft before you send it. We'll tell you if it detonates.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-space-md bg-surface-container-lowest rounded-DEFAULT p-space-lg shadow-sm"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Paste the message you're about to send…"
          className="w-full p-space-md rounded-DEFAULT bg-surface-container-low text-on-surface outline-none resize-none"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          className="py-3.5 rounded-full bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-tight disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan Draft"}
        </button>
      </form>

      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

      {result && (
        <>
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between font-label-md text-label-md">
              <span className="text-error font-bold">
                {result.fumblePct}% {result.threatLabel}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                SURVIVAL CHANCE: {result.survivalChance}%
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 w-full h-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full ${i < result.threatLevel ? "bg-error" : "bg-surface-container-high"}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-lg bg-secondary-container p-space-lg text-on-secondary-fixed gap-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-widest bg-primary text-on-primary px-space-sm py-1 rounded-full w-fit">
              {result.detectedTag}
            </span>
            <p className="font-body-md text-body-md text-on-secondary-fixed-variant leading-relaxed">
              {result.whyBad}
            </p>
          </div>

          <div className="flex flex-col rounded-lg bg-surface-container-lowest p-space-lg gap-space-md">
            <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
              Safe Countermeasures
            </span>
            <ul className="flex flex-col gap-space-sm">
              {result.safeCountermeasures.map((line, i) => (
                <li key={i} className="p-space-md rounded-DEFAULT bg-surface-container-low font-body-md text-body-md italic">
                  {line}
                </li>
              ))}
            </ul>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{result.tacticalAdvice}</p>
          </div>
        </>
      )}
    </div>
  );
}

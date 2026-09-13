import { FormEvent, useState } from "react";
import { ApiError, ForensicAnalysisResult, receiptsApi } from "../lib/api";

export function DropReceipts() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ForensicAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setLoading(true);
    setError(null);
    try {
      const res = file ? await receiptsApi.upload(file) : await receiptsApi.analyzeText(text);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full px-margin gap-space-xl pt-space-lg pb-space-xl">
      <div className="flex flex-col gap-space-sm">
        <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface uppercase tracking-tight">
          Drop Receipts
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Upload a screenshot or paste the thread. We extract timestamps, subtext, and unforced errors.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-space-md bg-surface-container-lowest rounded-DEFAULT p-space-lg shadow-[3px_3px_0px_#000000]"
        style={{ border: "2px solid #000" }}
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setFile(null);
          }}
          rows={5}
          placeholder="Paste the conversation…"
          disabled={!!file}
          className="w-full p-space-md rounded-DEFAULT bg-surface-container-low text-on-surface outline-none resize-none disabled:opacity-50"
        />
        <div className="flex items-center gap-space-sm">
          <label className="flex-1 py-3 px-space-md rounded-full bg-surface-container text-on-surface font-label-md text-label-md uppercase text-center cursor-pointer truncate">
            {file ? file.name : "Upload Screenshot"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f) setText("");
              }}
            />
          </label>
          <button
            type="submit"
            disabled={loading || (!text.trim() && !file)}
            className="flex-1 py-3 px-space-md rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Engage Co-Pilot (3 Credits)"}
          </button>
        </div>
      </form>

      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

      {result && (
        <div className="flex flex-col gap-space-lg">
          <div className="flex items-center justify-between">
            <span className="font-headline-md text-headline-md uppercase">{result.title}</span>
            <span className="px-space-sm py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
              {result.nodeCount} NODES
            </span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {result.nodes.map((node, i) => (
              <div
                key={i}
                className={`p-space-md rounded-DEFAULT ${
                  node.type === "target" ? "bg-tertiary-fixed" : "bg-surface-container-lowest"
                }`}
                style={{ border: "1.5px solid #000" }}
              >
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">
                  <span>{node.type.replace("_", " ")}</span>
                  <span>
                    {node.time} {node.latency ? `• ${node.latency}` : ""}
                  </span>
                </div>
                <p className="font-body-md text-body-md leading-relaxed">{node.text}</p>
                {node.analysis && (
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{node.analysis}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <MetricTile label="Subtext Score" value={`${result.subtextScore}%`} />
            <MetricTile label="Frame Loss" value={`${result.frameLossPct}%`} />
          </div>

          <div className="bg-surface-container-lowest p-space-lg rounded-DEFAULT">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Tactical Move</span>
            <p className="font-body-lg text-body-lg italic mt-1">{result.tacticalMove}</p>
          </div>

          {result.tacticalRetorts.length > 0 && (
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase">Tactical Retorts</span>
              {result.tacticalRetorts.map((r, i) => (
                <div key={i} className="p-space-md rounded-DEFAULT bg-surface-container-low font-body-md text-body-md">
                  {r}
                </div>
              ))}
            </div>
          )}

          <p className="font-body-sm text-body-sm text-on-surface-variant">{result.forensicSummary}</p>
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-space-md bg-surface-container-lowest rounded-DEFAULT flex flex-col items-center"
      style={{ border: "1.5px solid #000" }}
    >
      <span className="font-headline-lg text-headline-lg">{value}</span>
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</span>
    </div>
  );
}

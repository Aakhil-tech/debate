import { useEffect, useState } from "react";
import { ApiError, WarRoomStats, warRoomApi } from "../lib/api";

export function WarRoom() {
  const [stats, setStats] = useState<WarRoomStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    warRoomApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  if (error) {
    return <div className="px-margin py-space-lg text-error font-body-md text-body-md">{error}</div>;
  }
  if (!stats) {
    return (
      <div className="px-margin py-space-lg text-on-surface-variant font-body-md text-body-md">
        Loading war room…
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-margin gap-space-xl">
      <div className="flex flex-col gap-space-md pt-space-xs">
        <div className="flex items-center justify-between">
          <span className="font-headline-md text-headline-md tracking-tight">@{stats.handle}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            LVL {stats.level} TACTICIAN
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-space-sm text-center py-space-xs">
        <StatTile value={stats.clean_wins} label="Clean Wins" />
        <StatTile value={stats.fumble_flags} label="Fumble Flags" accent />
        <StatTile value={stats.meltdowns} label="Meltdowns" />
      </div>

      <div className="bg-surface-container-lowest p-space-lg rounded-DEFAULT shadow-[4px_4px_0px_#000000] flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md uppercase">🎯 Recommended Move</span>
          <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm uppercase">
            {stats.credits} credits left
          </span>
        </div>
        <div className="p-space-lg bg-surface-container-low rounded-DEFAULT">
          <p className="font-body-lg text-body-lg text-on-surface italic font-medium leading-relaxed">
            {stats.recommended_move}
          </p>
        </div>
      </div>

      {stats.active_target_audit && (
        <div className="rounded-DEFAULT p-space-lg bg-tertiary-fixed text-on-tertiary-fixed shadow-[4px_4px_0px_#000000]">
          <div className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-on-surface uppercase w-fit">
            Target Audit
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-tertiary-fixed leading-tight pt-1">
            {stats.active_target_audit.title}
          </h2>
          <p className="font-body-sm text-body-sm text-on-tertiary-fixed/90 leading-relaxed mt-1">
            Subtext {stats.active_target_audit.subtext_score}% • Frame loss{" "}
            {stats.active_target_audit.frame_loss_pct}%
          </p>
        </div>
      )}

      {stats.recent_cases.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-space-lg">
          No cases yet — drop a screenshot in Receipts to get your first forensic read.
        </p>
      ) : (
        <div className="flex flex-col gap-space-sm pb-space-lg">
          <span className="font-label-md text-label-md uppercase text-on-surface-variant">Recent Cases</span>
          {stats.recent_cases.map((c) => (
            <div
              key={c.case_id}
              className="flex items-center justify-between p-space-md bg-surface-container-lowest rounded-DEFAULT"
              style={{ border: "1.5px solid #000" }}
            >
              <span className="font-body-md text-body-md">{c.title}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {c.subtextScore}% subtext
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-space-md bg-surface-container-lowest rounded-DEFAULT shadow-[2px_2px_0px_#000000] gap-space-xs">
      <span className={`font-headline-lg text-headline-lg ${accent ? "text-secondary" : ""}`}>{value}</span>
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">{label}</span>
    </div>
  );
}

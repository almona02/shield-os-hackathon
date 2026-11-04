"use client";

import type { Locale } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { FeedEvent } from "./Feed";

export function Timeline({
  events,
  locale,
  verified,
}: {
  events: FeedEvent[];
  locale: Locale;
  verified: boolean | null;
}) {
  const t = copy[locale];
  const ordered = [...events].sort(
    (a, b) => a.chain_position - b.chain_position,
  );

  return (
    <section className="rounded-2xl border border-shield-forest/15 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-shield-ink">{t.timeline}</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            verified
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {verified ? t.chainOk : t.chainBad}
        </span>
      </div>
      <ol className="relative space-y-0 border-s-2 border-shield-forest/20 ps-4">
        {ordered.map((e) => (
          <li key={e.event_hash} className="relative pb-4">
            <span className="absolute -start-[1.35rem] top-1 size-2.5 rounded-full bg-shield-mint" />
            <div className="text-sm font-semibold text-shield-ink">
              #{e.chain_position} · {e.event_type}
            </div>
            <div className="text-xs text-shield-steel">
              {e.proof.verified_by} ·{" "}
              {String(e.payload.part_name ?? e.entity_id)}
            </div>
            <div className="mt-1 break-all font-mono text-[10px] text-shield-steel/70">
              hash {e.event_hash}
            </div>
            <div className="break-all font-mono text-[10px] text-shield-steel/50">
              prev {e.prev_hash ?? "GENESIS"}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

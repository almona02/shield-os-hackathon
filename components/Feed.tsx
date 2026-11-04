"use client";

import type { Locale } from "@/lib/i18n";
import { copy } from "@/lib/i18n";

export interface FeedEvent {
  event_hash: string;
  prev_hash: string | null;
  chain_position: number;
  event_type: string;
  entity_id: string;
  recorded_at: string;
  proof: {
    verified_by: string;
    timestamp: string;
    location: { lat: number; lon: number } | null;
  };
  payload: Record<string, unknown>;
}

function fmtTime(iso: string, locale: Locale) {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bubbleText(
  e: FeedEvent,
  locale: Locale,
  t: { awaiting: string; approved: string; rejected: string },
) {
  const who = e.proof.verified_by;
  const part = String(e.payload.part_name ?? e.entity_id);
  const workshop = String(
    e.payload.workshop ?? (locale === "ar" ? "ورشة" : "Workshop"),
  );
  const time = fmtTime(e.recorded_at, locale);

  if (e.payload.kind === "spare_part_request") {
    return locale === "ar"
      ? `${who} طلب ${part} @ ${workshop} @ ${time} — ${t.awaiting}`
      : `${who} requested ${part} @ ${workshop} @ ${time} — ${t.awaiting}`;
  }
  if (e.payload.kind === "approval_decision") {
    const decision =
      e.payload.decision === "approved" ? t.approved : t.rejected;
    return locale === "ar"
      ? `${who} ${decision} ${part} @ ${time}`
      : `${who} ${String(decision).toLowerCase()} ${part} @ ${time}`;
  }
  if (e.entity_id === "shield_genesis") {
    return locale === "ar"
      ? "بداية السلسلة — genesis"
      : "Chain genesis — ledger sealed";
  }
  return `${who} · ${e.event_type} · ${e.entity_id} @ ${time}`;
}

export function Feed({
  events,
  locale,
}: {
  events: FeedEvent[];
  locale: Locale;
}) {
  const t = copy[locale];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-shield-steel">{t.feed}</h2>
      <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto rounded-2xl bg-[#e8efe9] p-3 shadow-inner">
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-shield-steel/70">
            {locale === "ar" ? "لا أحداث بعد" : "No events yet"}
          </p>
        )}
        {events.map((e) => {
          const isApproval = e.payload.kind === "approval_decision";
          const isRequest = e.payload.kind === "spare_part_request";
          return (
            <article
              key={e.event_hash}
              className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                isApproval
                  ? "ms-auto bg-shield-forest text-white"
                  : isRequest
                    ? "me-auto bg-white text-shield-ink"
                    : "me-auto bg-white/80 text-shield-steel"
              }`}
            >
              <p className="leading-snug">{bubbleText(e, locale, t)}</p>
              <p
                className={`mt-1 font-mono text-[10px] ${
                  isApproval ? "text-white/70" : "text-shield-steel/60"
                }`}
              >
                #{e.chain_position} · {e.event_hash.slice(0, 10)}…
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import type { Locale } from "@/lib/i18n";
import { WORKSHOPS, copy } from "@/lib/i18n";
import type { FeedEvent } from "./Feed";

/** Lightweight SVG map — no map tile dependency for the hackathon demo. */
export function MapView({
  events,
  locale,
}: {
  events: FeedEvent[];
  locale: Locale;
}) {
  const t = copy[locale];
  const withLoc = events.filter((e) => e.proof.location);

  // Egypt-ish bounding box
  const minLon = 29.5;
  const maxLon = 32.5;
  const minLat = 29.5;
  const maxLat = 31.6;
  const w = 320;
  const h = 220;

  const project = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * w;
    const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
    return { x, y };
  };

  return (
    <section className="rounded-2xl border border-shield-forest/15 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-shield-ink">{t.map}</h2>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50"
        role="img"
        aria-label={t.map}
      >
        {WORKSHOPS.map((shop) => {
          const { x, y } = project(shop.lat, shop.lon);
          return (
            <g key={shop.id}>
              <circle cx={x} cy={y} r={5} fill="#14532d" opacity={0.35} />
              <text
                x={x + 8}
                y={y + 4}
                fontSize="9"
                fill="#334155"
                fontFamily="sans-serif"
              >
                {locale === "ar" ? shop.name_ar : shop.name_en}
              </text>
            </g>
          );
        })}
        {withLoc.map((e) => {
          const loc = e.proof.location!;
          const { x, y } = project(loc.lat, loc.lon);
          const approved = e.payload.decision === "approved";
          return (
            <circle
              key={e.event_hash}
              cx={x}
              cy={y}
              r={approved ? 7 : 5}
              fill={approved ? "#16a34a" : "#b45309"}
              stroke="#fff"
              strokeWidth={1.5}
            >
              <title>
                {e.proof.verified_by} @ {e.recorded_at}
              </title>
            </circle>
          );
        })}
      </svg>
      <p className="mt-2 text-[11px] text-shield-steel">
        {locale === "ar"
          ? `${withLoc.length} أحداث بموقع GPS`
          : `${withLoc.length} geo-tagged events`}
      </p>
    </section>
  );
}

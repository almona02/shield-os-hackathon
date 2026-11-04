"use client";

import type { Locale } from "@/lib/i18n";
import { copy } from "@/lib/i18n";

export interface RiskData {
  risk_score: number;
  findings: {
    pattern: string;
    severity: string;
    explanation_en: string;
    explanation_ar: string;
  }[];
  summary_en: string;
  summary_ar: string;
  source: string;
}

export function RiskPanel({
  locale,
  risk,
}: {
  locale: Locale;
  risk: RiskData | null;
}) {
  const t = copy[locale];
  const score = risk?.risk_score ?? 0;
  const tone =
    score >= 70
      ? "bg-red-50 border-red-200 text-red-900"
      : score >= 40
        ? "bg-amber-50 border-amber-200 text-amber-950"
        : "bg-green-50 border-green-200 text-green-900";

  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t.riskPanel}</h2>
        <span className="font-mono text-2xl font-bold">{score}</span>
      </div>
      <p className="text-sm leading-snug">
        {risk
          ? locale === "ar"
            ? risk.summary_ar
            : risk.summary_en
          : locale === "ar"
            ? "جارٍ التحليل…"
            : "Analyzing…"}
      </p>
      {risk?.findings?.length ? (
        <ul className="mt-3 space-y-2">
          {risk.findings.map((f) => (
            <li
              key={f.pattern}
              className="rounded-xl bg-white/60 px-3 py-2 text-xs"
            >
              <strong>
                {f.pattern} · {f.severity}
              </strong>
              <div>
                {locale === "ar" ? f.explanation_ar : f.explanation_en}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 font-mono text-[10px] opacity-70">
        source: {risk?.source ?? "—"}
      </p>
    </section>
  );
}

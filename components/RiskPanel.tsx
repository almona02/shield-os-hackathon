"use client";

import type { Locale } from "@/lib/i18n";

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
  model?: string;
  fallback_reason?: string;
}

export function RiskPanel({
  locale,
  risk,
}: {
  locale: Locale;
  risk: RiskData | null;
}) {
  const score = risk?.risk_score ?? 0;
  const live = risk?.source === "meta_model_api";
  const tone =
    score >= 70
      ? "bg-red-50 border-red-200 text-red-900"
      : score >= 40
        ? "bg-amber-50 border-amber-200 text-amber-950"
        : "bg-green-50 border-green-200 text-green-900";

  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{locale === "ar" ? "مراجعة مخاطر الموافقات" : "Approval risk review"}</h2>
        <span className="font-mono text-2xl font-bold">{risk ? score : "—"}</span>
      </div>

      <div
        className={`mb-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
          live
            ? "bg-emerald-700 text-white"
            : "bg-stone-800 text-amber-100"
        }`}
      >
        <span
          className={`size-1.5 rounded-full ${live ? "bg-lime-300" : "bg-amber-300"}`}
        />
        <span className="break-all">
          {risk?.source_label ??
            (live
              ? `Source: ${risk?.model ?? "muse-spark-1.3"} | Meta Model API (LIVE)`
              : `Source: local_heuristic (fallback — ${risk?.fallback_reason ?? "unknown"})`)}
        </span>
      </div>

      <p className="mb-2 rounded-lg bg-white/50 px-2 py-1.5 text-[11px] leading-snug">
        {locale === "ar"
          ? risk?.disclaimer_ar ??
            "درجة المخاطر إشارة للمراجعة البشرية — ليست احتمال احتيال."
          : risk?.disclaimer_en ??
            "Model relevance score for human review — not a fraud probability or proof of collusion."}
      </p>

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
                {f.pattern} · {f.severity} · signal
              </strong>
              <div>
                {locale === "ar" ? f.explanation_ar : f.explanation_en}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 font-mono text-[10px] opacity-70">
        {risk?.source === "meta_llama" ? "LIVE META MODEL" : risk ? "LOCAL RULES — NOT MODEL OUTPUT" : "WAITING"}
        {risk?.model ? ` · ${risk.model}` : ""}
        {risk?.fallback_reason ? ` · ${risk.fallback_reason}` : ""}
      </p>
      <p className="mt-2 text-xs">{locale === "ar"
        ? "تنبيه للمراجعة البشرية، وليس إثباتاً للاحتيال أو نسبة لاحتماله."
        : "Review signal, not proof or probability of fraud."}</p>
    </section>
  );
}

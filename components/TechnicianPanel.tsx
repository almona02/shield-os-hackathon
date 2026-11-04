"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { DEMO_PARTS, WORKSHOPS, copy } from "@/lib/i18n";

export function TechnicianPanel({
  locale,
  actorName,
  onSubmitted,
}: {
  locale: Locale;
  actorName: string;
  onSubmitted: () => void;
}) {
  const t = copy[locale];
  const [partName, setPartName] = useState<string>(DEMO_PARTS[0]);
  const [workshopId, setWorkshopId] = useState<string>(WORKSHOPS[0].id);
  // Prefer a machinery URL for category match; a person/office URL will show mismatch.
  const [photoName, setPhotoName] = useState(
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=960&q=70&auto=format&fit=crop",
  );
  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(
    WORKSHOPS[0],
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [evidence, setEvidence] = useState<{
    score: number;
    label: string;
    reason_en: string;
    reason_ar: string;
    source?: string;
    detections?: number;
    detected_objects?: { label: string; confidence: number | null }[];
    requested_category?: string;
    relevance_note?: string;
  } | null>(null);

  const workshop = WORKSHOPS.find((w) => w.id === workshopId) ?? WORKSHOPS[0];

  const captureGeo = () => {
    if (!navigator.geolocation) {
      setGeo({ lat: workshop.lat, lon: workshop.lon });
      setMsg(locale === "ar" ? "موقع الورشة الافتراضي" : "Using workshop default GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setMsg(locale === "ar" ? "تم التقاط الموقع" : "Location captured");
      },
      () => {
        setGeo({ lat: workshop.lat, lon: workshop.lon });
        setMsg(
          locale === "ar"
            ? "تعذر GPS — استخدمنا موقع الورشة"
            : "GPS denied — using workshop coords",
        );
      },
    );
  };

  const submit = async () => {
    setBusy(true);
    setMsg("");
    setEvidence(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          partName,
          workshop: locale === "ar" ? workshop.name_ar : workshop.name_en,
          entityId: partName.replace(/\s+/g, "-").toLowerCase(),
          createdBy: actorName,
          location: geo ?? { lat: workshop.lat, lon: workshop.lon },
          photo: photoName,
          photoName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvidence(data.evidence ?? null);
        setMsg(data.error ?? "Failed");
        return;
      }
      setEvidence(data.evidence ?? null);
      setMsg(
        locale === "ar"
          ? "تم تسجيل الطلب في الدفتر غير القابل للتغيير"
          : "Request sealed into the immutable ledger",
      );
      onSubmitted();
    } catch {
      setMsg(locale === "ar" ? "خطأ في الشبكة" : "Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-shield-forest/15 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-shield-ink">
        {t.requestPart}
      </h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-shield-steel">
          {t.partName}
          <select
            className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal text-shield-ink"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
          >
            {DEMO_PARTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-shield-steel">
          {t.location}
          <select
            className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal text-shield-ink"
            value={workshopId}
            onChange={(e) => {
              setWorkshopId(e.target.value);
              const w = WORKSHOPS.find((x) => x.id === e.target.value);
              if (w) setGeo({ lat: w.lat, lon: w.lon });
            }}
          >
            {WORKSHOPS.map((w) => (
              <option key={w.id} value={w.id}>
                {locale === "ar" ? w.name_ar : w.name_en}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-shield-steel">
          {t.photo}
          <input
            className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal"
            value={photoName}
            onChange={(e) => setPhotoName(e.target.value)}
            placeholder="motor-ylm-45.jpg or fake-invoice.png"
          />
          <span className="font-normal text-[11px] text-shield-steel/70">
            {locale === "ar"
              ? "fake-invoice.png = قاعدة تجريبية · رابط https = SAM 3.1 لملاءمة الفئة (ليس إثبات أصالة)"
              : "fake-invoice.png = MOCK filename rule · https URL = live SAM 3.1 category relevance (not authenticity)"}
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={captureGeo}
            className="rounded-xl border border-shield-forest/30 bg-shield-sand px-3 py-2 text-sm font-semibold text-shield-forest"
          >
            {t.geo}
          </button>
          {geo && (
            <span className="self-center font-mono text-[11px] text-shield-steel">
              {geo.lat.toFixed(4)}, {geo.lon.toFixed(4)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="rounded-xl bg-shield-mint px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : t.submit}
        </button>

        {evidence && (
          <div
            className={`rounded-xl px-3 py-2 text-xs ${
              evidence.label === "match" || evidence.label === "mock_pass"
                ? "bg-green-50 text-green-800"
                : evidence.label === "mock_reject" || evidence.label === "none"
                  ? "bg-red-50 text-red-800"
                  : "bg-amber-50 text-amber-900"
            }`}
          >
            <div className="mb-1.5">
              {evidence.source === "sam_3_1" ? (
                <span className="inline-block rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  LIVE SAM 3.1 — object localization
                </span>
              ) : (
                <span className="inline-block rounded-full bg-stone-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                  MOCK DEMO — filename rule (not SAM)
                </span>
              )}
            </div>
            {evidence.relevance_note ??
              `${evidence.label} · relevance ${evidence.score}%`}
            {evidence.detected_objects && evidence.detected_objects.length > 0 && (
              <div className="mt-1 font-mono text-[10px] opacity-80">
                objects:{" "}
                {evidence.detected_objects
                  .map(
                    (o) =>
                      `${o.label}${o.confidence != null ? ` ${o.confidence.toFixed(2)}` : ""}`,
                  )
                  .join(", ")}
              </div>
            )}
            <div className="mt-1">
              {locale === "ar" ? evidence.reason_ar : evidence.reason_en}
            </div>
          </div>
        )}
        {msg && <p className="text-xs text-shield-steel">{msg}</p>}
      </div>
    </section>
  );
}

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
  // Pexels industrial motor — verified LIVE SAM category match (~81).
  // Swap to a person/office URL during recording to demo the honest mismatch path.
  const [photoName, setPhotoName] = useState(
    "",
  );
  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(
    WORKSHOPS[0],
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [evidence, setEvidence] = useState<{
    score: number | null;
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
          : "Request recorded in the tamper-evident ledger",
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
            placeholder="Image data URL, images.unsplash.com URL, or demo filename"
          />
          <span className="font-normal text-[11px] text-shield-steel/70">
            {locale === "ar"
              ? "اسم يحتوي fake للرفض السريع، أو رابط/data-URL لصورة حقيقية عبر SAM 3.1"
              : "Use “fake” in the name for a quick reject, or paste an images.unsplash.com URL or PNG/JPEG/WebP data URL for SAM category detection"}
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
              ["matched", "simulated_match"].includes(evidence.label)
                ? "bg-green-50 text-green-800"
                : ["no_match", "simulated_reject"].includes(evidence.label)
                  ? "bg-red-50 text-red-800"
                  : "bg-amber-50 text-amber-900"
            }`}
          >
            Evidence · {evidence.source ?? "unavailable"} · {evidence.label}
            {evidence.score !== null ? ` · detection confidence ${evidence.score}/100` : ""}
            {typeof evidence.detections === "number"
              ? ` · detections ${evidence.detections}`
              : ""}
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

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FeedEvent } from "@/components/Feed";
import { MapView } from "@/components/MapView";
import { RiskPanel, type RiskData } from "@/components/RiskPanel";
import { Timeline } from "@/components/Timeline";
import type { Locale } from "@/lib/i18n";
import { copy } from "@/lib/i18n";

export default function ShieldDashboard() {
  const [locale, setLocale] = useState<Locale>("en");
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);

  const t = copy[locale];

  const refresh = useCallback(async () => {
    const [e, r] = await Promise.all([
      fetch("/api/events").then((res) => res.json()),
      fetch("/api/risk").then((res) => res.json()),
    ]);
    setEvents(e.records ?? []);
    setVerified(e.verified ?? false);
    setRisk(r);
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
    const id = setInterval(() => {
      refresh().catch(() => undefined);
    }, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-12 pt-4">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/"
            className="text-xs font-semibold text-shield-forest underline-offset-2 hover:underline"
          >
            ← SHIELD.OS
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-shield-ink">
            {t.dashboard}
          </h1>
          <p className="text-sm text-shield-steel">
            {locale === "ar"
              ? "جدول زمني · خريطة · مخاطر Llama"
              : "Timeline · Map · Llama risk"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="rounded-full border border-shield-forest/20 bg-white px-3 py-1 text-xs font-semibold text-shield-forest"
        >
          {t.lang}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <RiskPanel locale={locale} risk={risk} />
        </div>
        <Timeline events={events} locale={locale} verified={verified} />
        <MapView events={events} locale={locale} />
      </div>
    </div>
  );
}

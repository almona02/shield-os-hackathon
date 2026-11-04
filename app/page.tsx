"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Feed, type FeedEvent } from "@/components/Feed";
import { ManagerPanel } from "@/components/ManagerPanel";
import { TechnicianPanel } from "@/components/TechnicianPanel";
import type { Locale } from "@/lib/i18n";
import { copy } from "@/lib/i18n";

type Role = "technician" | "manager";

interface ApprovalView {
  id: string;
  entityId: string;
  title: string;
  createdBy: string;
  status: string;
  steps: {
    stepId: string;
    role: string;
    label?: string;
    status: string;
    approver: string | null;
  }[];
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [role, setRole] = useState<Role>("technician");
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [approvals, setApprovals] = useState<ApprovalView[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);

  const t = copy[locale];
  const actorName = role === "technician" ? "Mohamed" : "Ahmed.Manager";

  const refresh = useCallback(async () => {
    const [e, a] = await Promise.all([
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/approvals").then((r) => r.json()),
    ]);
    setEvents(e.records ?? []);
    setVerified(e.verified ?? false);
    // API returns pending-only now (ledger source of truth).
    setApprovals(a.requests ?? []);
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
    // Slower poll reduces Manager list flicker during Loom.
    const id = setInterval(() => {
      refresh().catch(() => undefined);
    }, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-10 pt-4">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-shield-forest">
              Meta AI Hackathon
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-shield-ink">
              {t.brand}
            </h1>
            <p className="mt-1 text-sm text-shield-steel">{t.tagline}</p>
          </div>
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="rounded-full border border-shield-forest/20 bg-white px-3 py-1 text-xs font-semibold text-shield-forest"
          >
            {t.lang}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-shield-steel">
            {t.switchRole}
          </span>
          {(["technician", "manager"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                role === r
                  ? "bg-shield-ink text-white"
                  : "bg-white text-shield-steel"
              }`}
            >
              {r === "technician" ? t.technician : t.manager}
            </button>
          ))}
          <Link
            href="/shield"
            className="ms-auto rounded-full bg-shield-forest px-3 py-1.5 text-xs font-semibold text-white"
          >
            {t.dashboard}
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-shield-steel">
          <span
            className={`inline-block size-2 rounded-full ${
              verified === null
                ? "bg-stone-400"
                : verified
                  ? "bg-shield-mint"
                  : "bg-shield-risk"
            }`}
          />
          {verified === null
            ? t.chainChecking
            : verified
              ? t.chainOk
              : t.chainBad}{" "}
          · {events.length} events · as <strong>{actorName}</strong>
        </div>
      </header>

      <div className="mb-4">
        {role === "technician" ? (
          <TechnicianPanel
            locale={locale}
            actorName={actorName}
            onSubmitted={refresh}
          />
        ) : (
          <ManagerPanel
            locale={locale}
            actorName={actorName}
            approvals={approvals}
            onDecided={refresh}
          />
        )}
      </div>

      <Feed events={events} locale={locale} />
    </div>
  );
}

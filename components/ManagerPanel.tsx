"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { WORKSHOPS, copy } from "@/lib/i18n";

interface ApprovalStep {
  stepId: string;
  role: string;
  label?: string;
  status: string;
  approver: string | null;
}

interface ApprovalView {
  id: string;
  entityId: string;
  title: string;
  createdBy: string;
  status: string;
  steps: ApprovalStep[];
}

export function ManagerPanel({
  locale,
  actorName,
  approvals,
  onDecided,
}: {
  locale: Locale;
  actorName: string;
  approvals: ApprovalView[];
  onDecided: () => void;
}) {
  const t = copy[locale];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Local optimistic list so polling cannot flicker items back after approve.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // If server confirms something is gone, clear its hidden flag.
    setHiddenIds((prev) => {
      const next = new Set(prev);
      for (const id of prev) {
        if (!approvals.some((a) => a.id === id && a.status === "pending")) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [approvals]);

  const pending = approvals.filter(
    (a) => a.status === "pending" && !hiddenIds.has(a.id),
  );

  const decide = async (id: string, decision: "approved" | "rejected") => {
    setBusyId(id);
    setError("");
    setHiddenIds((prev) => new Set(prev).add(id));
    const workshop = WORKSHOPS[0];
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          id,
          stepId: "manager",
          approver: actorName,
          decision,
          location: { lat: workshop.lat, lon: workshop.lon },
          workshop: locale === "ar" ? workshop.name_ar : workshop.name_en,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Put it back if the server rejected the decision.
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setError(`${data.code ?? "ERR"}: ${data.error}`);
        return;
      }
      onDecided();
    } catch {
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setError(locale === "ar" ? "خطأ في الشبكة" : "Network error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-shield-forest/15 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-shield-ink">
        {locale === "ar" ? "طلبات بانتظار الموافقة" : "Pending approvals"}
      </h2>
      {pending.length === 0 && (
        <p className="text-sm text-shield-steel/70">
          {locale === "ar" ? "لا طلبات حالياً" : "No pending requests"}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {pending.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-stone-100 bg-shield-sand/50 p-3"
          >
            <div className="text-sm font-semibold text-shield-ink">
              {a.title}
            </div>
            <div className="mt-0.5 text-xs text-shield-steel">
              {locale === "ar" ? `من ${a.createdBy}` : `from ${a.createdBy}`}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => decide(a.id, "approved")}
                className="rounded-xl bg-shield-mint px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t.approve}
              </button>
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => decide(a.id, "rejected")}
                className="rounded-xl border border-shield-risk px-3 py-2 text-sm font-semibold text-shield-risk disabled:opacity-50"
              >
                {t.reject}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-shield-risk">{error}</p>}
    </section>
  );
}

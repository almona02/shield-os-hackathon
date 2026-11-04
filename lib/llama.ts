/**
 * Meta Model API risk analysis (Muse Spark 1.3).
 * Llama public API (api.llama.com) was shut down; Meta's current chat
 * endpoint for hackathon keys is Muse Spark on https://api.meta.ai/v1.
 *
 * Env: META_API_KEY, META_MODEL (default muse-spark-1.3), META_LLAMA_URL
 */

export interface LlamaRiskFinding {
  pattern: string;
  severity: "low" | "medium" | "high" | "critical";
  explanation_en: string;
  explanation_ar: string;
}

export interface LlamaRiskResult {
  risk_score: number;
  findings: LlamaRiskFinding[];
  summary_en: string;
  summary_ar: string;
  /** Machine source id for UI badge */
  source: "meta_model_api" | "local_heuristic";
  /** Human-readable badge line judges see on /shield */
  source_label: string;
  model: string;
  endpoint: string;
  fallback_reason?: string;
}

export interface ShieldEventLite {
  event_hash: string;
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

const META_URL =
  process.env.META_LLAMA_URL ??
  "https://api.meta.ai/v1/chat/completions";

/** Muse Spark is Meta Model API's live chat model for hackathon keys. */
const META_MODEL =
  process.env.META_MODEL ??
  process.env.META_LLAMA_MODEL ??
  "muse-spark-1.3";

const LIVE_LABEL = `Source: ${META_MODEL} | Meta Model API (LIVE)`;
const FALLBACK_PREFIX = "Source: local_heuristic (fallback";

function hourUtc(iso: string): number {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 12 : d.getUTCHours();
}

function withFallbackMeta(
  result: Omit<
    LlamaRiskResult,
    "source" | "source_label" | "model" | "endpoint" | "fallback_reason"
  >,
  reason: string,
): LlamaRiskResult {
  return {
    ...result,
    source: "local_heuristic",
    source_label: `${FALLBACK_PREFIX} — ${reason})`,
    model: META_MODEL,
    endpoint: META_URL,
    fallback_reason: reason,
  };
}

/** Local corruption-pattern detector used when Meta API is unavailable. */
export function heuristicRisk(
  events: ShieldEventLite[],
  reason = "META_API_KEY not set",
): LlamaRiskResult {
  const findings: LlamaRiskFinding[] = [];
  const approvals = events.filter(
    (e) =>
      e.event_type === "VERIFICATION" &&
      (e.payload?.decision === "approved" ||
        e.payload?.kind === "approval_decision"),
  );

  const byApprover = new Map<string, number>();
  for (const a of approvals) {
    const who = a.proof.verified_by;
    byApprover.set(who, (byApprover.get(who) ?? 0) + 1);
  }
  for (const [who, count] of byApprover) {
    if (count >= 3) {
      findings.push({
        pattern: "SAME_APPROVER_BURST",
        severity: count >= 5 ? "critical" : "high",
        explanation_en: `${count} approvals from the same manager (${who}).`,
        explanation_ar: `${count} موافقات من نفس المدير (${who}).`,
      });
    }
  }

  const offHours = approvals.filter((a) => {
    const h = hourUtc(a.proof.timestamp);
    return h < 6 || h >= 22;
  });
  if (offHours.length >= 2) {
    findings.push({
      pattern: "OFF_HOURS_APPROVAL",
      severity: "high",
      explanation_en: `${offHours.length} approvals outside business hours (before 6 AM / after 10 PM UTC).`,
      explanation_ar: `${offHours.length} موافقات خارج ساعات العمل (قبل 6 ص / بعد 10 م UTC).`,
    });
  }

  const fastPairs: string[] = [];
  const sorted = [...approvals].sort(
    (a, b) =>
      Date.parse(a.proof.timestamp) - Date.parse(b.proof.timestamp),
  );
  for (let i = 1; i < sorted.length; i += 1) {
    const gap =
      (Date.parse(sorted[i].proof.timestamp) -
        Date.parse(sorted[i - 1].proof.timestamp)) /
      1000;
    if (
      gap < 30 &&
      sorted[i].proof.verified_by === sorted[i - 1].proof.verified_by
    ) {
      fastPairs.push(sorted[i].proof.verified_by);
    }
  }
  if (fastPairs.length > 0) {
    findings.push({
      pattern: "FAST_APPROVAL",
      severity: "medium",
      explanation_en: `Approvals under 30s apart by ${[...new Set(fastPairs)].join(", ")}.`,
      explanation_ar: `موافقات خلال أقل من 30 ثانية بواسطة ${[...new Set(fastPairs)].join("، ")}.`,
    });
  }

  const withLoc = approvals.filter((a) => a.proof.location);
  if (withLoc.length >= 2) {
    const first = withLoc[0].proof.location!;
    const mismatch = withLoc.filter((a) => {
      const loc = a.proof.location!;
      return (
        Math.abs(loc.lat - first.lat) > 0.5 ||
        Math.abs(loc.lon - first.lon) > 0.5
      );
    });
    if (mismatch.length > 0) {
      findings.push({
        pattern: "LOCATION_MISMATCH",
        severity: "high",
        explanation_en: `${mismatch.length} approvals far from the primary workshop location.`,
        explanation_ar: `${mismatch.length} موافقات بعيدة عن موقع الورشة الأساسي.`,
      });
    }
  }

  let score = 0;
  for (const f of findings) {
    if (f.severity === "critical") score += 35;
    else if (f.severity === "high") score += 25;
    else if (f.severity === "medium") score += 15;
    else score += 5;
  }
  score = Math.min(100, score);

  const summary_en =
    findings.length === 0
      ? "No corruption patterns detected in the last events."
      : findings.map((f) => f.explanation_en).join(" ");
  const summary_ar =
    findings.length === 0
      ? "لم تُكتشف أنماط فساد في آخر الأحداث."
      : findings.map((f) => f.explanation_ar).join(" ");

  return withFallbackMeta(
    { risk_score: score, findings, summary_en, summary_ar },
    reason,
  );
}

export async function analyzeRiskWithLlama(
  events: ShieldEventLite[],
): Promise<LlamaRiskResult> {
  const last50 = events.slice(0, 50);
  const apiKey = process.env.META_API_KEY?.trim();

  if (!apiKey) {
    return heuristicRisk(last50, "META_API_KEY not set");
  }

  const compact = last50.map((e) => ({
    type: e.event_type,
    entity: e.entity_id,
    by: e.proof.verified_by,
    at: e.proof.timestamp,
    loc: e.proof.location,
    payload: e.payload,
  }));

  const prompt = `You are SHIELD.OS corruption detector for spare-parts procurement in MENA workshops.
Analyze these immutable ledger events. Detect: same approver burst, off-hours approval (2 AM), location mismatch, fast approvals.
Return ONLY valid JSON (no markdown):
{"risk_score":0-100,"findings":[{"pattern":"...","severity":"low|medium|high|critical","explanation_en":"...","explanation_ar":"..."}],"summary_en":"...","summary_ar":"..."}

Events:
${JSON.stringify(compact)}`;

  try {
    const res = await fetch(META_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: META_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are SHIELD.OS. Detect procurement corruption patterns. Reply with JSON only. Dual language EN+AR.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 1,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn("[llama] Meta API error", res.status, body);
      const reason =
        res.status === 429
          ? "rate limited"
          : res.status === 401 || res.status === 403
            ? "auth failed"
            : `HTTP ${res.status}`;
      return heuristicRisk(last50, reason);
    }

    const data = (await res.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
      completion_message?: { content?: { text?: string } | string };
    };

    let text = data.choices?.[0]?.message?.content ?? "";
    if (!text && data.completion_message?.content) {
      const c = data.completion_message.content;
      text = typeof c === "string" ? c : (c.text ?? "");
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return heuristicRisk(last50, "empty/non-JSON model response");
    }

    const parsed = JSON.parse(match[0]) as {
      risk_score?: number;
      findings?: LlamaRiskFinding[];
      summary_en?: string;
      summary_ar?: string;
    };

    const fallback = heuristicRisk(last50, "unused");
    return {
      risk_score: Math.max(0, Math.min(100, Number(parsed.risk_score) || 0)),
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      summary_en: parsed.summary_en || fallback.summary_en,
      summary_ar: parsed.summary_ar || fallback.summary_ar,
      source: "meta_model_api",
      source_label: LIVE_LABEL,
      model: data.model || META_MODEL,
      endpoint: META_URL,
    };
  } catch (err) {
    console.warn("[llama] call failed, using heuristic", err);
    return heuristicRisk(
      last50,
      err instanceof Error ? err.message : "network error",
    );
  }
}

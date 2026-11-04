/**
 * Shield anomaly engine: evidence-only fraud and anomaly detection.
 *
 * Extracted from `realityos_core/capture_gateway/fraud_detector.py`
 * (QR replay, human-impossible intervals, photo reuse, GPS check)
 * and `vertical_almona/rules/anomaly_rule.py`
 * (severity levels, automatic response, escalation paths).
 *
 * Philosophy, unchanged from the Python core: detectors flag evidence.
 * They never silently block an append. A finding routes to human
 * review; the event is still recorded.
 */

export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export type AutomaticResponse =
  | "log_only"
  | "log_and_monitor"
  | "requires_review"
  | "immediate_freeze";

export interface AnomalyFinding {
  pattern: string;
  severity: AnomalySeverity;
  details: Record<string, unknown>;
  recommendation: string;
  requiresHumanReview: boolean;
  escalationPath: string[];
  automaticResponse: AutomaticResponse;
}

function buildFinding(
  pattern: string,
  severity: AnomalySeverity,
  details: Record<string, unknown>,
  recommendation: string,
): AnomalyFinding {
  return {
    pattern,
    severity,
    details,
    recommendation,
    requiresHumanReview: severity === "high" || severity === "critical",
    escalationPath: escalationFor(severity),
    automaticResponse: responseFor(severity),
  };
}

function escalationFor(severity: AnomalySeverity): string[] {
  if (severity === "critical") {
    return ["operator", "supervisor", "manager", "cto"];
  }
  if (severity === "high") return ["operator", "supervisor"];
  if (severity === "medium") return ["operator"];
  return [];
}

function responseFor(severity: AnomalySeverity): AutomaticResponse {
  if (severity === "critical") return "immediate_freeze";
  if (severity === "high") return "requires_review";
  if (severity === "medium") return "log_and_monitor";
  return "log_only";
}

/** Same QR presented more than once. */
export function detectQrReplay(
  qrId: string | undefined,
  previousUses: string[],
): AnomalyFinding | null {
  if (!qrId || previousUses.length === 0) return null;
  return buildFinding(
    "QR_REPLAY_ATTEMPT",
    "high",
    { qr_id: qrId, previous_use: previousUses[0] },
    "Flag for manual review: QR was already presented.",
  );
}

/** One verifier submitting for two entities seconds apart. */
export function detectHumanImpossibleInterval(
  verifiedBy: string,
  previousTimestamp: string | null | undefined,
  currentTimestamp: string,
  entityChanged: boolean,
  thresholdSeconds = 10,
): AnomalyFinding | null {
  if (!previousTimestamp) return null;
  const interval =
    (Date.parse(currentTimestamp) - Date.parse(previousTimestamp)) / 1000;
  if (Number.isNaN(interval)) return null;
  if (interval < thresholdSeconds && entityChanged) {
    return buildFinding(
      "HUMAN_IMPOSSIBLE_INTERVAL",
      "high",
      { verified_by: verifiedBy, interval_seconds: interval, entityChanged },
      "Possible device compromise or scripted submission.",
    );
  }
  return null;
}

/** Same photo hash attached to more than one event. */
export function detectPhotoReuse(
  photoHashes: string[] | undefined,
  knownUses: Record<string, { entityId: string; timestamp: string }[]>,
): AnomalyFinding | null {
  if (!photoHashes || photoHashes.length === 0) return null;
  const reused = photoHashes.filter((h) => (knownUses[h] ?? []).length > 0);
  if (reused.length === 0) return null;
  return buildFinding(
    "PHOTO_REUSE",
    "high",
    {
      photo_hashes: reused,
      previous_uses: reused.flatMap((h) => knownUses[h]),
    },
    "Flag for manual review: possible photo manipulation.",
  );
}

function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(s));
}

/**
 * Impossible travel between two GPS fixes. The Python core leaves
 * this as a placeholder; the hackathon extract implements it.
 */
export function detectImpossibleTravel(
  current: { lat: number; lon: number } | null | undefined,
  previous: { lat: number; lon: number } | null | undefined,
  intervalSeconds: number,
  maxSpeedKmh = 900,
): AnomalyFinding | null {
  if (!current || !previous) return null;
  if (!intervalSeconds || intervalSeconds <= 0) return null;
  const distanceKm = haversineKm(previous, current);
  const speedKmh = distanceKm / (intervalSeconds / 3600);
  if (speedKmh > maxSpeedKmh) {
    return buildFinding(
      "IMPOSSIBLE_TRAVEL",
      "critical",
      {
        distance_km: Math.round(distanceKm * 100) / 100,
        interval_seconds: intervalSeconds,
        speed_kmh: Math.round(speedKmh),
      },
      "Freeze and escalate: fixes imply faster-than-aircraft travel.",
    );
  }
  return null;
}

/** Numeric reading outside its expected band (from AlmonaAnomalyRule). */
export function detectThresholdDrift(
  detected: number,
  expected: number,
  threshold: number,
  label = "reading",
): AnomalyFinding | null {
  if (![detected, expected, threshold].every((n) => Number.isFinite(n))) {
    return null;
  }
  const delta = Math.abs(detected - expected);
  if (delta <= threshold) return null;
  const ratio = delta / threshold;
  const severity: AnomalySeverity =
    ratio >= 5 ? "critical" : ratio >= 2 ? "high" : "medium";
  return buildFinding(
    "THRESHOLD_DRIFT",
    severity,
    { label, detected, expected, delta, threshold },
    severity === "medium"
      ? "Log and keep monitoring this entity."
      : "Route to human review before acting on this entity.",
  );
}

export interface AnomalyEventInput {
  event_type: string;
  entity_id: string;
  proof: {
    verified_by: string;
    timestamp: string;
    location: { lat: number; lon: number } | null;
    qr_id?: string;
    photo_hashes?: string[];
  };
  payload?: Record<string, unknown>;
}

export interface AnomalyContext {
  previousTimestampForVerifier?: string | null;
  previousEntityForVerifier?: string | null;
  previousQrUses?: string[];
  knownPhotoUses?: Record<string, { entityId: string; timestamp: string }[]>;
  previousLocation?: { lat: number; lon: number } | null;
}

/** Run every detector over one event. Returns findings, never throws. */
export function analyzeEvent(
  event: AnomalyEventInput,
  context: AnomalyContext = {},
): AnomalyFinding[] {
  const findings: AnomalyFinding[] = [];
  const push = (f: AnomalyFinding | null) => {
    if (f) findings.push(f);
  };

  push(
    detectQrReplay(event.proof.qr_id, context.previousQrUses ?? []),
  );
  push(
    detectHumanImpossibleInterval(
      event.proof.verified_by,
      context.previousTimestampForVerifier ?? null,
      event.proof.timestamp,
      (context.previousEntityForVerifier ?? event.entity_id) !==
        event.entity_id,
    ),
  );
  push(
    detectPhotoReuse(event.proof.photo_hashes, context.knownPhotoUses ?? {}),
  );

  if (context.previousTimestampForVerifier) {
    const interval =
      (Date.parse(event.proof.timestamp) -
        Date.parse(context.previousTimestampForVerifier)) /
      1000;
    push(
      detectImpossibleTravel(
        event.proof.location,
        context.previousLocation ?? null,
        interval,
      ),
    );
  }

  const reading = event.payload?.reading;
  if (reading && typeof reading === "object" && !Array.isArray(reading)) {
    const { detected, expected, threshold } = reading as Record<string, number>;
    push(detectThresholdDrift(detected, expected, threshold, "reading"));
  }

  return findings;
}

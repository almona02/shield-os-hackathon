/**
 * Server-only wiring: singletons shared by the API routes.
 * Prefers Supabase LogStore when NEXT_PUBLIC_SUPABASE_* is set;
 * falls back to in-memory MemoryLogStore for local demos.
 */
import {
  ImmutableLog,
  MemoryLogStore,
  analyzeEvent,
  type AnomalyContext,
  type ApprovalRequest,
  type ShieldEventRecord,
} from "@shield-core/index";
import { createShieldSupabase } from "@/lib/supabase";
import { SupabaseLogStore } from "@/lib/supabase-store";

type ShieldGlobals = {
  __shieldLog?: ImmutableLog;
  __shieldBackend?: "supabase" | "memory";
  __shieldApprovals?: Map<string, ApprovalRequest>;
  __shieldVerifierContext?: Map<
    string,
    {
      timestamp: string;
      entityId: string;
      location: { lat: number; lon: number } | null;
    }
  >;
  __shieldQrUses?: Map<string, string[]>;
  __shieldPhotoUses?: Map<
    string,
    { entityId: string; timestamp: string }[]
  >;
};

const g = globalThis as typeof globalThis & ShieldGlobals;

function createLog(): { log: ImmutableLog; backend: "supabase" | "memory" } {
  const client = createShieldSupabase();
  if (client) {
    return {
      log: new ImmutableLog(new SupabaseLogStore(client)),
      backend: "supabase",
    };
  }
  return {
    log: new ImmutableLog(new MemoryLogStore()),
    backend: "memory",
  };
}

if (!g.__shieldLog) {
  const created = createLog();
  g.__shieldLog = created.log;
  g.__shieldBackend = created.backend;
}

export const log: ImmutableLog = g.__shieldLog!;
export const ledgerBackend: "supabase" | "memory" =
  g.__shieldBackend ?? "memory";

export const approvals: Map<string, ApprovalRequest> =
  g.__shieldApprovals ?? (g.__shieldApprovals = new Map());

const verifierContext =
  g.__shieldVerifierContext ??
  (g.__shieldVerifierContext = new Map());

const qrUses = g.__shieldQrUses ?? (g.__shieldQrUses = new Map());

const photoUses =
  g.__shieldPhotoUses ?? (g.__shieldPhotoUses = new Map());

export function buildAnomalyContext(
  verifiedBy: string,
  qrId?: string,
): AnomalyContext {
  const prev = verifierContext.get(verifiedBy);
  const knownPhotoUses: AnomalyContext["knownPhotoUses"] = {};
  for (const [hash, uses] of photoUses) knownPhotoUses[hash] = uses;
  return {
    previousTimestampForVerifier: prev?.timestamp ?? null,
    previousEntityForVerifier: prev?.entityId ?? null,
    previousLocation: prev?.location ?? null,
    previousQrUses: qrId ? (qrUses.get(qrId) ?? []) : [],
    knownPhotoUses,
  };
}

export function analyzeAndTrack(record: ShieldEventRecord) {
  const findings = analyzeEvent(
    {
      event_type: record.event_type,
      entity_id: record.entity_id,
      proof: record.proof,
      payload: record.payload,
    },
    buildAnomalyContext(record.proof.verified_by, record.proof.qr_id),
  );

  verifierContext.set(record.proof.verified_by, {
    timestamp: record.proof.timestamp,
    entityId: record.entity_id,
    location: record.proof.location,
  });
  if (record.proof.qr_id) {
    const uses = qrUses.get(record.proof.qr_id) ?? [];
    uses.push(record.proof.timestamp);
    qrUses.set(record.proof.qr_id, uses);
  }
  for (const h of record.proof.photo_hashes ?? []) {
    const uses = photoUses.get(h) ?? [];
    uses.push({
      entityId: record.entity_id,
      timestamp: record.proof.timestamp,
    });
    photoUses.set(h, uses);
  }
  return findings;
}

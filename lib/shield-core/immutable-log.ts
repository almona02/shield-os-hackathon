/**
 * Shield immutable log: append-only, hash-chained event ledger.
 *
 * Extracted from `realityos_core/event_ledger.py`, `chain_verifier.py`,
 * and `realityos_core/schema/event_schema_v1.sql`.
 *
 * Design rules (mirrors the Python core):
 * - Append-only. This module exposes no update and no delete path.
 * - Every event links to the previous hash (Principle 3: chain of custody).
 * - Proof must carry `verified_by` + `timestamp` (Principle 1: human-verified).
 * - Hash collisions are retried with a nonce, then fail loudly.
 *
 * Storage is behind the `LogStore` interface. The default
 * `MemoryLogStore` keeps the demo runnable with no database.
 */

import { createHash } from "node:crypto";

export type ShieldEventType =
  | "ON"
  | "OFF"
  | "FAULT"
  | "INSPECTION"
  | "VERIFICATION";

export interface GpsPoint {
  lat: number;
  lon: number;
}

export interface RealityProof {
  verified_by: string;
  /** ISO-8601 timestamp of the human verification. */
  timestamp: string;
  location: GpsPoint | null;
  qr_id?: string;
  photo_hashes?: string[];
}

export interface ShieldEventInput {
  event_type: ShieldEventType;
  entity_id: string;
  vertical_id: string;
  proof: RealityProof;
  payload?: Record<string, unknown>;
}

export interface ShieldEventRecord {
  event_hash: string;
  prev_hash: string | null;
  chain_position: number;
  event_type: ShieldEventType;
  entity_id: string;
  vertical_id: string;
  proof: RealityProof;
  payload: Record<string, unknown>;
  recorded_at: string;
}

export class ImmutableLogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImmutableLogError";
  }
}

export class ChainIntegrityError extends ImmutableLogError {
  constructor(message: string) {
    super(message);
    this.name = "ChainIntegrityError";
  }
}

/** Genesis hash: 64 zeros, matching migration 041. */
export const GENESIS_HASH = "0".repeat(64);

export function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/** Deterministic JSON encoding so hashes are stable across runs. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}

export function computeEventHash(
  prevHash: string | null,
  event: ShieldEventInput,
  nonce = 0,
): string {
  const payloadHash = sha256Hex(stableStringify(event.payload ?? {}));
  const proofHash = sha256Hex(stableStringify(event.proof));
  const material = [
    prevHash ?? "GENESIS",
    event.event_type,
    event.entity_id,
    event.vertical_id,
    payloadHash,
    proofHash,
    String(nonce),
  ].join("|");
  return sha256Hex(material);
}

function assertValidProof(proof: RealityProof): void {
  if (!proof || typeof proof !== "object") {
    throw new ImmutableLogError("Proof is required.");
  }
  if (!proof.verified_by || typeof proof.verified_by !== "string") {
    throw new ImmutableLogError("Proof must include verified_by.");
  }
  if (!proof.timestamp || Number.isNaN(Date.parse(proof.timestamp))) {
    throw new ImmutableLogError("Proof must include a valid timestamp.");
  }
  if (!("location" in proof)) {
    throw new ImmutableLogError("Proof must include a location key.");
  }
}

/** Minimal persistence contract. No update, no delete. */
export interface LogStore {
  getLast(): Promise<Pick<
    ShieldEventRecord,
    "event_hash" | "chain_position"
  > | null>;
  hashExists(eventHash: string): Promise<boolean>;
  insert(record: ShieldEventRecord): Promise<void>;
  list(limit: number): Promise<ShieldEventRecord[]>;
  findByHash(eventHash: string): Promise<ShieldEventRecord | null>;
}

/** In-memory store seeded with the genesis event. */
export class MemoryLogStore implements LogStore {
  private records: ShieldEventRecord[] = [
    {
      event_hash: GENESIS_HASH,
      prev_hash: null,
      chain_position: 1,
      event_type: "VERIFICATION",
      entity_id: "shield_genesis",
      vertical_id: "shield_core",
      proof: {
        verified_by: "system",
        timestamp: "2025-02-20T00:00:00.000Z",
        location: null,
      },
      payload: {},
      recorded_at: "2025-02-20T00:00:00.000Z",
    },
  ];

  async getLast() {
    const last = this.records[this.records.length - 1] ?? null;
    return last
      ? {
          event_hash: last.event_hash,
          chain_position: last.chain_position,
        }
      : null;
  }

  async hashExists(eventHash: string): Promise<boolean> {
    return this.records.some((r) => r.event_hash === eventHash);
  }

  async insert(record: ShieldEventRecord): Promise<void> {
    this.records.push(Object.freeze({ ...record }) as ShieldEventRecord);
  }

  async list(limit: number): Promise<ShieldEventRecord[]> {
    return [...this.records]
      .sort((a, b) => b.chain_position - a.chain_position)
      .slice(0, limit);
  }

  async findByHash(eventHash: string): Promise<ShieldEventRecord | null> {
    return this.records.find((r) => r.event_hash === eventHash) ?? null;
  }
}

export class ImmutableLog {
  constructor(private readonly store: LogStore = new MemoryLogStore()) {}

  /** Append one event. Never mutates existing records. */
  async recordEvent(event: ShieldEventInput): Promise<ShieldEventRecord> {
    if (!event.entity_id || !event.vertical_id || !event.event_type) {
      throw new ImmutableLogError(
        "event_type, entity_id, and vertical_id are required.",
      );
    }
    assertValidProof(event.proof);

    const last = await this.store.getLast();
    if (!last) {
      throw new ChainIntegrityError(
        "Cannot record event: genesis event missing. Seed the store first.",
      );
    }

    let eventHash = "";
    let nonce = 0;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      nonce = attempt;
      eventHash = computeEventHash(last.event_hash, event, nonce);
      if (!(await this.store.hashExists(eventHash))) break;
      if (attempt === 9) {
        throw new ImmutableLogError(
          "Hash collision after 10 attempts. This should never happen.",
        );
      }
    }

    const record: ShieldEventRecord = {
      event_hash: eventHash,
      prev_hash: last.event_hash,
      chain_position: last.chain_position + 1,
      event_type: event.event_type,
      entity_id: event.entity_id,
      vertical_id: event.vertical_id,
      proof: event.proof,
      payload: event.payload ?? {},
      recorded_at: new Date().toISOString(),
    };
    void nonce;
    await this.store.insert(record);
    return record;
  }

  async getChain(options?: {
    entity_id?: string;
    vertical_id?: string;
    limit?: number;
  }): Promise<ShieldEventRecord[]> {
    const rows = await this.store.list(options?.limit ?? 100);
    return rows.filter(
      (r) =>
        (!options?.entity_id || r.entity_id === options.entity_id) &&
        (!options?.vertical_id || r.vertical_id === options.vertical_id),
    );
  }

  async getEvent(eventHash: string): Promise<ShieldEventRecord | null> {
    return this.store.findByHash(eventHash);
  }

  /**
   * Full chain verification (ports `ChainVerifier.verify_full_chain`,
   * plus hash recomputation which the Python core lists as TODO).
   */
  async verifyChain(): Promise<true> {
    const rows = [...(await this.store.list(Number.MAX_SAFE_INTEGER))].sort(
      (a, b) => a.chain_position - b.chain_position,
    );
    if (rows.length === 0) throw new ChainIntegrityError("Genesis missing: empty ledger.");

    const [first, ...rest] = rows;
    if (first.prev_hash !== null || first.event_hash !== GENESIS_HASH || first.chain_position !== 1 || first.entity_id !== "shield_genesis" || first.vertical_id !== "shield_core") {
      throw new ChainIntegrityError(
        `First event (position ${first.chain_position}) must be genesis.`,
      );
    }

    let previousHash = first.event_hash;
    let previousPosition = 1;
    for (const current of rest) {
      if (current.chain_position !== previousPosition + 1) throw new ChainIntegrityError("Non-contiguous chain positions.");
      if (current.prev_hash !== previousHash) {
        throw new ChainIntegrityError(
          `Chain broken at position ${current.chain_position}. ` +
            `Expected prev_hash=${previousHash}, got ${current.prev_hash}.`,
        );
      }
      const recomputed = computeEventHash(current.prev_hash, {
        event_type: current.event_type,
        entity_id: current.entity_id,
        vertical_id: current.vertical_id,
        proof: current.proof,
        payload: current.payload,
      });
      // Nonce-0 fast path covers the demo store; a mismatch here means
      // either tampering or a nonce-bearing record worth re-checking.
      if (recomputed !== current.event_hash) {
        let matched = false;
        for (let nonce = 1; nonce < 10; nonce += 1) {
          if (
            computeEventHash(
              current.prev_hash,
              {
                event_type: current.event_type,
                entity_id: current.entity_id,
                vertical_id: current.vertical_id,
                proof: current.proof,
                payload: current.payload,
              },
              nonce,
            ) === current.event_hash
          ) {
            matched = true;
            break;
          }
        }
        if (!matched) {
          throw new ChainIntegrityError(
            `Hash mismatch at position ${current.chain_position}: ` +
              "record was tampered with or corrupted.",
          );
        }
      }
      previousHash = current.event_hash;
      previousPosition = current.chain_position;
    }
    return true;
  }
}

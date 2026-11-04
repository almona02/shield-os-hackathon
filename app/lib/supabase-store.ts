/**
 * Supabase-backed append-only LogStore.
 * UPDATE/DELETE are blocked by DB trigger `trg_shield_no_update`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LogStore,
  RealityProof,
  ShieldEventRecord,
  ShieldEventType,
} from "@shield-core/index";

type Row = {
  event_hash: string;
  prev_hash: string | null;
  chain_position: number;
  event_type: ShieldEventType;
  entity_id: string;
  vertical_id: string;
  proof: RealityProof;
  payload: Record<string, unknown>;
  recorded_at: string;
};

function toRecord(row: Row): ShieldEventRecord {
  return {
    event_hash: row.event_hash,
    prev_hash: row.prev_hash,
    chain_position: Number(row.chain_position),
    event_type: row.event_type,
    entity_id: row.entity_id,
    vertical_id: row.vertical_id,
    proof: row.proof,
    payload: row.payload ?? {},
    recorded_at: row.recorded_at,
  };
}

export class SupabaseLogStore implements LogStore {
  constructor(private readonly client: SupabaseClient) {}

  async getLast() {
    const { data, error } = await this.client
      .from("shield_events")
      .select("event_hash, chain_position")
      .order("chain_position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Supabase getLast: ${error.message}`);
    if (!data) return null;
    return {
      event_hash: data.event_hash as string,
      chain_position: Number(data.chain_position),
    };
  }

  async hashExists(eventHash: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("shield_events")
      .select("event_hash")
      .eq("event_hash", eventHash)
      .maybeSingle();
    if (error) throw new Error(`Supabase hashExists: ${error.message}`);
    return Boolean(data);
  }

  async insert(record: ShieldEventRecord): Promise<void> {
    const { error } = await this.client.from("shield_events").insert({
      event_hash: record.event_hash,
      prev_hash: record.prev_hash,
      chain_position: record.chain_position,
      event_type: record.event_type,
      entity_id: record.entity_id,
      vertical_id: record.vertical_id,
      proof: record.proof,
      payload: record.payload,
      recorded_at: record.recorded_at,
    });
    if (error) throw new Error(`Supabase insert: ${error.message}`);
  }

  async list(limit: number): Promise<ShieldEventRecord[]> {
    const { data, error } = await this.client
      .from("shield_events")
      .select(
        "event_hash, prev_hash, chain_position, event_type, entity_id, vertical_id, proof, payload, recorded_at",
      )
      .order("chain_position", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase list: ${error.message}`);
    return (data as Row[] | null)?.map(toRecord) ?? [];
  }

  async findByHash(eventHash: string): Promise<ShieldEventRecord | null> {
    const { data, error } = await this.client
      .from("shield_events")
      .select(
        "event_hash, prev_hash, chain_position, event_type, entity_id, vertical_id, proof, payload, recorded_at",
      )
      .eq("event_hash", eventHash)
      .maybeSingle();
    if (error) throw new Error(`Supabase findByHash: ${error.message}`);
    return data ? toRecord(data as Row) : null;
  }
}

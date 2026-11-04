import { NextResponse } from "next/server";
import { analyzeRiskWithLlama, type ShieldEventLite } from "@/lib/llama";
import { log } from "@/lib/shield";

export const dynamic = "force-dynamic";

export async function GET() {
  const records = await log.getChain({ limit: 50 });
  const lite: ShieldEventLite[] = records.map((r) => ({
    event_hash: r.event_hash,
    event_type: r.event_type,
    entity_id: r.entity_id,
    recorded_at: r.recorded_at,
    proof: {
      verified_by: r.proof.verified_by,
      timestamp: r.proof.timestamp,
      location: r.proof.location,
    },
    payload: r.payload,
  }));
  const risk = await analyzeRiskWithLlama(lite);
  return NextResponse.json(risk);
}

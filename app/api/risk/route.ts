import { NextResponse } from "next/server";
import { analyzeRiskWithLlama, type ShieldEventLite } from "@/lib/llama";
import { log } from "@/lib/shield";

export const dynamic = "force-dynamic";

export async function GET() {
  const generated_at = new Date().toISOString();
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
  return NextResponse.json(
    {
      ...risk,
      generated_at,
      events_analyzed: lite.length,
      disclaimer_en:
        "Risk score is an uncalibrated model signal for human review — not a fraud probability or proof of collusion.",
      disclaimer_ar:
        "درجة المخاطر إشارة نموذج غير معايرة للمراجعة البشرية — وليست احتمال احتيال أو إثبات تواطؤ.",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

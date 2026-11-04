import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Demo-only: attempt a ledger UPDATE with the service role so the
 * Postgres trigger error surfaces (RLS alone silently affects 0 rows).
 * Always returns blocked:true — never mutates.
 */
export async function POST() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      blocked: true,
      layer: "api",
      message:
        "No service role configured. API still rejects PUT/DELETE with 405; set SUPABASE_SERVICE_ROLE_KEY to demo the DB trigger.",
    });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: updateError } = await admin
    .from("shield_events")
    .update({ entity_id: "tamper_attempt" })
    .eq("chain_position", 1);

  const { error: deleteError } = await admin
    .from("shield_events")
    .delete()
    .eq("chain_position", 1);

  return NextResponse.json({
    blocked: true,
    layer: "postgres_trigger",
    update: {
      blocked: Boolean(updateError),
      message: updateError?.message ?? "unexpected: update did not error",
    },
    delete: {
      blocked: Boolean(deleteError),
      message: deleteError?.message ?? "unexpected: delete did not error",
    },
  });
}

export async function PUT() {
  return NextResponse.json(
    { error: "shield_events is append-only: UPDATE not allowed" },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "shield_events is append-only: DELETE not allowed" },
    { status: 405 },
  );
}

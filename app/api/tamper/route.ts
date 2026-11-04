import { NextResponse } from "next/server";

/** Never attempt privileged mutations against the live ledger for a demonstration. */
export async function POST() {
  return NextResponse.json({
    tested: false,
    message: "Live destructive probe disabled. Verify database triggers in a disposable database inside a rolled-back transaction. API rejection alone does not prove database enforcement.",
  }, { status: 410 });
}
export async function PUT() {
  return NextResponse.json({ error: "Append-only API: UPDATE not allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Append-only API: DELETE not allowed" }, { status: 405 });
}

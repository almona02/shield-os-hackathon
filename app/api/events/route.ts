import { NextResponse } from "next/server";
import { ChainIntegrityError } from "@shield-core/index";
import { analyzeAndTrack, ledgerBackend, log } from "@/lib/shield";

export async function GET() {
  const records = await log.getChain({ limit: 50 });
  try {
    await log.verifyChain();
    return NextResponse.json({
      records,
      verified: true,
      backend: ledgerBackend,
    });
  } catch (err) {
    return NextResponse.json(
      {
        records,
        verified: false,
        backend: ledgerBackend,
        error: err instanceof Error ? err.message : "Chain broken",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const input = body as {
    event_type?: string;
    entity_id?: string;
    vertical_id?: string;
    proof?: {
      verified_by?: string;
      timestamp?: string;
      location?: { lat: number; lon: number } | null;
      qr_id?: string;
      photo_hashes?: string[];
    };
    payload?: Record<string, unknown>;
  };

  try {
    if (!input.event_type || !input.entity_id || !input.proof?.verified_by) {
      throw new Error("event_type, entity_id, and proof.verified_by required.");
    }
    const record = await log.recordEvent({
      event_type: input.event_type as
        | "ON"
        | "OFF"
        | "FAULT"
        | "INSPECTION"
        | "VERIFICATION",
      entity_id: input.entity_id,
      vertical_id: input.vertical_id ?? "spare_parts",
      proof: {
        verified_by: input.proof.verified_by,
        timestamp: input.proof.timestamp ?? new Date().toISOString(),
        location: input.proof.location ?? null,
        qr_id: input.proof.qr_id,
        photo_hashes: input.proof.photo_hashes,
      },
      payload: input.payload ?? {},
    });
    const findings = analyzeAndTrack(record);
    return NextResponse.json({ record, findings }, { status: 201 });
  } catch (err) {
    const status = err instanceof ChainIntegrityError ? 500 : 400;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Record failed." },
      { status },
    );
  }
}

/** Explicitly reject mutation attempts — append-only contract. */
export async function PUT() {
  return NextResponse.json(
    { error: "shield_events is append-only: UPDATE not allowed" },
    { status: 405 },
  );
}

export async function PATCH() {
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

import { NextResponse } from "next/server";
import { verifyEvidence } from "@/lib/sam";

export async function POST(request: Request) {
  let body: { photo?: string; expectedPart?: string };
  try {
    body = (await request.json()) as { photo?: string; expectedPart?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.photo) {
    return NextResponse.json({ error: "photo required" }, { status: 400 });
  }
  const verdict = await verifyEvidence(body.photo, body.expectedPart);
  return NextResponse.json(verdict);
}

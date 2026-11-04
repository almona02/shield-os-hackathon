import { NextResponse } from "next/server";
import {
  ApprovalChainError,
  approvalDecisionPayload,
  approve,
  createRequest,
  reject,
  type ApprovalRequest,
} from "@shield-core/index";
import { analyzeAndTrack, approvals, log } from "@/lib/shield";
import { verifyEvidence } from "@/lib/sam";

/**
 * Serverless instances do not share the in-memory Map. Rebuild pending
 * approvals from the durable ledger so Manager can still decide.
 */
async function hydratePendingFromLedger(): Promise<ApprovalRequest[]> {
  const records = await log.getChain({ limit: 80 });
  const decided = new Set<string>();
  const pending: ApprovalRequest[] = [];

  for (const r of records) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const approvalId = typeof p.approval_id === "string" ? p.approval_id : null;
    if (!approvalId) continue;

    if (p.kind === "approval_decision") {
      decided.add(approvalId);
      continue;
    }
    if (
      p.kind === "spare_part_request" &&
      p.status === "awaiting_approval" &&
      !decided.has(approvalId) &&
      !approvals.has(approvalId)
    ) {
      const req: ApprovalRequest = {
        id: approvalId,
        entityId: r.entity_id,
        title: String(p.part_name ?? r.entity_id),
        createdBy: r.proof.verified_by,
        createdAt: r.recorded_at,
        status: "pending",
        steps: [
          {
            stepId: "manager",
            role: "manager",
            label: "Manager",
            status: "pending",
            approver: null,
            decidedAt: null,
            note: null,
          },
        ],
      };
      approvals.set(req.id, req);
      pending.push(req);
    }
  }
  return pending;
}

export async function GET() {
  await hydratePendingFromLedger();
  return NextResponse.json({
    requests: [...approvals.values()].reverse(),
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    if (body.action === "create") {
      const partName = String(body.partName ?? body.title ?? "Spare part");
      const workshop = String(body.workshop ?? "Giza Workshop");
      const createdBy = String(body.createdBy ?? "technician");
      const entityId = String(body.entityId ?? partName.replace(/\s+/g, "-").toLowerCase());
      const location = (body.location as { lat: number; lon: number } | null) ?? null;
      const photo = typeof body.photo === "string" ? body.photo : "";
      const photoName = String(body.photoName ?? photo.slice(0, 80));

      const evidence = photo
        ? await verifyEvidence(photoName || photo, partName)
        : null;

      // Block only the deterministic mock reject (fake-invoice filename).
      // SAM mismatch is allowed through so the UI can show low relevance.
      if (evidence && evidence.label === "mock_reject") {
        return NextResponse.json(
          {
            error:
              "Deterministic demo rule rejected this evidence filename (not a live SAM verdict).",
            evidence,
          },
          { status: 400 },
        );
      }

      const req = createRequest({
        entityId,
        title: partName,
        createdBy,
        steps: [
          { stepId: "manager", role: "manager", label: "Manager" },
        ],
      });
      approvals.set(req.id, req);

      const record = await log.recordEvent({
        event_type: "INSPECTION",
        entity_id: entityId,
        vertical_id: "spare_parts",
        proof: {
          verified_by: createdBy,
          timestamp: new Date().toISOString(),
          location,
          photo_hashes: evidence ? [evidence.photo_hash] : undefined,
        },
        payload: {
          kind: "spare_part_request",
          approval_id: req.id,
          part_name: partName,
          workshop,
          evidence_score: evidence?.score ?? null,
          evidence_label: evidence?.label ?? null,
          status: "awaiting_approval",
        },
      });
      const findings = analyzeAndTrack(record);

      return NextResponse.json(
        { request: req, record, findings, evidence },
        { status: 201 },
      );
    }

    if (body.action === "decide") {
      await hydratePendingFromLedger();
      const current = approvals.get(body.id as string);
      if (!current) {
        return NextResponse.json(
          { error: "Unknown approval id." },
          { status: 404 },
        );
      }
      const location =
        (body.location as { lat: number; lon: number } | null) ?? null;
      const next =
        body.decision === "rejected"
          ? reject(current, {
              stepId: (body.stepId as string) || "manager",
              approver: body.approver as string,
              note: (body.note as string) ?? undefined,
            })
          : approve(current, {
              stepId: (body.stepId as string) || "manager",
              approver: body.approver as string,
              note: (body.note as string) ?? undefined,
            });
      approvals.set(next.id, next);
      const step = next.steps.find(
        (s) => s.stepId === ((body.stepId as string) || "manager"),
      );
      if (!step) {
        return NextResponse.json({ request: next });
      }
      const record = await log.recordEvent({
        event_type: "VERIFICATION",
        entity_id: next.entityId,
        vertical_id: "spare_parts",
        proof: {
          verified_by: body.approver as string,
          timestamp: new Date().toISOString(),
          location,
        },
        payload: {
          ...approvalDecisionPayload(next, step),
          kind: "approval_decision",
          part_name: next.title,
          workshop: body.workshop ?? null,
        },
      });
      const findings = analyzeAndTrack(record);
      return NextResponse.json({ request: next, record, findings });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approval failed.";
    const code =
      err instanceof ApprovalChainError ? err.code : "APPROVAL_FAILED";
    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}

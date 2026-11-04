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
 * Pending approvals are derived from the durable ledger (source of truth).
 * The in-memory Map is only a helper for approve()/reject() on this instance.
 */
async function syncPendingFromLedger(): Promise<ApprovalRequest[]> {
  const records = await log.getChain({ limit: 100 });
  const decided = new Set<string>();
  const pending = new Map<string, ApprovalRequest>();

  // records are newest-first
  for (const r of records) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const approvalId = typeof p.approval_id === "string" ? p.approval_id : null;
    if (!approvalId) continue;

    if (p.kind === "approval_decision") {
      decided.add(approvalId);
      pending.delete(approvalId);
      continue;
    }

    if (
      p.kind === "spare_part_request" &&
      p.status === "awaiting_approval" &&
      !decided.has(approvalId) &&
      !pending.has(approvalId)
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
      pending.set(approvalId, req);
    }
  }

  // Keep Map aligned: drop decided leftovers, ensure pending are loadable for decide().
  for (const [id, req] of approvals.entries()) {
    if (req.status !== "pending" || decided.has(id) || !pending.has(id)) {
      if (!pending.has(id)) approvals.delete(id);
    }
  }
  for (const [id, req] of pending.entries()) {
    approvals.set(id, req);
  }

  return [...pending.values()];
}

export async function GET() {
  const pending = await syncPendingFromLedger();
  return NextResponse.json({
    requests: pending,
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
      const entityId = String(
        body.entityId ?? partName.replace(/\s+/g, "-").toLowerCase(),
      );
      const location =
        (body.location as { lat: number; lon: number } | null) ?? null;
      const photo = typeof body.photo === "string" ? body.photo : "";
      const photoName = String(body.photoName ?? photo.slice(0, 80));

      const evidence = photo
        ? await verifyEvidence(photoName || photo, partName)
        : null;

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
        steps: [{ stepId: "manager", role: "manager", label: "Manager" }],
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
      const id = String(body.id ?? "");
      await syncPendingFromLedger();
      const current = approvals.get(id);
      if (!current || current.status !== "pending") {
        return NextResponse.json(
          {
            error: "This request is not pending (already decided or unknown).",
            code: "NOT_PENDING",
          },
          { status: 409 },
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

      // Remove from pending Map immediately so GET cannot resurrect it.
      approvals.delete(next.id);

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
          approval_id: next.id,
          part_name: next.title,
          workshop: body.workshop ?? null,
        },
      });
      const findings = analyzeAndTrack(record);
      const pending = await syncPendingFromLedger();
      return NextResponse.json({
        request: next,
        record,
        findings,
        requests: pending,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approval failed.";
    const code =
      err instanceof ApprovalChainError ? err.code : "APPROVAL_FAILED";
    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}

/**
 * Shield approval chain: ordered multi-step approvals with no overrides.
 *
 * Extracted from
 * `src/lib/fabricator/manufacturing/ManufacturingAuthorityResolver.ts`
 * (frozen authority objects, identity matching),
 * `scripts/e2e-seed-admin-approvals-chain.ts` (requester/approver flow),
 * and `realityos_core/vertical_registry.py` + `base_rule.py`
 * (constitutional ban on admin overrides and event mutation).
 *
 * Rules:
 * - Steps decide strictly in order. Skipping is rejected.
 * - The requester can never approve their own request.
 * - Each step needs a distinct approver.
 * - Every transition returns a new frozen object. Nothing mutates.
 * - There is intentionally no override, force-approve, or admin bypass.
 */

export type ApprovalDecision = "approved" | "rejected";
export type ApprovalRequestStatus = "pending" | "approved" | "rejected";

export interface ApprovalStepDef {
  stepId: string;
  role: string;
  label?: string;
}

export interface ApprovalStep extends ApprovalStepDef {
  status: "pending" | ApprovalDecision;
  approver: string | null;
  decidedAt: string | null;
  note: string | null;
}

export interface ApprovalRequest {
  id: string;
  entityId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  status: ApprovalRequestStatus;
  steps: readonly ApprovalStep[];
}

export type ApprovalChainErrorCode =
  | "EMPTY_CHAIN"
  | "DUPLICATE_STEP"
  | "UNKNOWN_STEP"
  | "OUT_OF_ORDER"
  | "ALREADY_DECIDED"
  | "SELF_APPROVAL"
  | "DUPLICATE_APPROVER";

export class ApprovalChainError extends Error {
  readonly blocking = true;

  constructor(
    readonly code: ApprovalChainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApprovalChainError";
  }
}

function freezeRequest(request: ApprovalRequest): ApprovalRequest {
  return Object.freeze({
    ...request,
    steps: Object.freeze(request.steps.map((s) => Object.freeze({ ...s }))),
  }) as ApprovalRequest;
}

export function createChain(steps: ApprovalStepDef[]): ApprovalStepDef[] {
  if (steps.length === 0) {
    throw new ApprovalChainError("EMPTY_CHAIN", "Chain needs one step.");
  }
  const seen = new Set<string>();
  for (const step of steps) {
    if (!step.stepId || !step.role) {
      throw new ApprovalChainError(
        "UNKNOWN_STEP",
        "Every step needs a stepId and a role.",
      );
    }
    if (seen.has(step.stepId)) {
      throw new ApprovalChainError(
        "DUPLICATE_STEP",
        `Duplicate stepId: ${step.stepId}.`,
      );
    }
    seen.add(step.stepId);
  }
  return steps.map((s) => ({ ...s }));
}

let requestCounter = 0;

export function createRequest(input: {
  entityId: string;
  title: string;
  createdBy: string;
  steps: ApprovalStepDef[];
  id?: string;
}): ApprovalRequest {
  const defs = createChain(input.steps);
  requestCounter += 1;
  return freezeRequest({
    id:
      input.id ??
      `apr-${Date.now().toString(36)}-${requestCounter.toString(36)}`,
    entityId: input.entityId,
    title: input.title,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    status: "pending",
    steps: defs.map((d) => ({
      ...d,
      status: "pending" as const,
      approver: null,
      decidedAt: null,
      note: null,
    })),
  });
}

/** First step still waiting for a decision, or null when settled. */
export function currentStep(request: ApprovalRequest): ApprovalStep | null {
  return request.steps.find((s) => s.status === "pending") ?? null;
}

export function decide(
  request: ApprovalRequest,
  input: {
    stepId: string;
    approver: string;
    decision: ApprovalDecision;
    note?: string;
  },
): ApprovalRequest {
  if (request.status !== "pending") {
    throw new ApprovalChainError(
      "ALREADY_DECIDED",
      `Request ${request.id} is already ${request.status}.`,
    );
  }
  const index = request.steps.findIndex((s) => s.stepId === input.stepId);
  if (index === -1) {
    throw new ApprovalChainError(
      "UNKNOWN_STEP",
      `Unknown step: ${input.stepId}.`,
    );
  }
  const expected = currentStep(request);
  if (!expected || expected.stepId !== input.stepId) {
    throw new ApprovalChainError(
      "OUT_OF_ORDER",
      `Next step is ${expected?.stepId ?? "none"}, not ${input.stepId}.`,
    );
  }
  if (input.approver === request.createdBy) {
    throw new ApprovalChainError(
      "SELF_APPROVAL",
      "Requester cannot approve their own request.",
    );
  }
  const priorApprovers = request.steps
    .slice(0, index)
    .map((s) => s.approver);
  if (priorApprovers.includes(input.approver)) {
    throw new ApprovalChainError(
      "DUPLICATE_APPROVER",
      `${input.approver} already approved an earlier step.`,
    );
  }

  const decidedAt = new Date().toISOString();
  const steps = request.steps.map((s, i) =>
    i === index
      ? {
          ...s,
          status: input.decision,
          approver: input.approver,
          decidedAt,
          note: input.note ?? null,
        }
      : { ...s },
  );
  const status: ApprovalRequestStatus =
    input.decision === "rejected"
      ? "rejected"
      : steps.every((s) => s.status === "approved")
        ? "approved"
        : "pending";

  return freezeRequest({ ...request, steps, status });
}

export function approve(
  request: ApprovalRequest,
  input: { stepId: string; approver: string; note?: string },
): ApprovalRequest {
  return decide(request, { ...input, decision: "approved" });
}

export function reject(
  request: ApprovalRequest,
  input: { stepId: string; approver: string; note?: string },
): ApprovalRequest {
  return decide(request, { ...input, decision: "rejected" });
}

/**
 * Payload helper so every approval decision can be appended to the
 * immutable log as a VERIFICATION event. The API route composes this
 * with `ImmutableLog.recordEvent`.
 */
export function approvalDecisionPayload(
  request: ApprovalRequest,
  step: ApprovalStep,
): Record<string, unknown> {
  return {
    approval_id: request.id,
    entity_id: request.entityId,
    step_id: step.stepId,
    role: step.role,
    decision: step.status,
    approver: step.approver,
    decided_at: step.decidedAt,
    request_status: request.status,
  };
}

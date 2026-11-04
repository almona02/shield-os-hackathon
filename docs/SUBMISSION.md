# Submission readiness

## Complete before sending

- [ ] Confirm track, acceptance and final rules in the organizer portal.
- [ ] Review and deploy the tested branch through the normal workflow; main/live are not changed by this draft.
- [ ] Configure the actual model ID/endpoint available to your account. Example: `META_MODEL=muse-spark-1.3`, `META_LLAMA_URL=https://api.meta.ai/v1/responses`.
- [ ] Capture a successful risk result with model identity/source, or disclose local fallback. Never share credentials.
- [ ] Capture a real SAM category match and a negative case. Do not claim fake-invoice detection or 100% authenticity.
- [ ] Use only synthetic data in this public demo.
- [ ] Record the 90-second demo and paste its real link into the submission.
- [ ] Check demo, video and repo access in a signed-out browser.
- [ ] Explain reused Reality OS work versus the hackathon contribution, following the event's reuse rules.
- [ ] Submit before the portal deadline and save confirmation.

## Code review findings at starting commit 3ceb2998e949760a1a4ae141a9fbcf5004ec7edd

1. SAM widened prompts to machine/equipment/person, then described any detection as the requested spare part. Detection score was artificially boosted to 100.
2. API failure could yield a SAM-labeled negative result or a filename mock. Neither established image authenticity.
3. Risk source had no visible failure reason; response shape was insufficiently validated. Rejections counted as approvals, and burst logic had no time window.
4. The public tamper route used service-role UPDATE and DELETE on genesis and always reported top-level blocked=true. It could mutate the ledger if the expected protection was absent.
5. Approval state lived in a global Map and was updated before its ledger append succeeded.
6. Existing API/SQL identities and access policies are suitable only for a public synthetic demo, not secure production approvals.
7. The video script included unsupported $2 trillion and 200-workshop claims, and narrated mock output as live SAM.

## Changes prepared

Category-specific SAM prompts; non-authenticity verdicts; no mock fallback for real-image failures; bounded image fetching from a fixed CDN; API timeouts; Responses-format risk support; validated model output with explicit fallback reason; five-minute burst window excluding rejections; dangerous live tamper probe removed; Map updates after successful ledger append; stricter genesis/position verification; dynamic risk endpoint (avoids build-time cached risk results); synthetic regression tests; revised pitch and video script.

## Still unverified or unresolved

No live Meta request was made by these tests. No live database migration or enforcement probe was performed. No video was recorded. Authentication, durable/atomic approvals, anonymous SQL policies, concurrent ledger append and complete database pagination remain open. This work must not be described as a completed production hardening.

## Local validation completed

- 12 regression tests passed (provider responses mocked).
- TypeScript check passed.
- Next.js production build passed; risk endpoint confirmed dynamic in build output.
- Production-server HTTP smoke passed using synthetic requests, no provider credentials and memory storage.
- `git diff --check` passed.

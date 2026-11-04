# SHIELD.OS — 90s Demo Video

**Live:** https://shield-os-hackathon.vercel.app  
**Dashboard:** https://shield-os-hackathon.vercel.app/shield  

**Pitch line:** *SHIELD.OS — Tamper-Evident Approvals with Meta-Powered Risk Intelligence*

Do **not** run `POST /api/tamper` during recording (it attempts privileged mutations). Use `PUT /api/events` → 405 and/or a pre-captured Supabase SQL screenshot from `docs/immutability-proof.md`.

---

## Click-by-click teleprompter

Narrow mobile-width window.

### 0–15s — Mock demo rule (not SAM)

**Driver**
1. Technician role
2. Evidence → `fake-invoice.png`
3. Submit → red badge **MOCK DEMO — filename rule (not SAM)** · score 18

**You say**
> Editable approval logs are easy to rewrite after the fact.  
> This first reject is our deterministic demo rule — the filename contains “fake”, so the mock returns eighteen.  
> Separately, we will show live SAM 3.1 object localization on a real image URL.

### 15–45s — Live SAM category relevance + approve

**Driver**
1. Part = **Motor YLM-45 GENESIS**, Workshop = **Giza - Almona**
2. Evidence = machinery https URL (prefilled) → Submit
3. Hold badge: **LIVE SAM 3.1 — object localization** + objects list + relevance %  
   - If category matches → “match”  
   - If objects are person/document only → **mismatch ~35%** (honest path — still fine to show)
4. Manager → Approve
5. Terminal: `curl -X PUT https://shield-os-hackathon.vercel.app/api/events` → **405**

**You say**
> Live SAM 3.1 localizes objects and scores category relevance to the requested motor — not forensic authenticity.  
> Every action is hash-chained. Try to edit — the API returns 405. Postgres blocks UPDATE and DELETE.

### 45–90s — Dashboard + Muse Spark signals

**Driver**
1. Open `/shield`
2. **Chain verified** · map pins
3. Risk badge: **Source: muse-spark-1.3 | Meta Model API (LIVE)**
4. Point at disclaimer: score is a **signal for human review**, not fraud probability
5. Optional Network: `POST /api/risk` → `"source":"meta_model_api"`, `generated_at` fresh
6. Optional cutaway: Supabase SQL `UPDATE … HACKED` error screenshot

**You say**
> Muse Spark flags OFF_HOURS and SAME_APPROVER as signals for human review.  
> Ninety-four is an uncalibrated model score — not ninety-four percent certainty of fraud.  
> SHIELD.OS: who, where, when, what, approved by — tamper-evident. Extracted from our Reality OS governance core.

End Loom. Paste URL into README.

---

## Submission checklist

- [ ] Loom URL in README
- [ ] Live: https://shield-os-hackathon.vercel.app
- [ ] Repo: https://github.com/almona02/shield-os-hackathon
- [ ] Risk badge shows LIVE (not local_heuristic)
- [ ] SAM mock vs LIVE badges both shown once

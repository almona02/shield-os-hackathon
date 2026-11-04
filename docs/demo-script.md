# SHIELD.OS — 90s Demo Video Script (25% of score)

Record on Loom. Mobile-first UI on screen. Speak clearly.

## 0–20s — The problem

Show Technician role. Type photo name `fake-invoice.png`. Hit Submit.

> “MENA loses roughly two trillion dollars to procurement fraud.
> Without Shield, a manager edits the spreadsheet and the trail is gone.
> SAM rejects this fake invoice — score eighteen. Evidence never enters the ledger.”

## 20–50s — Immutable core

1. Submit real request: **Motor YLM-45** @ Giza Workshop with geo.
2. Switch to Manager → Approve.
3. Open DevTools / terminal: `curl -X PUT /api/events` → **405**.

> “With Shield every action is hash-chained. Try to edit — the API returns 405.
> At the database, a Postgres trigger blocks UPDATE and DELETE for every role.”

## 50–90s — Impact

Open `/shield`:

- Timeline with hashes
- Map pins at Giza
- Llama Risk Panel (seed or narrate a 2 AM pattern)

> “Llama flags off-hours approvals — high risk, bilingual EN/AR.
> This is extracted from Almona Vertical Reality OS — fifteen hundred commits,
> two hundred workshops in Egypt — now generalized for any industry.
> SHIELD.OS: who, where, when, what, approved by — immutable.”

## Cutaways (optional)

- `supabase/migrations/001_shield_events.sql` — trigger snippet
- `lib/shield-core/immutable-log.ts` — `recordEvent` only, no update/delete
